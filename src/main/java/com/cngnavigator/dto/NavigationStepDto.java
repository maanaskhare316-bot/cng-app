package com.cngnavigator.dto;

public class NavigationStepDto {
    private String instruction;
    private Double distanceMeters;
    private Integer durationSeconds;
    private Double startLat;
    private Double startLng;
    private Double endLat;
    private Double endLng;
    private String maneuver;

    public NavigationStepDto() {}

    public NavigationStepDto(String instruction, Double distanceMeters, Integer durationSeconds,
                             Double startLat, Double startLng, Double endLat, Double endLng, String maneuver) {
        this.instruction = instruction;
        this.distanceMeters = distanceMeters;
        this.durationSeconds = durationSeconds;
        this.startLat = startLat;
        this.startLng = startLng;
        this.endLat = endLat;
        this.endLng = endLng;
        this.maneuver = maneuver;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Double distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

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

    public Double getEndLat() {
        return endLat;
    }

    public void setEndLat(Double endLat) {
        this.endLat = endLat;
    }

    public Double getEndLng() {
        return endLng;
    }

    public void setEndLng(Double endLng) {
        this.endLng = endLng;
    }

    public String getManeuver() {
        return maneuver;
    }

    public void setManeuver(String maneuver) {
        this.maneuver = maneuver;
    }
}
