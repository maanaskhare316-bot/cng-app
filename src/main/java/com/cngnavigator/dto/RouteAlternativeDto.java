package com.cngnavigator.dto;

import java.util.List;

public class RouteAlternativeDto {
    private String name;
    private Double distanceKm;
    private Integer durationMinutes;
    private String description;
    private List<List<Double>> routeGeometry;

    public RouteAlternativeDto() {}

    public RouteAlternativeDto(String name, Double distanceKm, Integer durationMinutes, String description, List<List<Double>> routeGeometry) {
        this.name = name;
        this.distanceKm = distanceKm;
        this.durationMinutes = durationMinutes;
        this.description = description;
        this.routeGeometry = routeGeometry;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<List<Double>> getRouteGeometry() { return routeGeometry; }
    public void setRouteGeometry(List<List<Double>> routeGeometry) { this.routeGeometry = routeGeometry; }
}
