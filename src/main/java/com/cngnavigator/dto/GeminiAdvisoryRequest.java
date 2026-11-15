package com.cngnavigator.dto;

import java.util.List;

public class GeminiAdvisoryRequest {
    private String origin;
    private String destination;
    private Double vehicleTankCapacityKg = 10.0; // standard CNG tank: 8-12 kg
    private Double currentFuelPercentage = 25.0; // remaining fuel %
    private Double estimatedVehicleMileageKmPerKg = 24.0; // typical sedan/hatchback CNG mileage
    private List<StationSummaryDto> candidateStations;

    public GeminiAdvisoryRequest() {}

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public Double getVehicleTankCapacityKg() { return vehicleTankCapacityKg; }
    public void setVehicleTankCapacityKg(Double vehicleTankCapacityKg) { this.vehicleTankCapacityKg = vehicleTankCapacityKg; }

    public Double getCurrentFuelPercentage() { return currentFuelPercentage; }
    public void setCurrentFuelPercentage(Double currentFuelPercentage) { this.currentFuelPercentage = currentFuelPercentage; }

    public Double getEstimatedVehicleMileageKmPerKg() { return estimatedVehicleMileageKmPerKg; }
    public void setEstimatedVehicleMileageKmPerKg(Double estimatedVehicleMileageKmPerKg) { this.estimatedVehicleMileageKmPerKg = estimatedVehicleMileageKmPerKg; }

    public List<StationSummaryDto> getCandidateStations() { return candidateStations; }
    public void setCandidateStations(List<StationSummaryDto> candidateStations) { this.candidateStations = candidateStations; }
}
