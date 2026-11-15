package com.cngnavigator.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pressure_readings", indexes = {
    @Index(name = "idx_pressure_station_time", columnList = "station_id, createdAt")
})
public class PressureReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "station_id", nullable = false)
    private Long stationId;

    @Column(nullable = false)
    private Double pressureBar; // e.g., 205.5 bar

    @Column(nullable = false)
    private Double minSafeLimitBar = 180.0;

    @Column(nullable = false)
    private Double maxSafeLimitBar = 220.0;

    @Column(nullable = false, length = 50)
    private String sensorStatus = "ONLINE"; // ONLINE, DEGRADED, OFFLINE, SIMULATED

    @Column(nullable = false, length = 100)
    private String dataSource; // "Simulated Demo Data", "SCADA Pressure Sensor", "IoT Dispenser Telemetry"

    @Column(nullable = false)
    private Boolean isLiveSensor = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public PressureReading() {
        this.createdAt = LocalDateTime.now();
    }

    public PressureReading(Long stationId, Double pressureBar, Double minSafeLimitBar, 
                           Double maxSafeLimitBar, String sensorStatus, String dataSource, Boolean isLiveSensor) {
        this();
        this.stationId = stationId;
        this.pressureBar = pressureBar;
        this.minSafeLimitBar = minSafeLimitBar;
        this.maxSafeLimitBar = maxSafeLimitBar;
        this.sensorStatus = sensorStatus;
        this.dataSource = dataSource;
        this.isLiveSensor = isLiveSensor;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
