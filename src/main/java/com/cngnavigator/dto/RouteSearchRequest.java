package com.cngnavigator.dto;

import java.util.List;

public class RouteSearchRequest {
    private Double startLat;
    private Double startLng;
    private String startAddress;

    private Double destLat;
    private Double destLng;
    private String destAddress;

    private Double maxDetourKm = 5.0; // configurable search radius/detour
    private Long selectedStationId; // when user selects a station to add as stop

    public RouteSearchRequest() {}

    public RouteSearchRequest(Double startLat, Double startLng, String startAddress, 
                              Double destLat, Double destLng, String destAddress, Double maxDetourKm) {
        this.startLat = startLat;
        this.startLng = startLng;
        this.startAddress = startAddress;
        this.destLat = destLat;
        this.destLng = destLng;
        this.destAddress = destAddress;
        this.maxDetourKm = (maxDetourKm != null && maxDetourKm > 0) ? maxDetourKm : 5.0;
    }

    public Double getStartLat() { return startLat; }
    public void setStartLat(Double startLat) { this.startLat = startLat; }

    public Double getStartLng() { return startLng; }
    public void setStartLng(Double startLng) { this.startLng = startLng; }

    public String getStartAddress() { return startAddress; }
    public void setStartAddress(String startAddress) { this.startAddress = startAddress; }

    public Double getDestLat() { return destLat; }
    public void setDestLat(Double destLat) { this.destLat = destLat; }

    public Double getDestLng() { return destLng; }
    public void setDestLng(Double destLng) { this.destLng = destLng; }

    public String getDestAddress() { return destAddress; }
    public void setDestAddress(String destAddress) { this.destAddress = destAddress; }

    public Double getMaxDetourKm() { return maxDetourKm; }
    public void setMaxDetourKm(Double maxDetourKm) { this.maxDetourKm = maxDetourKm; }

    public Long getSelectedStationId() { return selectedStationId; }
    public void setSelectedStationId(Long selectedStationId) { this.selectedStationId = selectedStationId; }
}
