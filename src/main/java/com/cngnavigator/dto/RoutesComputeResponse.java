package com.cngnavigator.dto;

import java.util.ArrayList;
import java.util.List;

public class RoutesComputeResponse {
    private Double totalDistanceKm;
    private Integer totalDurationMinutes;
    private Integer trafficAwareDurationMinutes;
    private String encodedPolyline;
    private List<List<Double>> routeGeometry = new ArrayList<>();
    private List<RouteLegDto> legs = new ArrayList<>();
    private List<RouteAlternativeDto> alternatives = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();
    private String routeSource;
    private List<StationSummaryDto> candidateStations = new ArrayList<>();
    private StationSummaryDto recommendedStation;

    public RoutesComputeResponse() {}

    public Double getTotalDistanceKm() {
        return totalDistanceKm;
    }

    public void setTotalDistanceKm(Double totalDistanceKm) {
        this.totalDistanceKm = totalDistanceKm;
    }

    public Integer getTotalDurationMinutes() {
        return totalDurationMinutes;
    }

    public void setTotalDurationMinutes(Integer totalDurationMinutes) {
        this.totalDurationMinutes = totalDurationMinutes;
    }

    public Integer getTrafficAwareDurationMinutes() {
        return trafficAwareDurationMinutes;
    }

    public void setTrafficAwareDurationMinutes(Integer trafficAwareDurationMinutes) {
        this.trafficAwareDurationMinutes = trafficAwareDurationMinutes;
    }

    public String getEncodedPolyline() {
        return encodedPolyline;
    }

    public void setEncodedPolyline(String encodedPolyline) {
        this.encodedPolyline = encodedPolyline;
    }

    public List<List<Double>> getRouteGeometry() {
        return routeGeometry;
    }

    public void setRouteGeometry(List<List<Double>> routeGeometry) {
        this.routeGeometry = routeGeometry;
    }

    public List<RouteLegDto> getLegs() {
        return legs;
    }

    public void setLegs(List<RouteLegDto> legs) {
        this.legs = legs;
    }

    public List<RouteAlternativeDto> getAlternatives() {
        return alternatives;
    }

    public void setAlternatives(List<RouteAlternativeDto> alternatives) {
        this.alternatives = alternatives;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public String getRouteSource() {
        return routeSource;
    }

    public void setRouteSource(String routeSource) {
        this.routeSource = routeSource;
    }

    public List<StationSummaryDto> getCandidateStations() {
        return candidateStations;
    }

    public void setCandidateStations(List<StationSummaryDto> candidateStations) {
        this.candidateStations = candidateStations;
    }

    public StationSummaryDto getRecommendedStation() {
        return recommendedStation;
    }

    public void setRecommendedStation(StationSummaryDto recommendedStation) {
        this.recommendedStation = recommendedStation;
    }
}
