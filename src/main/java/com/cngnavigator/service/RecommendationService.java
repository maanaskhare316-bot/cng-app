package com.cngnavigator.service;

import com.cngnavigator.dto.RouteSearchResultDto;
import com.cngnavigator.dto.StationSummaryDto;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    public void applyRecommendations(RouteSearchResultDto routeResult) {
        List<StationSummaryDto> stations = routeResult.getStations();
        if (stations == null || stations.isEmpty()) {
            return;
        }

        // Filter active/open stations
        List<StationSummaryDto> openStations = stations.stream()
                .filter(s -> Boolean.TRUE.equals(s.getVerifiedOpen()))
                .collect(Collectors.toList());

        if (openStations.isEmpty()) {
            openStations = stations; // fallback if all marked closed
        }

        // 1. NEAREST ON ROUTE
        // Station with minimum extra detour / distance from route
        StationSummaryDto nearest = openStations.stream()
                .min(Comparator.comparingDouble(s -> s.getExtraDetourKm() != null ? s.getExtraDetourKm() : s.getDistanceFromRouteKm()))
                .orElse(openStations.get(0));

        nearest.setRecommendationCategory("NEAREST_ON_ROUTE");
        nearest.setRecommendationReason(String.format(
                "Minimal detour off main corridor: only %.1f km extra travel (+%d min detour). Current queue is %d vehicles (~%d min wait).",
                nearest.getExtraDetourKm(),
                nearest.getEstimatedDetourMinutes(),
                nearest.getVehiclesWaiting() != null ? nearest.getVehiclesWaiting() : 0,
                nearest.getEstimatedWaitMinutes() != null ? nearest.getEstimatedWaitMinutes() : 0
        ));
        routeResult.setNearestOnRoute(nearest);

        // 2. SHORTEST QUEUE
        // Station with minimum estimated waiting time
        StationSummaryDto shortestQueue = openStations.stream()
                .min(Comparator.comparingInt(s -> s.getEstimatedWaitMinutes() != null ? s.getEstimatedWaitMinutes() : 999))
                .orElse(openStations.get(0));

        if (shortestQueue.getRecommendationCategory() == null) {
            shortestQueue.setRecommendationCategory("SHORTEST_QUEUE");
        }
        shortestQueue.setRecommendationReason(String.format(
                "Fastest turnaround: only %d vehicle(s) in line (~%d min estimated wait). Detour: %.1f km.",
                shortestQueue.getVehiclesWaiting() != null ? shortestQueue.getVehiclesWaiting() : 0,
                shortestQueue.getEstimatedWaitMinutes() != null ? shortestQueue.getEstimatedWaitMinutes() : 0,
                shortestQueue.getExtraDetourKm() != null ? shortestQueue.getExtraDetourKm() : 0.0
        ));
        routeResult.setShortestQueue(shortestQueue);

        // 3. BEST OVERALL
        // Multi-criteria smart scoring formula:
        // Total Time Cost = (Detour Minutes * 1.4) + (Queue Wait Minutes * 1.1)
        // Pressure Reliability Adjustment:
        //   - If FRESH and pressure >= 200 bar: -5 min equivalent bonus (excellent full-tank fill)
        //   - If FRESH and pressure < 175 bar: +6 min penalty (underfilled tank means refilling sooner)
        //   - If STALE or UNAVAILABLE: +4 min penalty for data uncertainty (per requirement: never recommend on stale pressure)
        // Price Bonus: small adjustment based on verified price
        for (StationSummaryDto s : openStations) {
            double detourMins = s.getEstimatedDetourMinutes() != null ? s.getEstimatedDetourMinutes() : 5.0;
            double waitMins = s.getEstimatedWaitMinutes() != null ? s.getEstimatedWaitMinutes() : 15.0;
            
            double cost = (detourMins * 1.4) + (waitMins * 1.1);

            // Pressure data freshness & reliability check
            String pFreshness = s.getPressureFreshness();
            Double pBar = s.getCurrentPressureBar();

            if ("FRESH".equalsIgnoreCase(pFreshness) && pBar != null) {
                if (pBar >= 200.0) {
                    cost -= 5.0; // High pressure bonus: full tank capacity
                } else if (pBar < 175.0) {
                    cost += 6.0; // Low pressure penalty: inadequate fill
                }
            } else {
                // Rule: Do not recommend a station based on pressure when its reading is missing or stale
                // Add uncertainty penalty so stale stations are not favored for pressure
                cost += 4.0;
            }

            // Price consideration if verified
            if (s.getVerifiedPricePerKg() != null && s.getVerifiedPricePerKg() < 80.0) {
                cost -= 1.0;
            }

            s.setScore(Math.round(cost * 10.0) / 10.0);
        }

        StationSummaryDto bestOverall = openStations.stream()
                .min(Comparator.comparingDouble(StationSummaryDto::getScore))
                .orElse(openStations.get(0));

        bestOverall.setRecommendationCategory("BEST_OVERALL");

        StringBuilder reason = new StringBuilder();
        reason.append(String.format("Superior overall balance: %.1f km detour (+%d min) and %d vehicles in queue (~%d min wait). ",
                bestOverall.getExtraDetourKm(),
                bestOverall.getEstimatedDetourMinutes(),
                bestOverall.getVehiclesWaiting() != null ? bestOverall.getVehiclesWaiting() : 0,
                bestOverall.getEstimatedWaitMinutes() != null ? bestOverall.getEstimatedWaitMinutes() : 0
        ));

        if ("FRESH".equalsIgnoreCase(bestOverall.getPressureFreshness()) && bestOverall.getCurrentPressureBar() != null) {
            reason.append(String.format("Verified fresh pressure at %.1f bar guarantees an optimal full cylinder fill.", 
                    bestOverall.getCurrentPressureBar()));
        } else {
            reason.append("Provides the lowest combined transit and queue delay on your route.");
        }

        bestOverall.setRecommendationReason(reason.toString());
        routeResult.setBestOverall(bestOverall);
    }
}
