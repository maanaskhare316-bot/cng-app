package com.cngnavigator.dto;

import java.util.List;

public class GeminiChatRequest {
    private String message;
    private String routeSummary;
    private List<StationSummaryDto> currentStations;
    private Double currentFuelPercentage;

    public GeminiChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRouteSummary() { return routeSummary; }
    public void setRouteSummary(String routeSummary) { this.routeSummary = routeSummary; }

    public List<StationSummaryDto> getCurrentStations() { return currentStations; }
    public void setCurrentStations(List<StationSummaryDto> currentStations) { this.currentStations = currentStations; }

    public Double getCurrentFuelPercentage() { return currentFuelPercentage; }
    public void setCurrentFuelPercentage(Double currentFuelPercentage) { this.currentFuelPercentage = currentFuelPercentage; }
}
