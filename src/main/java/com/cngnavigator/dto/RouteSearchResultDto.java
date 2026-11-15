package com.cngnavigator.dto;

import java.util.List;

public class RouteSearchResultDto {
    private Double totalDistanceKm;
    private Integer totalDurationMinutes;
    private List<List<Double>> routeGeometry; // list of [lat, lng] coordinates
    private List<StationSummaryDto> stations;

    // Smart Recommendations
    private StationSummaryDto bestOverall;
    private StationSummaryDto nearestOnRoute;
    private StationSummaryDto shortestQueue;

    // Alternative routes
    private List<RouteAlternativeDto> alternatives;

    // Status & telemetry
    private Boolean isDemoRoute;
    private String routeSource; // "OSRM Routing Engine", "Simulated Direct Route", "Google Directions API"
    private String message;

    public RouteSearchResultDto() {}

    public Double getTotalDistanceKm() { return totalDistanceKm; }
    public void setTotalDistanceKm(Double totalDistanceKm) { this.totalDistanceKm = totalDistanceKm; }

    public Integer getTotalDurationMinutes() { return totalDurationMinutes; }
    public void setTotalDurationMinutes(Integer totalDurationMinutes) { this.totalDurationMinutes = totalDurationMinutes; }

    public List<List<Double>> getRouteGeometry() { return routeGeometry; }
    public void setRouteGeometry(List<List<Double>> routeGeometry) { this.routeGeometry = routeGeometry; }

    public List<StationSummaryDto> getStations() { return stations; }
    public void setStations(List<StationSummaryDto> stations) { this.stations = stations; }

    public StationSummaryDto getBestOverall() { return bestOverall; }
    public void setBestOverall(StationSummaryDto bestOverall) { this.bestOverall = bestOverall; }

    public StationSummaryDto getNearestOnRoute() { return nearestOnRoute; }
    public void setNearestOnRoute(StationSummaryDto nearestOnRoute) { this.nearestOnRoute = nearestOnRoute; }

    public StationSummaryDto getShortestQueue() { return shortestQueue; }
    public void setShortestQueue(StationSummaryDto shortestQueue) { this.shortestQueue = shortestQueue; }

    public List<RouteAlternativeDto> getAlternatives() { return alternatives; }
    public void setAlternatives(List<RouteAlternativeDto> alternatives) { this.alternatives = alternatives; }

    public Boolean getIsDemoRoute() { return isDemoRoute; }
    public void setIsDemoRoute(Boolean isDemoRoute) { this.isDemoRoute = isDemoRoute; }

    public String getRouteSource() { return routeSource; }
    public void setRouteSource(String routeSource) { this.routeSource = routeSource; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
