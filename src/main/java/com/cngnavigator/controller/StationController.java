package com.cngnavigator.controller;

import com.cngnavigator.dto.RouteSearchRequest;
import com.cngnavigator.dto.RouteSearchResultDto;
import com.cngnavigator.dto.StationSummaryDto;
import com.cngnavigator.model.Station;
import com.cngnavigator.service.RecommendationService;
import com.cngnavigator.service.RoutingService;
import com.cngnavigator.service.StationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
@CrossOrigin(origins = "*")
public class StationController {

    private final StationService stationService;
    private final RoutingService routingService;
    private final RecommendationService recommendationService;

    public StationController(StationService stationService,
                             RoutingService routingService,
                             RecommendationService recommendationService) {
        this.stationService = stationService;
        this.routingService = routingService;
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public ResponseEntity<List<StationSummaryDto>> getAllStations() {
        return ResponseEntity.ok(stationService.getAllStationSummaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StationSummaryDto> getStationById(@PathVariable Long id) {
        return stationService.getStationSummary(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/search-route")
    public ResponseEntity<RouteSearchResultDto> searchRouteStations(@RequestBody RouteSearchRequest request) {
        if (request.getStartLat() == null || request.getStartLng() == null ||
            request.getDestLat() == null || request.getDestLng() == null) {
            return ResponseEntity.badRequest().build();
        }

        RouteSearchResultDto result = routingService.calculateRoute(request);
        recommendationService.applyRecommendations(result);

        return ResponseEntity.ok(result);
    }
}
