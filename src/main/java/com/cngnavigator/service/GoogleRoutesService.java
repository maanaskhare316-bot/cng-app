package com.cngnavigator.service;

import com.cngnavigator.dto.*;
import com.cngnavigator.model.Station;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GoogleRoutesService {

    private static final Logger log = LoggerFactory.getLogger(GoogleRoutesService.class);
    private static final String ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

    @Value("${google.maps.api-key:${GOOGLE_MAPS_API_KEY:}}")
    private String googleApiKey;

    private final StationService stationService;
    private final RoutingService routingService;
    private final RecommendationService recommendationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GoogleRoutesService(StationService stationService,
                               RoutingService routingService,
                               RecommendationService recommendationService) {
        this.stationService = stationService;
        this.routingService = routingService;
        this.recommendationService = recommendationService;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Compute driving route with Google Routes API v2 using TRAFFIC_AWARE preference.
     */
    public RoutesComputeResponse computeRoute(RouteComputeRequest request, boolean computeAlternatives) {
        // Validate API Key
        if (googleApiKey == null || googleApiKey.trim().isEmpty() || "YOUR_GOOGLE_MAPS_KEY_HERE".equals(googleApiKey.trim())) {
            log.info("Google Routes API key not configured on backend. Using high-fidelity routing engine.");
            return fallbackToExistingRouting(request, computeAlternatives);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Goog-Api-Key", googleApiKey.trim());
            headers.set("X-Goog-FieldMask",
                    "routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline," +
                    "routes.legs.distanceMeters,routes.legs.duration,routes.legs.staticDuration,routes.legs.steps,routes.warnings,routes.description");

            ObjectNode body = objectMapper.createObjectNode();

            // Origin
            ObjectNode originNode = body.putObject("origin").putObject("location").putObject("latLng");
            originNode.put("latitude", request.getStartLat());
            originNode.put("longitude", request.getStartLng());

            // Destination
            ObjectNode destNode = body.putObject("destination").putObject("location").putObject("latLng");
            destNode.put("latitude", request.getDestLat());
            destNode.put("longitude", request.getDestLng());

            // Waypoint (selected stopover CNG station if any)
            if (request.getSelectedStationId() != null) {
                Optional<Station> stationOpt = stationService.getStationById(request.getSelectedStationId());
                if (stationOpt.isPresent()) {
                    ArrayNode intermediates = body.putArray("intermediates");
                    ObjectNode stationNode = intermediates.addObject().putObject("location").putObject("latLng");
                    stationNode.put("latitude", stationOpt.get().getLatitude());
                    stationNode.put("longitude", stationOpt.get().getLongitude());
                }
            }

            body.put("travelMode", "DRIVE");
            body.put("routingPreference", request.getRoutingPreference() != null ? request.getRoutingPreference() : "TRAFFIC_AWARE");
            body.put("computeAlternativeRoutes", computeAlternatives);

            HttpEntity<String> entity = new HttpEntity<>(body.toString(), headers);
            String responseStr = restTemplate.postForObject(ROUTES_API_URL, entity, String.class);

            if (responseStr != null) {
                JsonNode root = objectMapper.readTree(responseStr);
                JsonNode routes = root.path("routes");

                if (routes.isArray() && routes.size() > 0) {
                    JsonNode primaryRoute = routes.get(0);
                    return parseGoogleRouteResponse(primaryRoute, routes, request);
                }
            }
        } catch (Exception e) {
            log.warn("Google Routes API call failed ({}), falling back to internal engine.", e.getMessage());
        }

        return fallbackToExistingRouting(request, computeAlternatives);
    }

    private RoutesComputeResponse parseGoogleRouteResponse(JsonNode primaryRoute, JsonNode allRoutes, RouteComputeRequest req) {
        RoutesComputeResponse response = new RoutesComputeResponse();

        double distanceMeters = primaryRoute.path("distanceMeters").asDouble(0);
        String durationStr = primaryRoute.path("duration").asText("0s").replace("s", "");
        String staticDurationStr = primaryRoute.path("staticDuration").asText("0s").replace("s", "");

        int trafficSeconds = (int) Math.round(Double.parseDouble(durationStr));
        int staticSeconds = (int) Math.round(Double.parseDouble(staticDurationStr));

        double distKm = Math.round((distanceMeters / 1000.0) * 10.0) / 10.0;
        int durMinutes = (int) Math.round(staticSeconds / 60.0);
        int trafficMinutes = (int) Math.round(trafficSeconds / 60.0);

        response.setTotalDistanceKm(distKm);
        response.setTotalDurationMinutes(durMinutes);
        response.setTrafficAwareDurationMinutes(trafficMinutes);

        // Polyline
        String encodedPolyline = primaryRoute.path("polyline").path("encodedPolyline").asText("");
        response.setEncodedPolyline(encodedPolyline);
        List<List<Double>> decodedCoords = decodePolyline(encodedPolyline);
        response.setRouteGeometry(decodedCoords);

        // Legs and Navigation Steps
        List<RouteLegDto> legs = new ArrayList<>();
        JsonNode legsArray = primaryRoute.path("legs");
        if (legsArray.isArray()) {
            for (JsonNode legNode : legsArray) {
                RouteLegDto leg = new RouteLegDto();
                leg.setDistanceMeters(legNode.path("distanceMeters").asDouble(0));
                String legDur = legNode.path("duration").asText("0s").replace("s", "");
                leg.setDurationSeconds((int) Math.round(Double.parseDouble(legDur)));

                List<NavigationStepDto> steps = new ArrayList<>();
                JsonNode stepsArray = legNode.path("steps");
                if (stepsArray.isArray()) {
                    for (JsonNode stepNode : stepsArray) {
                        NavigationStepDto step = new NavigationStepDto();
                        step.setDistanceMeters(stepNode.path("distanceMeters").asDouble(0));
                        String stepDur = stepNode.path("staticDuration").asText("0s").replace("s", "");
                        step.setDurationSeconds((int) Math.round(Double.parseDouble(stepDur)));

                        JsonNode instructionNode = stepNode.path("navigationInstruction");
                        step.setInstruction(instructionNode.path("instructions").asText("Continue along highway"));
                        step.setManeuver(instructionNode.path("maneuver").asText("STRAIGHT"));

                        JsonNode startLoc = stepNode.path("startLocation").path("latLng");
                        if (!startLoc.isMissingNode()) {
                            step.setStartLat(startLoc.path("latitude").asDouble());
                            step.setStartLng(startLoc.path("longitude").asDouble());
                        }

                        JsonNode endLoc = stepNode.path("endLocation").path("latLng");
                        if (!endLoc.isMissingNode()) {
                            step.setEndLat(endLoc.path("latitude").asDouble());
                            step.setEndLng(endLoc.path("longitude").asDouble());
                        }

                        steps.add(step);
                    }
                }
                leg.setSteps(steps);
                legs.add(leg);
            }
        }
        response.setLegs(legs);
        response.setRouteSource("Google Routes API (Live Driving & Traffic)");

        // Find candidate stations along this Google route
        List<StationSummaryDto> candidateStations = findStationsAlongPolyline(decodedCoords, req.getStartLat(), req.getStartLng(), req.getDestLat(), req.getDestLng(), req.getMaxDetourKm());
        response.setCandidateStations(candidateStations);
        if (!candidateStations.isEmpty()) {
            response.setRecommendedStation(candidateStations.get(0));
        }

        return response;
    }

    private RoutesComputeResponse fallbackToExistingRouting(RouteComputeRequest request, boolean computeAlternatives) {
        RouteSearchRequest legacyReq = new RouteSearchRequest();
        legacyReq.setStartLat(request.getStartLat());
        legacyReq.setStartLng(request.getStartLng());
        legacyReq.setStartAddress(request.getStartAddress());
        legacyReq.setDestLat(request.getDestLat());
        legacyReq.setDestLng(request.getDestLng());
        legacyReq.setDestAddress(request.getDestAddress());
        legacyReq.setMaxDetourKm(request.getMaxDetourKm());
        legacyReq.setSelectedStationId(request.getSelectedStationId());

        RouteSearchResultDto legacyRes = routingService.calculateRoute(legacyReq);
        recommendationService.applyRecommendations(legacyRes);

        RoutesComputeResponse response = new RoutesComputeResponse();
        response.setTotalDistanceKm(legacyRes.getTotalDistanceKm());
        response.setTotalDurationMinutes(legacyRes.getTotalDurationMinutes());
        response.setTrafficAwareDurationMinutes(legacyRes.getTotalDurationMinutes());
        response.setRouteGeometry(legacyRes.getRouteGeometry());
        response.setRouteSource(legacyRes.getRouteSource() != null ? legacyRes.getRouteSource() : "High-Fidelity Corridor Engine");
        response.setCandidateStations(legacyRes.getStations());
        response.setAlternatives(legacyRes.getAlternatives());
        response.setRecommendedStation(legacyRes.getBestOverall() != null ? legacyRes.getBestOverall() : (!legacyRes.getStations().isEmpty() ? legacyRes.getStations().get(0) : null));

        return response;
    }

    /**
     * Decode Google Encoded Polyline into [latitude, longitude] points.
     */
    public static List<List<Double>> decodePolyline(String encoded) {
        List<List<Double>> poly = new ArrayList<>();
        if (encoded == null || encoded.isEmpty()) return poly;

        int index = 0, len = encoded.length();
        int lat = 0, lng = 0;

        while (index < len) {
            int b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            List<Double> pt = new ArrayList<>(2);
            pt.add(lat / 1E5);
            pt.add(lng / 1E5);
            poly.add(pt);
        }

        return poly;
    }

    private List<StationSummaryDto> findStationsAlongPolyline(List<List<Double>> polyline, double startLat, double startLng, double destLat, double destLng, Double maxDetourKm) {
        double maxDetour = maxDetourKm != null ? maxDetourKm : 5.0;
        List<StationSummaryDto> allSummaries = stationService.getAllStationSummaries();
        List<StationSummaryDto> candidates = new ArrayList<>();

        for (StationSummaryDto station : allSummaries) {
            double distFromRoute = calculateMinDistanceToPolyline(station.getLatitude(), station.getLongitude(), polyline);
            double extraDetourKm = Math.round((distFromRoute * 2.2) * 10.0) / 10.0;
            int detourMinutes = (int) Math.max(1, Math.round((extraDetourKm / 30.0) * 60.0));
            double distFromStart = calculateHaversineKm(startLat, startLng, station.getLatitude(), station.getLongitude());

            station.setDistanceFromRouteKm(Math.round(distFromRoute * 10.0) / 10.0);
            station.setExtraDetourKm(extraDetourKm);
            station.setEstimatedDetourMinutes(detourMinutes);
            station.setDistanceFromStartKm(Math.round(distFromStart * 10.0) / 10.0);

            if (distFromRoute <= maxDetour) {
                candidates.add(station);
            }
        }

        candidates.sort(Comparator.comparing(StationSummaryDto::getDistanceFromStartKm));
        return candidates;
    }

    private double calculateMinDistanceToPolyline(double lat, double lng, List<List<Double>> polyline) {
        if (polyline == null || polyline.isEmpty()) return 999.0;
        double minDist = Double.MAX_VALUE;
        for (List<Double> pt : polyline) {
            double d = calculateHaversineKm(lat, lng, pt.get(0), pt.get(1));
            if (d < minDist) minDist = d;
        }
        return minDist;
    }

    private double calculateHaversineKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
