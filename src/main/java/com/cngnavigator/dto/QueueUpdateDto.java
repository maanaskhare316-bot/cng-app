package com.cngnavigator.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class QueueUpdateDto {
    @NotNull
    private Long stationId;

    @NotNull
    @Min(0)
    private Integer vehiclesWaiting;

    private String dataSource;
    private String reportedBy;
    private Boolean isLiveSensor;
    private String adminKey;

    public QueueUpdateDto() {}

    public Long getStationId() { return stationId; }
    public void setStationId(Long stationId) { this.stationId = stationId; }

    public Integer getVehiclesWaiting() { return vehiclesWaiting; }
    public void setVehiclesWaiting(Integer vehiclesWaiting) { this.vehiclesWaiting = vehiclesWaiting; }

    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public Boolean getIsLiveSensor() { return isLiveSensor; }
    public void setIsLiveSensor(Boolean isLiveSensor) { this.isLiveSensor = isLiveSensor; }

    public String getAdminKey() { return adminKey; }
    public void setAdminKey(String adminKey) { this.adminKey = adminKey; }
}
