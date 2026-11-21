package com.cngnavigator.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class RouteComputeRequest {

    @NotNull(message = "Start latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double startLat;

    @NotNull(message = "Start longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double startLng;

    private String startAddress;

    @NotNull(message = "Destination latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double destLat;

    @NotNull(message = "Destination longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double destLng;

    private String destAddress;

    private String routingPreference = "TRAFFIC_AWARE"; // TRAFFIC_AWARE or TRAFFIC_AWARE_OPTIMAL

    private Double maxDetourKm = 5.0;

    private Long selectedStationId;

    public RouteComputeRequest() {}

    public Double getStartLat() {
        return startLat;
    }

    public void setStartLat(Double startLat) {
        this.startLat = startLat;
    }

    public Double getStartLng() {
        return startLng;
    }

    public void setStartLng(Double startLng) {
        this.startLng = startLng;
    }

    public String getStartAddress() {
        return startAddress;
    }

    public void setStartAddress(String startAddress) {
        this.startAddress = startAddress;
    }

    public Double getDestLat() {
        return destLat;
    }

    public void setDestLat(Double destLat) {
        this.destLat = destLat;
    }

    public Double getDestLng() {
        return destLng;
    }

    public void setDestLng(Double destLng) {
        this.destLng = destLng;
    }

    public String getDestAddress() {
        return destAddress;
    }

    public void setDestAddress(String destAddress) {
        this.destAddress = destAddress;
    }

    public String getRoutingPreference() {
        return routingPreference;
    }

    public void setRoutingPreference(String routingPreference) {
        this.routingPreference = routingPreference;
    }

    public Double getMaxDetourKm() {
        return maxDetourKm;
    }

    public void setMaxDetourKm(Double maxDetourKm) {
        this.maxDetourKm = maxDetourKm;
    }

    public Long getSelectedStationId() {
        return selectedStationId;
    }

    public void setSelectedStationId(Long selectedStationId) {
        this.selectedStationId = selectedStationId;
    }
}
