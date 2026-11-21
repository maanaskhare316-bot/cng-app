package com.cngnavigator.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class StationComparisonRequest {

    @NotNull(message = "Start latitude is required")
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    private Double startLat;

    @NotNull(message = "Start longitude is required")
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    private Double startLng;

    @NotNull(message = "Destination latitude is required")
    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    private Double destLat;

    @NotNull(message = "Destination longitude is required")
    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    private Double destLng;

    @NotEmpty(message = "Station IDs list cannot be empty")
    private List<Long> stationIds;

    public StationComparisonRequest() {}

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

    public List<Long> getStationIds() {
        return stationIds;
    }

    public void setStationIds(List<Long> stationIds) {
        this.stationIds = stationIds;
    }
}
