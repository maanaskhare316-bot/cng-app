package com.cngnavigator.service;

import com.cngnavigator.dto.RouteAlternativeDto;
import com.cngnavigator.dto.RouteSearchRequest;
import com.cngnavigator.dto.RouteSearchResultDto;
import com.cngnavigator.dto.StationSummaryDto;
import com.cngnavigator.model.Station;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoutingService {

    private static final Logger log = LoggerFactory.getLogger(RoutingService.class);
    private final StationService stationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public RoutingService(StationService stationService) {
        this.stationService = stationService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public RouteSearchResultDto calculateRoute(RouteSearchRequest request) {
        Double startLat = request.getStartLat();
        Double startLng = request.getStartLng();
        Double destLat = request.getDestLat();
        Double destLng = request.getDestLng();
        Double maxDetourKm = request.getMaxDetourKm() != null ? request.getMaxDetourKm() : 5.0;
        Long stopStationId = request.getSelectedStationId();

        RouteSearchResultDto result = new RouteSearchResultDto();

        Station stopStation = null;
        if (stopStationId != null) {
            stopStation = stationService.getStationById(stopStationId).orElse(null);
        }

        // Try OSRM route first
        boolean routedByOsrm = false;
        try {
            String osrmUrl;
            if (stopStation != null) {
                // Waypoint route: start -> stopStation -> dest
                osrmUrl = String.format(
                        "https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f;%f,%f?overview=full&geometries=geojson&alternatives=false",
                        startLng, startLat, stopStation.getLongitude(), stopStation.getLatitude(), destLng, destLat);
            } else {
                osrmUrl = String.format(
                        "https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson&alternatives=true",
                        startLng, startLat, destLng, destLat);
            }

            String response = restTemplate.getForObject(osrmUrl, String.class);
            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                if ("Ok".equals(root.path("code").asText())) {
                    JsonNode routes = root.path("routes");
                    if (routes.isArray() && routes.size() > 0) {
                        JsonNode primary = routes.get(0);
                        double distanceKm = primary.path("distance").asDouble(0) / 1000.0;
                        int durationMinutes = (int) Math.round(primary.path("duration").asDouble(0) / 60.0);
                        
                        List<List<Double>> geometry = extractCoordinates(primary.path("geometry"));
                        result.setTotalDistanceKm(Math.round(distanceKm * 10.0) / 10.0);
                        result.setTotalDurationMinutes(durationMinutes);
                        result.setRouteGeometry(geometry);
                        result.setIsDemoRoute(false);
                        result.setRouteSource("OSRM Live OpenStreetMap Routing Engine");

                        // Parse alternatives
                        List<RouteAlternativeDto> alternatives = new ArrayList<>();
                        for (int i = 1; i < routes.size(); i++) {
                            JsonNode alt = routes.get(i);
                            double altDist = Math.round(alt.path("distance").asDouble(0) / 100.0) / 10.0;
                            int altDur = (int) Math.round(alt.path("duration").asDouble(0) / 60.0);
                            alternatives.add(new RouteAlternativeDto(
                                    "Alternative " + i,
                                    altDist,
                                    altDur,
                                    "Via secondary corridor (+" + Math.max(0, altDur - durationMinutes) + " mins)",
                                    extractCoordinates(alt.path("geometry"))
                            ));
                        }
                        result.setAlternatives(alternatives);
                        routedByOsrm = true;
                    }
                }
            }
        } catch (Exception e) {
            log.info("External OSRM routing unavailable (using realistic offline routing): {}", e.getMessage());
        }

        // Offline / Demo Route Fallback
        if (!routedByOsrm) {
            result = generateOfflineRoute(startLat, startLng, destLat, destLng, stopStation);
        }

        // Filter and calculate detour metrics for all candidate stations
        List<StationSummaryDto> allSummaries = stationService.getAllStationSummaries();
        List<List<Double>> polyline = result.getRouteGeometry();

        List<StationSummaryDto> candidateStations = new ArrayList<>();
        for (StationSummaryDto station : allSummaries) {
            double distFromRoute = calculateMinDistanceToPolyline(station.getLatitude(), station.getLongitude(), polyline);
            double extraDetourKm = Math.round((distFromRoute * 2.2) * 10.0) / 10.0; // Round-trip detour off route
            int detourMinutes = (int) Math.max(1, Math.round((extraDetourKm / 28.0) * 60.0)); // Urban/highway approach speed ~28 km/h
            double distFromStart = calculateHaversineKm(startLat, startLng, station.getLatitude(), station.getLongitude());

            station.setDistanceFromRouteKm(Math.round(distFromRoute * 10.0) / 10.0);
            station.setExtraDetourKm(extraDetourKm);
            station.setEstimatedDetourMinutes(detourMinutes);
            station.setDistanceFromStartKm(Math.round(distFromStart * 10.0) / 10.0);

            // Filter within maxDetourKm
            if (distFromRoute <= maxDetourKm) {
                candidateStations.add(station);
            }
        }

        // Sort candidates primarily by distance from start along route
        candidateStations.sort(Comparator.comparing(StationSummaryDto::getDistanceFromStartKm));
        result.setStations(candidateStations);

        return result;
    }

    private List<List<Double>> extractCoordinates(JsonNode geometryNode) {
        List<List<Double>> coords = new ArrayList<>();
        JsonNode coordinates = geometryNode.path("coordinates");
        if (coordinates.isArray()) {
            for (JsonNode pt : coordinates) {
                // GeoJSON has [lng, lat], we convert to [lat, lng] for Leaflet
                double lng = pt.get(0).asDouble();
                double lat = pt.get(1).asDouble();
                List<Double> pair = new ArrayList<>(2);
                pair.add(lat);
                pair.add(lng);
                coords.add(pair);
            }
        }
        return coords;
    }

    private RouteSearchResultDto generateOfflineRoute(Double startLat, Double startLng, 
                                                      Double destLat, Double destLng, 
                                                      Station stopStation) {
        RouteSearchResultDto result = new RouteSearchResultDto();
        result.setIsDemoRoute(true);
        result.setRouteSource("High-Fidelity Simulated Route Corridor (Demo Mode)");

        List<List<Double>> coords = new ArrayList<>();
        
        if (stopStation != null) {
            appendSegment(coords, startLat, startLng, stopStation.getLatitude(), stopStation.getLongitude(), 30);
            appendSegment(coords, stopStation.getLatitude(), stopStation.getLongitude(), destLat, destLng, 30);
        } else {
            appendSegment(coords, startLat, startLng, destLat, destLng, 50);
        }

        double totalDist = 0.0;
        for (int i = 0; i < coords.size() - 1; i++) {
            totalDist += calculateHaversineKm(coords.get(i).get(0), coords.get(i).get(1),
                    coords.get(i+1).get(0), coords.get(i+1).get(1));
        }

        // Account for road curvature factor ~1.25x haversine
        totalDist = Math.round(totalDist * 1.25 * 10.0) / 10.0;
        int durationMins = (int) Math.round((totalDist / 55.0) * 60.0); // avg speed 55 km/h

        result.setTotalDistanceKm(totalDist);
        result.setTotalDurationMinutes(durationMins);
        result.setRouteGeometry(coords);

        // Generate alternative route
        List<List<Double>> altCoords = new ArrayList<>();
        appendCurvedSegment(altCoords, startLat, startLng, destLat, destLng, 40, 0.015);
        double altDist = Math.round(totalDist * 1.12 * 10.0) / 10.0;
        int altDur = (int) Math.round(durationMins * 1.18);
        result.setAlternatives(List.of(new RouteAlternativeDto(
                "Via Arterial Bypass (Demo)",
                altDist,
                altDur,
                "Alternative corridor with fewer signals (+12% distance)",
                altCoords
        )));

        return result;
    }

    private void appendSegment(List<List<Double>> list, double lat1, double lng1, double lat2, double lng2, int steps) {
        for (int i = 0; i <= steps; i++) {
            double fraction = (double) i / steps;
            // Add slight realistic curvature
            double jitterLat = Math.sin(fraction * Math.PI) * 0.005 * (Math.sin(fraction * 10));
            double jitterLng = Math.sin(fraction * Math.PI) * 0.005 * (Math.cos(fraction * 10));
            double lat = lat1 + (lat2 - lat1) * fraction + jitterLat;
            double lng = lng1 + (lng2 - lng1) * fraction + jitterLng;
            list.add(List.of(lat, lng));
        }
    }

    private void appendCurvedSegment(List<List<Double>> list, double lat1, double lng1, double lat2, double lng2, int steps, double curve) {
        for (int i = 0; i <= steps; i++) {
            double fraction = (double) i / steps;
            double lat = lat1 + (lat2 - lat1) * fraction + Math.sin(fraction * Math.PI) * curve;
            double lng = lng1 + (lng2 - lng1) * fraction + Math.sin(fraction * Math.PI) * curve * 0.7;
            list.add(List.of(lat, lng));
        }
    }

    public double calculateMinDistanceToPolyline(double pointLat, double pointLng, List<List<Double>> polyline) {
        if (polyline == null || polyline.isEmpty()) return Double.MAX_VALUE;
        double minDistance = Double.MAX_VALUE;

        for (int i = 0; i < polyline.size() - 1; i++) {
            double lat1 = polyline.get(i).get(0);
            double lng1 = polyline.get(i).get(1);
            double lat2 = polyline.get(i + 1).get(0);
            double lng2 = polyline.get(i + 1).get(1);

            double d = distanceToSegmentKm(pointLat, pointLng, lat1, lng1, lat2, lng2);
            if (d < minDistance) {
                minDistance = d;
            }
        }
        return minDistance;
    }

    private double distanceToSegmentKm(double pLat, double pLng, double lat1, double lng1, double lat2, double lng2) {
        double dLat = lat2 - lat1;
        double dLng = lng2 - lng1;

        if (dLat == 0 && dLng == 0) {
            return calculateHaversineKm(pLat, pLng, lat1, lng1);
        }

        // Projection fraction t of point onto line segment
        double t = ((pLat - lat1) * dLat + (pLng - lng1) * dLng) / (dLat * dLat + dLng * dLng);
        t = Math.max(0.0, Math.min(1.0, t));

        double projLat = lat1 + t * dLat;
        double projLng = lng1 + t * dLng;

        return calculateHaversineKm(pLat, pLng, projLat, projLng);
    }

    public double calculateHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
