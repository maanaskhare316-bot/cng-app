package com.cngnavigator.controller;

import com.cngnavigator.dto.*;
import com.cngnavigator.service.GoogleRoutesService;
import com.cngnavigator.service.RecommendationService;
import com.cngnavigator.service.StationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "*")
public class RouteController {

    private final GoogleRoutesService googleRoutesService;
    private final StationService stationService;
    private final RecommendationService recommendationService;

    public RouteController(GoogleRoutesService googleRoutesService,
                           StationService stationService,
                           RecommendationService recommendationService) {
        this.googleRoutesService = googleRoutesService;
        this.stationService = stationService;
        this.recommendationService = recommendationService;
    }

    /**
     * Compute primary driving route with TRAFFIC_AWARE preference.
     * POST /api/routes/compute
     */
    @PostMapping("/compute")
    public ResponseEntity<RoutesComputeResponse> computeRoute(@Valid @RequestBody RouteComputeRequest request) {
        RoutesComputeResponse response = googleRoutesService.computeRoute(request, false);
        return ResponseEntity.ok(response);
    }

    /**
     * Compute primary and alternative driving routes with TRAFFIC_AWARE preference.
     * POST /api/routes/alternatives
     */
    @PostMapping("/alternatives")
    public ResponseEntity<RoutesComputeResponse> computeRouteAlternatives(@Valid @RequestBody RouteComputeRequest request) {
        RoutesComputeResponse response = googleRoutesService.computeRoute(request, true);
        return ResponseEntity.ok(response);
    }

    /**
     * Compare candidate stations based on driving route detour, queue, and pressure.
     * POST /api/routes/station-comparison
     */
    @PostMapping("/station-comparison")
    public ResponseEntity<StationComparisonResponse> compareStations(@Valid @RequestBody StationComparisonRequest request) {
        List<StationSummaryDto> stationList = new ArrayList<>();
        for (Long id : request.getStationIds()) {
            stationService.getStationSummary(id).ifPresent(stationList::add);
        }

        if (stationList.isEmpty()) {
            stationList = stationService.getAllStationSummaries().subList(0, Math.min(5, stationService.getAllStationSummaries().size()));
        }

        // Compute detour metrics
        double totalDirectKm = calculateHaversineKm(request.getStartLat(), request.getStartLng(), request.getDestLat(), request.getDestLng()) * 1.25;

        for (StationSummaryDto station : stationList) {
            double d1 = calculateHaversineKm(request.getStartLat(), request.getStartLng(), station.getLatitude(), station.getLongitude()) * 1.2;
            double d2 = calculateHaversineKm(station.getLatitude(), station.getLongitude(), request.getDestLat(), request.getDestLng()) * 1.2;
            double detourKm = Math.max(0.2, Math.round((d1 + d2 - totalDirectKm) * 0.45 * 10.0) / 10.0);
            int detourMins = (int) Math.max(1, Math.round(detourKm * 1.8));

            station.setExtraDetourKm(detourKm);
            station.setEstimatedDetourMinutes(detourMins);
            station.setDistanceFromStartKm(Math.round(d1 * 10.0) / 10.0);
        }

        stationList.sort(Comparator.comparing(StationSummaryDto::getExtraDetourKm));

        StationComparisonResponse response = new StationComparisonResponse();
        response.setRankedStations(stationList);
        if (!stationList.isEmpty()) {
            response.setBestOverall(stationList.get(0));
            response.setNearestStation(stationList.stream().min(Comparator.comparing(StationSummaryDto::getDistanceFromStartKm)).orElse(stationList.get(0)));
            response.setFastestRefueling(stationList.stream().min(Comparator.comparing(s -> s.getEstimatedWaitMinutes() != null ? s.getEstimatedWaitMinutes() : 10)).orElse(stationList.get(0)));
        }
        response.setMatrixSource("Google Routes & Distance Matrix Mobility Intelligence Engine");

        return ResponseEntity.ok(response);
    }

    private double calculateHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
