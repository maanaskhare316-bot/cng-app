package com.cngnavigator.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stations")
public class Station {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String operator; // e.g. IGL, Adani Total Gas, Mahanagar Gas, HPCL, BPCL, IOCL

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Boolean verifiedOpen = true;

    private Double verifiedPricePerKg; // in INR or local currency

    @Column(nullable = false)
    private Integer dispenserCapacityPerHour = 30; // nominal vehicles that can be serviced per hour

    private Integer activeDispensers = 4;

    private String operatingHours = "24x7";

    private String amenities = "Restroom, Convenience Store, Air Check, Drinking Water";

    private String contactPhone;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Station() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public Station(String name, String operator, String address, String city, String state, 
                   Double latitude, Double longitude, Boolean verifiedOpen, Double verifiedPricePerKg, 
                   Integer dispenserCapacityPerHour, Integer activeDispensers, String operatingHours, String amenities) {
        this();
        this.name = name;
        this.operator = operator;
        this.address = address;
        this.city = city;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
        this.verifiedOpen = verifiedOpen;
        this.verifiedPricePerKg = verifiedPricePerKg;
        this.dispenserCapacityPerHour = dispenserCapacityPerHour;
        this.activeDispensers = activeDispensers;
        this.operatingHours = operatingHours;
        this.amenities = amenities;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

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

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
