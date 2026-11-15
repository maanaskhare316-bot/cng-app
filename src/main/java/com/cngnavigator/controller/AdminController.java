package com.cngnavigator.controller;

import com.cngnavigator.dto.PressureUpdateDto;
import com.cngnavigator.dto.QueueUpdateDto;
import com.cngnavigator.model.PressureReading;
import com.cngnavigator.model.QueueObservation;
import com.cngnavigator.model.Station;
import com.cngnavigator.service.StationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final StationService stationService;

    @Value("${cng.admin.key:cng-admin-secret-2026}")
    private String configuredAdminKey;

    public AdminController(StationService stationService) {
        this.stationService = stationService;
    }

    private boolean isAuthorized(String providedKey) {
        return configuredAdminKey != null && configuredAdminKey.equals(providedKey);
    }

    @RequestMapping(value = "/verify", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> verifyAdminKey(
            @RequestHeader(value = "X-Admin-Key", required = false) String headerKey,
            @RequestParam(value = "adminKey", required = false) String queryKey,
            @RequestBody(required = false) Map<String, String> body) {
        String key = headerKey;
        if (key == null || key.isBlank()) {
            key = queryKey;
        }
        if ((key == null || key.isBlank()) && body != null) {
            key = body.get("adminKey");
        }
        if (isAuthorized(key)) {
            return ResponseEntity.ok(Map.of("authorized", true, "message", "Admin credentials verified"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("authorized", false, "error", "Invalid administrative security key"));
    }

    @PostMapping("/queue-update")
    public ResponseEntity<?> submitQueueUpdate(@RequestHeader(value = "X-Admin-Key", required = false) String headerKey,
                                               @Valid @RequestBody QueueUpdateDto dto) {
        String key = (headerKey != null && !headerKey.isBlank()) ? headerKey : dto.getAdminKey();
        if (!isAuthorized(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Valid X-Admin-Key header required to submit telemetry"));
        }

        QueueObservation saved = stationService.recordQueueObservation(dto);
        return ResponseEntity.ok(Map.of(
                "message", "Authorized queue update recorded successfully",
                "observationId", saved.getId(),
                "vehiclesWaiting", saved.getVehiclesWaiting(),
                "estimatedWaitMinutes", saved.getEstimatedWaitMinutes(),
                "dataSource", saved.getDataSource(),
                "timestamp", saved.getCreatedAt()
        ));
    }

    @PostMapping("/pressure-update")
    public ResponseEntity<?> submitPressureUpdate(@RequestHeader(value = "X-Admin-Key", required = false) String headerKey,
                                                  @Valid @RequestBody PressureUpdateDto dto) {
        String key = (headerKey != null && !headerKey.isBlank()) ? headerKey : dto.getAdminKey();
        if (!isAuthorized(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Valid X-Admin-Key header required to submit sensor telemetry"));
        }

        PressureReading saved = stationService.recordPressureReading(dto);
        return ResponseEntity.ok(Map.of(
                "message", "Authorized pressure telemetry recorded successfully",
                "readingId", saved.getId(),
                "pressureBar", saved.getPressureBar(),
                "sensorStatus", saved.getSensorStatus(),
                "dataSource", saved.getDataSource(),
                "timestamp", saved.getCreatedAt()
        ));
    }

    @PostMapping("/stations")
    public ResponseEntity<?> createOrUpdateStation(
            @RequestHeader(value = "X-Admin-Key", required = false) String headerKey,
            @RequestParam(value = "adminKey", required = false) String queryKey,
            @RequestBody Station station) {
        String key = (headerKey != null && !headerKey.isBlank()) ? headerKey : queryKey;
        if (!isAuthorized(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Valid X-Admin-Key header required to modify station records"));
        }

        Station saved = stationService.saveStation(station);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/stations/{id}")
    public ResponseEntity<?> deleteStation(
            @RequestHeader(value = "X-Admin-Key", required = false) String headerKey,
            @RequestParam(value = "adminKey", required = false) String queryKey,
            @PathVariable Long id) {
        String key = (headerKey != null && !headerKey.isBlank()) ? headerKey : queryKey;
        if (!isAuthorized(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Valid X-Admin-Key header required to delete station records"));
        }

        stationService.deleteStation(id);
        return ResponseEntity.ok(Map.of("message", "Station record " + id + " deleted successfully"));
    }
}
