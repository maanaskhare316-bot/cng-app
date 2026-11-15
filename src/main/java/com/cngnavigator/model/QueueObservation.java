package com.cngnavigator.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_observations", indexes = {
    @Index(name = "idx_queue_station_time", columnList = "station_id, createdAt")
})
public class QueueObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "station_id", nullable = false)
    private Long stationId;

    @Column(nullable = false)
    private Integer vehiclesWaiting;

    @Column(nullable = false)
    private Integer estimatedWaitMinutes;

    @Column(nullable = false, length = 100)
    private String dataSource; // "Simulated Demo Data", "Authorized Operator", "Camera AI Sensor", "Verified User Report"

    @Column(length = 100)
    private String reportedBy;

    @Column(nullable = false)
    private Boolean isLiveSensor = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public QueueObservation() {
        this.createdAt = LocalDateTime.now();
    }

    public QueueObservation(Long stationId, Integer vehiclesWaiting, Integer estimatedWaitMinutes, 
                            String dataSource, String reportedBy, Boolean isLiveSensor) {
        this();
        this.stationId = stationId;
        this.vehiclesWaiting = vehiclesWaiting;
        this.estimatedWaitMinutes = estimatedWaitMinutes;
        this.dataSource = dataSource;
        this.reportedBy = reportedBy;
        this.isLiveSensor = isLiveSensor;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStationId() { return stationId; }
    public void setStationId(Long stationId) { this.stationId = stationId; }

    public Integer getVehiclesWaiting() { return vehiclesWaiting; }
    public void setVehiclesWaiting(Integer vehiclesWaiting) { this.vehiclesWaiting = vehiclesWaiting; }

    public Integer getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
    public void setEstimatedWaitMinutes(Integer estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }

    public String getDataSource() { return dataSource; }
    public void setDataSource(String dataSource) { this.dataSource = dataSource; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public Boolean getIsLiveSensor() { return isLiveSensor; }
    public void setIsLiveSensor(Boolean isLiveSensor) { this.isLiveSensor = isLiveSensor; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
