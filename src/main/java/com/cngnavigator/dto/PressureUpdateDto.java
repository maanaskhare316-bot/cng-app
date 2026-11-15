package com.cngnavigator.dto;

import jakarta.validation.constraints.NotNull;

public class PressureUpdateDto {
    @NotNull
    private Long stationId;

    @NotNull
    private Double pressureBar;

    private Double minSafeLimitBar;
    private Double maxSafeLimitBar;
    private String sensorStatus; // ONLINE, DEGRADED, OFFLINE
    private String dataSource;
    private Boolean isLiveSensor;
    private String adminKey;

    public PressureUpdateDto() {}

    public Long getStationId() { return stationId; }
    public void setStationId(Long stationId) { this.stationId = stationId; }

    public Double getPressureBar() { return pressureBar; }
    public void setPressureBar(Double pressureBar) { this.pressureBar = pressureBar; }

    public Double getMinSafeLimitBar() { return minSafeLimitBar; }
    public void setMinSafeLimitBar(Double minSafeLimitBar) { this.minSafeLimitBar = minSafeLimitBar; }

    public Double getMaxSafeLimitBar() { return maxSafeLimitBar; }
    public void setMaxSafeLimitBar(Double maxSafeLimitBar) { this.maxSafeLimitBar = maxSafeLimitBar; }

    public String getSensorStatus() { return sensorStatus; }
    public void setSensorStatus(String sensorStatus) { this.sensorStatus = sensorStatus; }

    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }

    public Boolean getIsLiveSensor() { return isLiveSensor; }
    public void setIsLiveSensor(Boolean isLiveSensor) { this.isLiveSensor = isLiveSensor; }

    public String getAdminKey() { return adminKey; }
    public void setAdminKey(String adminKey) { this.adminKey = adminKey; }
}
