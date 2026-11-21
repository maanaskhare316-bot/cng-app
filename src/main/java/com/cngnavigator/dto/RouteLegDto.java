package com.cngnavigator.dto;

import java.util.ArrayList;
import java.util.List;

public class RouteLegDto {
    private Double distanceMeters;
    private Integer durationSeconds;
    private Integer staticDurationSeconds;
    private String startAddress;
    private String endAddress;
    private List<NavigationStepDto> steps = new ArrayList<>();

    public RouteLegDto() {}

    public RouteLegDto(Double distanceMeters, Integer durationSeconds, Integer staticDurationSeconds) {
        this.distanceMeters = distanceMeters;
        this.durationSeconds = durationSeconds;
        this.staticDurationSeconds = staticDurationSeconds;
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

    public Integer getStaticDurationSeconds() {
        return staticDurationSeconds;
    }

    public void setStaticDurationSeconds(Integer staticDurationSeconds) {
        this.staticDurationSeconds = staticDurationSeconds;
    }

    public String getStartAddress() {
        return startAddress;
    }

    public void setStartAddress(String startAddress) {
        this.startAddress = startAddress;
    }

    public String getEndAddress() {
        return endAddress;
    }

    public void setEndAddress(String endAddress) {
        this.endAddress = endAddress;
    }

    public List<NavigationStepDto> getSteps() {
        return steps;
    }

    public void setSteps(List<NavigationStepDto> steps) {
        this.steps = steps;
    }
}
