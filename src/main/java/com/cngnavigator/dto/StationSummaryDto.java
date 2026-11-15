package com.cngnavigator.dto;

import java.time.LocalDateTime;

public class StationSummaryDto {
    private Long id;
    private String name;
    private String operator;
    private String address;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private Boolean verifiedOpen;
    private Double verifiedPricePerKg;
    private Integer dispenserCapacityPerHour;
    private Integer activeDispensers;
    private String operatingHours;
    private String amenities;

    // Route-specific metrics
    private Double distanceFromRouteKm;
    private Double extraDetourKm;
    private Integer estimatedDetourMinutes;
    private Double distanceFromStartKm;

    // Queue monitoring
    private Integer vehiclesWaiting;
    private Integer estimatedWaitMinutes;
    private String queueDataSource;
    private LocalDateTime queueUpdatedAt;
    private String queueFreshness; // "FRESH", "STALE", "SIMULATED"
    private Boolean isQueueLive;

    // Pressure monitoring
    private Double currentPressureBar;
    private Double minSafeLimitBar;
    private Double maxSafeLimitBar;
    private String sensorStatus;
    private String pressureDataSource;
    private LocalDateTime pressureUpdatedAt;
    private String pressureFreshness; // "FRESH", "STALE", "UNAVAILABLE", "SIMULATED"
    private Boolean isPressureLive;

    // Smart Recommendation
    private String recommendationCategory; // "BEST_OVERALL", "NEAREST_ON_ROUTE", "SHORTEST_QUEUE", null
    private String recommendationReason;
    private Double score;

    public StationSummaryDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Boolean getVerifiedOpen() { return verifiedOpen; }
    public void setVerifiedOpen(Boolean verifiedOpen) { this.verifiedOpen = verifiedOpen; }

    public Double getVerifiedPricePerKg() { return verifiedPricePerKg; }
    public void setVerifiedPricePerKg(Double verifiedPricePerKg) { this.verifiedPricePerKg = verifiedPricePerKg; }

    public Integer getDispenserCapacityPerHour() { return dispenserCapacityPerHour; }
    public void setDispenserCapacityPerHour(Integer dispenserCapacityPerHour) { this.dispenserCapacityPerHour = dispenserCapacityPerHour; }

    public Integer getActiveDispensers() { return activeDispensers; }
    public void setActiveDispensers(Integer activeDispensers) { this.activeDispensers = activeDispensers; }

    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }

    public String getAmenities() { return amenities; }
    public void setAmenities(String amenities) { this.amenities = amenities; }

    public Double getDistanceFromRouteKm() { return distanceFromRouteKm; }
    public void setDistanceFromRouteKm(Double distanceFromRouteKm) { this.distanceFromRouteKm = distanceFromRouteKm; }

    public Double getExtraDetourKm() { return extraDetourKm; }
    public void setExtraDetourKm(Double extraDetourKm) { this.extraDetourKm = extraDetourKm; }

    public Integer getEstimatedDetourMinutes() { return estimatedDetourMinutes; }
    public void setEstimatedDetourMinutes(Integer estimatedDetourMinutes) { this.estimatedDetourMinutes = estimatedDetourMinutes; }

    public Double getDistanceFromStartKm() { return distanceFromStartKm; }
    public void setDistanceFromStartKm(Double distanceFromStartKm) { this.distanceFromStartKm = distanceFromStartKm; }

    public Integer getVehiclesWaiting() { return vehiclesWaiting; }
    public void setVehiclesWaiting(Integer vehiclesWaiting) { this.vehiclesWaiting = vehiclesWaiting; }

    public Integer getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(Integer estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }

    public String getQueueDataSource() { return queueDataSource; }
    public void setQueueDataSource(String queueDataSource) { this.queueDataSource = queueDataSource; }

    public LocalDateTime getQueueUpdatedAt() { return queueUpdatedAt; }
    public void setQueueUpdatedAt(LocalDateTime queueUpdatedAt) { this.queueUpdatedAt = queueUpdatedAt; }

    public String getQueueFreshness() { return queueFreshness; }
    public void setQueueFreshness(String queueFreshness) { this.queueFreshness = queueFreshness; }

    public Boolean getIsQueueLive() { return isQueueLive; }
    public void setIsQueueLive(Boolean isQueueLive) { this.isQueueLive = isQueueLive; }

    public Double getCurrentPressureBar() { return currentPressureBar; }
    public void setCurrentPressureBar(Double currentPressureBar) { this.currentPressureBar = currentPressureBar; }

    public Double getMinSafeLimitBar() { return minSafeLimitBar; }
    public void setMinSafeLimitBar(Double minSafeLimitBar) { this.minSafeLimitBar = minSafeLimitBar; }

    public Double getMaxSafeLimitBar() { return maxSafeLimitBar; }
    public void setMaxSafeLimitBar(Double maxSafeLimitBar) { this.maxSafeLimitBar = maxSafeLimitBar; }

    public String getSensorStatus() { return sensorStatus; }
    public void setSensorStatus(String sensorStatus) { this.sensorStatus = sensorStatus; }

    public String getPressureDataSource() { return pressureDataSource; }
    public void setPressureDataSource(String pressureDataSource) { this.pressureDataSource = pressureDataSource; }

    public LocalDateTime getPressureUpdatedAt() { return pressureUpdatedAt; }
    public void setPressureUpdatedAt(LocalDateTime pressureUpdatedAt) { this.pressureUpdatedAt = pressureUpdatedAt; }

    public String getPressureFreshness() { return pressureFreshness; }
    public void setPressureFreshness(String pressureFreshness) { this.pressureFreshness = pressureFreshness; }

    public Boolean getIsPressureLive() { return isPressureLive; }
    public void setIsPressureLive(Boolean isPressureLive) { this.isPressureLive = isPressureLive; }

    public String getRecommendationCategory() { return recommendationCategory; }
    public void setRecommendationCategory(String recommendationCategory) { this.recommendationCategory = recommendationCategory; }

    public String getRecommendationReason() { return recommendationReason; }
    public void setRecommendationReason(String recommendationReason) { this.recommendationReason = recommendationReason; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
}
