package com.cngnavigator.controller;

import com.cngnavigator.model.PressureReading;
import com.cngnavigator.model.QueueObservation;
import com.cngnavigator.service.StationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final StationService stationService;

    public TelemetryController(StationService stationService) {
        this.stationService = stationService;
    }

    @GetMapping("/stations/{id}/pressure/history")
    public ResponseEntity<List<PressureReading>> getPressureHistory(@PathVariable Long id) {
        return ResponseEntity.ok(stationService.getPressureHistory(id));
    }

    @GetMapping("/stations/{id}/queue/history")
    public ResponseEntity<List<QueueObservation>> getQueueHistory(@PathVariable Long id) {
        return ResponseEntity.ok(stationService.getQueueHistory(id));
    }
}
