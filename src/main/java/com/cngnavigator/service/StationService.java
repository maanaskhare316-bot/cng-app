package com.cngnavigator.service;

import com.cngnavigator.dto.PressureUpdateDto;
import com.cngnavigator.dto.QueueUpdateDto;
import com.cngnavigator.dto.StationSummaryDto;
import com.cngnavigator.model.PressureReading;
import com.cngnavigator.model.QueueObservation;
import com.cngnavigator.model.Station;
import com.cngnavigator.repository.PressureReadingRepository;
import com.cngnavigator.repository.QueueObservationRepository;
import com.cngnavigator.repository.StationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StationService {

    private final StationRepository stationRepository;
    private final QueueObservationRepository queueObservationRepository;
    private final PressureReadingRepository pressureReadingRepository;

    public StationService(StationRepository stationRepository,
                          QueueObservationRepository queueObservationRepository,
                          PressureReadingRepository pressureReadingRepository) {
        this.stationRepository = stationRepository;
        this.queueObservationRepository = queueObservationRepository;
        this.pressureReadingRepository = pressureReadingRepository;
    }

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    public Optional<Station> getStationById(Long id) {
        return stationRepository.findById(id);
    }

    public Station saveStation(Station station) {
        return stationRepository.save(station);
    }

    public void deleteStation(Long id) {
        stationRepository.deleteById(id);
    }

    public List<StationSummaryDto> getAllStationSummaries() {
        return stationRepository.findAll().stream()
                .map(this::buildSummaryDto)
                .collect(Collectors.toList());
    }

    public Optional<StationSummaryDto> getStationSummary(Long id) {
        return stationRepository.findById(id).map(this::buildSummaryDto);
    }

    public StationSummaryDto buildSummaryDto(Station station) {
        StationSummaryDto dto = new StationSummaryDto();
        dto.setId(station.getId());
        dto.setName(station.getName());
        dto.setOperator(station.getOperator());
        dto.setAddress(station.getAddress());
        dto.setCity(station.getCity());
        dto.setState(station.getState());
        dto.setLatitude(station.getLatitude());
        dto.setLongitude(station.getLongitude());
        dto.setVerifiedOpen(station.getVerifiedOpen());
        dto.setVerifiedPricePerKg(station.getVerifiedPricePerKg());
        dto.setDispenserCapacityPerHour(station.getDispenserCapacityPerHour());
        dto.setActiveDispensers(station.getActiveDispensers());
        dto.setOperatingHours(station.getOperatingHours());
        dto.setAmenities(station.getAmenities());

        // Queue telemetry
        Optional<QueueObservation> latestQueue = queueObservationRepository
                .findFirstByStationIdOrderByCreatedAtDesc(station.getId());
        if (latestQueue.isPresent()) {
            QueueObservation q = latestQueue.get();
            dto.setVehiclesWaiting(q.getVehiclesWaiting());
            dto.setEstimatedWaitMinutes(q.getEstimatedWaitMinutes());
            dto.setQueueDataSource(q.getDataSource());
            dto.setQueueUpdatedAt(q.getCreatedAt());
            dto.setIsQueueLive(q.getIsLiveSensor());

            Duration age = Duration.between(q.getCreatedAt(), LocalDateTime.now());
            if (Boolean.TRUE.equals(q.getIsLiveSensor()) && age.toMinutes() <= 15) {
                dto.setQueueFreshness("FRESH");
            } else if (Boolean.TRUE.equals(q.getIsLiveSensor())) {
                dto.setQueueFreshness("STALE");
            } else {
                dto.setQueueFreshness("SIMULATED");
            }
        } else {
            dto.setVehiclesWaiting(0);
            dto.setEstimatedWaitMinutes(0);
            dto.setQueueDataSource("No queue reports yet");
            dto.setQueueFreshness("UNAVAILABLE");
            dto.setIsQueueLive(false);
        }

        // Pressure telemetry
        Optional<PressureReading> latestPressure = pressureReadingRepository
                .findFirstByStationIdOrderByCreatedAtDesc(station.getId());
        if (latestPressure.isPresent()) {
            PressureReading p = latestPressure.get();
            dto.setCurrentPressureBar(p.getPressureBar());
            dto.setMinSafeLimitBar(p.getMinSafeLimitBar());
            dto.setMaxSafeLimitBar(p.getMaxSafeLimitBar());
            dto.setSensorStatus(p.getSensorStatus());
            dto.setPressureDataSource(p.getDataSource());
            dto.setPressureUpdatedAt(p.getCreatedAt());
            dto.setIsPressureLive(p.getIsLiveSensor());

            Duration age = Duration.between(p.getCreatedAt(), LocalDateTime.now());
            if ("OFFLINE".equalsIgnoreCase(p.getSensorStatus())) {
                dto.setPressureFreshness("UNAVAILABLE");
            } else if (Boolean.TRUE.equals(p.getIsLiveSensor()) && age.toMinutes() <= 20) {
                dto.setPressureFreshness("FRESH");
            } else if (Boolean.TRUE.equals(p.getIsLiveSensor())) {
                dto.setPressureFreshness("STALE");
            } else {
                dto.setPressureFreshness("SIMULATED");
            }
        } else {
            dto.setCurrentPressureBar(null);
            dto.setMinSafeLimitBar(180.0);
            dto.setMaxSafeLimitBar(220.0);
            dto.setSensorStatus("OFFLINE");
            dto.setPressureDataSource("No sensor connected");
            dto.setPressureFreshness("UNAVAILABLE");
            dto.setIsPressureLive(false);
        }

        return dto;
    }

    @Transactional
    public QueueObservation recordQueueObservation(QueueUpdateDto request) {
        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new IllegalArgumentException("Station not found: " + request.getStationId()));

        int capacityPerHour = station.getDispenserCapacityPerHour() != null && station.getDispenserCapacityPerHour() > 0 
                ? station.getDispenserCapacityPerHour() : 30;
        
        // Waiting time formula: (vehiclesWaiting / (capacityPerHour / 60)) = vehiclesWaiting * (60 / capacityPerHour)
        int waitTime = (int) Math.round((request.getVehiclesWaiting() * 60.0) / capacityPerHour);

        String source = request.getDataSource() != null && !request.getDataSource().isBlank()
                ? request.getDataSource() : "Authorized Operator";

        QueueObservation observation = new QueueObservation(
                station.getId(),
                request.getVehiclesWaiting(),
                waitTime,
                source,
                request.getReportedBy() != null ? request.getReportedBy() : "Operator Dispatch",
                request.getIsLiveSensor() != null ? request.getIsLiveSensor() : true
        );

        return queueObservationRepository.save(observation);
    }

    @Transactional
    public PressureReading recordPressureReading(PressureUpdateDto request) {
        Station station = stationRepository.findById(request.getStationId())
                .orElseThrow(() -> new IllegalArgumentException("Station not found: " + request.getStationId()));

        Double minLimit = request.getMinSafeLimitBar() != null ? request.getMinSafeLimitBar() : 180.0;
        Double maxLimit = request.getMaxSafeLimitBar() != null ? request.getMaxSafeLimitBar() : 220.0;
        String status = request.getSensorStatus() != null ? request.getSensorStatus() : "ONLINE";
        String source = request.getDataSource() != null && !request.getDataSource().isBlank() 
                ? request.getDataSource() : "SCADA Pressure Sensor";

        PressureReading reading = new PressureReading(
                station.getId(),
                request.getPressureBar(),
                minLimit,
                maxLimit,
                status,
                source,
                request.getIsLiveSensor() != null ? request.getIsLiveSensor() : true
        );

        return pressureReadingRepository.save(reading);
    }

    public List<PressureReading> getPressureHistory(Long stationId) {
        return pressureReadingRepository.findTop20ByStationIdOrderByCreatedAtAsc(stationId);
    }

    public List<QueueObservation> getQueueHistory(Long stationId) {
        return queueObservationRepository.findTop15ByStationIdOrderByCreatedAtDesc(stationId);
    }
}
