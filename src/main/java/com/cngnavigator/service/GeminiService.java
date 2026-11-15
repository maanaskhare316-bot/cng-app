package com.cngnavigator.service;

import com.cngnavigator.dto.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String GEMINI_MODEL = "gemini-3.8-flash";
    private static final String GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent";

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isLiveGeminiConfigured() {
        String key = getActiveApiKey();
        return key != null && !key.isBlank() && !key.startsWith("YOUR_");
    }

    private String getActiveApiKey() {
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.startsWith("YOUR_")) {
            return geminiApiKey;
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.isBlank() && !envKey.startsWith("YOUR_")) {
            return envKey;
        }
        return null;
    }

    public GeminiAdvisoryResponse generateTripAdvisory(GeminiAdvisoryRequest request) {
        double tankKg = request.getVehicleTankCapacityKg() != null ? request.getVehicleTankCapacityKg() : 10.0;
        double fuelPct = request.getCurrentFuelPercentage() != null ? request.getCurrentFuelPercentage() : 25.0;
        double mileage = request.getEstimatedVehicleMileageKmPerKg() != null ? request.getEstimatedVehicleMileageKmPerKg() : 24.0;
        double currentRange = Math.round((tankKg * (fuelPct / 100.0) * mileage) * 10.0) / 10.0;

        List<StationSummaryDto> candidates = request.getCandidateStations();
        if (candidates == null || candidates.isEmpty()) {
            GeminiAdvisoryResponse resp = new GeminiAdvisoryResponse();
            resp.setTripBriefing("No CNG stations identified within the search perimeter for this route.");
            resp.setEstimatedRangeRemainingKm(currentRange);
            resp.setGeminiModel(GEMINI_MODEL);
            resp.setIsSimulated(!isLiveGeminiConfigured());
            return resp;
        }

        if (isLiveGeminiConfigured()) {
            try {
                return callLiveGeminiAdvisory(request, currentRange);
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to simulated advisor: {}", e.getMessage());
            }
        }

        // Realistic Simulated Gemini Advisor for zero-friction Demo Mode
        return generateSimulatedAdvisory(request, currentRange);
    }

    private GeminiAdvisoryResponse callLiveGeminiAdvisory(GeminiAdvisoryRequest request, double currentRange) throws Exception {
        String apiKey = getActiveApiKey();
        String url = GEMINI_ENDPOINT + "?key=" + apiKey;

        StringBuilder stationData = new StringBuilder();
        for (StationSummaryDto s : request.getCandidateStations()) {
            stationData.append(String.format(
                "- ID:%d %s | Operator:%s | Detour:%.1f km (+%d min) | Queue:%d cars (~%d min wait) | Pressure:%.1f bar (%s, %s) | Price:INR %.2f/kg | VerifiedOpen:%s\n",
                s.getId(), s.getName(), s.getOperator(),
                s.getExtraDetourKm(), s.getEstimatedDetourMinutes(),
                s.getVehiclesWaiting() != null ? s.getVehiclesWaiting() : 0,
                s.getEstimatedWaitMinutes() != null ? s.getEstimatedWaitMinutes() : 0,
                s.getCurrentPressureBar() != null ? s.getCurrentPressureBar() : 0.0,
                s.getPressureFreshness(), s.getSensorStatus(),
                s.getVerifiedPricePerKg() != null ? s.getVerifiedPricePerKg() : 0.0,
                s.getVerifiedOpen()
            ));
        }

        String prompt = "You are CNG Navigator AI Copilot, an expert mobility advisor for CNG vehicles.\n" +
                "Trip Details:\n" +
                "Origin: " + request.getOrigin() + "\n" +
                "Destination: " + request.getDestination() + "\n" +
                "Vehicle Tank Capacity: " + request.getVehicleTankCapacityKg() + " kg\n" +
                "Current Fuel Level: " + request.getCurrentFuelPercentage() + "% (" + currentRange + " km remaining range)\n\n" +
                "Available CNG Stations along route:\n" + stationData.toString() + "\n\n" +
                "Analyze queue times, detour penalties, and pressure freshness (remember: pressure < 180 bar fills tank poorly; 200+ bar is optimal; stale/unavailable pressure has uncertainty; do not recommend closed stations).\n" +
                "Provide your response in JSON format with exactly these fields:\n" +
                "{\n" +
                "  \"tripBriefing\": \"concise 2-sentence executive summary of trip fuel strategy\",\n" +
                "  \"recommendedStationId\": <id of chosen station>,\n" +
                "  \"recommendedStationName\": \"name\",\n" +
                "  \"recommendedStrategy\": \"detailed explanation why this pump is the smartest stop\",\n" +
                "  \"queueRiskAssessment\": \"analysis of waiting times across the route\",\n" +
                "  \"pressureQualityWarning\": \"notes on pressure reliability or warnings\",\n" +
                "  \"actionableTips\": [\"tip 1\", \"tip 2\", \"tip 3\"]\n" +
                "}\n" +
                "Return raw JSON only without markdown code blocks.";

        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.2,
                "responseMimeType", "application/json"
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            // Clean markdown fences if any
            text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            JsonNode parsed = objectMapper.readTree(text);

            GeminiAdvisoryResponse result = new GeminiAdvisoryResponse();
            result.setTripBriefing(parsed.path("tripBriefing").asText());
            result.setRecommendedStationId(parsed.path("recommendedStationId").asLong());
            result.setRecommendedStationName(parsed.path("recommendedStationName").asText());
            result.setRecommendedStrategy(parsed.path("recommendedStrategy").asText());
            result.setQueueRiskAssessment(parsed.path("queueRiskAssessment").asText());
            result.setPressureQualityWarning(parsed.path("pressureQualityWarning").asText());
            result.setEstimatedRangeRemainingKm(currentRange);
            
            List<String> tips = new ArrayList<>();
            JsonNode tipsNode = parsed.path("actionableTips");
            if (tipsNode.isArray()) {
                for (JsonNode t : tipsNode) tips.add(t.asText());
            }
            result.setActionableTips(tips);
            result.setGeminiModel(GEMINI_MODEL + " (Live)");
            result.setIsSimulated(false);
            return result;
        }

        throw new RuntimeException("Unexpected response from Gemini API");
    }

    private GeminiAdvisoryResponse generateSimulatedAdvisory(GeminiAdvisoryRequest request, double currentRange) {
        List<StationSummaryDto> list = request.getCandidateStations();
        
        // Pick best station balancing queue and pressure
        StationSummaryDto best = list.stream()
                .filter(s -> Boolean.TRUE.equals(s.getVerifiedOpen()))
                .min(Comparator.comparingDouble(s -> {
                    double wait = s.getEstimatedWaitMinutes() != null ? s.getEstimatedWaitMinutes() : 15.0;
                    double detour = s.getEstimatedDetourMinutes() != null ? s.getEstimatedDetourMinutes() : 5.0;
                    double pressurePenalty = ("FRESH".equals(s.getPressureFreshness()) && s.getCurrentPressureBar() != null && s.getCurrentPressureBar() >= 200.0) ? -5.0 : 5.0;
                    return wait + detour + pressurePenalty;
                }))
                .orElse(list.get(0));

        GeminiAdvisoryResponse resp = new GeminiAdvisoryResponse();
        resp.setEstimatedRangeRemainingKm(currentRange);
        resp.setRecommendedStationId(best.getId());
        resp.setRecommendedStationName(best.getName());

        String origin = request.getOrigin() != null ? request.getOrigin() : "Origin";
        String dest = request.getDestination() != null ? request.getDestination() : "Destination";

        resp.setTripBriefing(String.format(
                "You have approximately %.1f km of CNG range remaining. Stopping at %s will allow you to complete your journey to %s with maximum tank fill efficiency and minimal waiting delay.",
                currentRange, best.getName(), dest
        ));

        resp.setRecommendedStrategy(String.format(
                "Stop at %s (Detour: %.1f km, ~%d min). With only %d vehicle(s) in queue, your estimated turnaround is under %d minutes. The dispenser pressure is %s (%.1f bar), which delivers ~95-100%% cylinder compression compared to weaker highway stations.",
                best.getName(),
                best.getExtraDetourKm() != null ? best.getExtraDetourKm() : 1.2,
                best.getEstimatedDetourMinutes() != null ? best.getEstimatedDetourMinutes() : 3,
                best.getVehiclesWaiting() != null ? best.getVehiclesWaiting() : 4,
                (best.getEstimatedWaitMinutes() != null ? best.getEstimatedWaitMinutes() : 8) + (best.getEstimatedDetourMinutes() != null ? best.getEstimatedDetourMinutes() : 3),
                best.getPressureFreshness(),
                best.getCurrentPressureBar() != null ? best.getCurrentPressureBar() : 205.0
        ));

        resp.setQueueRiskAssessment(String.format(
                "Congestion along the %s corridor peaks during commercial taxi shift hours. Stations closer to metro hubs have 15-25 min lines, whereas %s maintains rapid flow with %d active dispensers.",
                origin, best.getName(), best.getActiveDispensers() != null ? best.getActiveDispensers() : 4
        ));

        if ("FRESH".equals(best.getPressureFreshness()) && best.getCurrentPressureBar() != null && best.getCurrentPressureBar() >= 200.0) {
            resp.setPressureQualityWarning(String.format(
                    "High Quality Pressure (%.1f bar): Verified fresh within the last 15 minutes. Meets Bureau of Indian Standards / PNGRB full-fill density guidelines.",
                    best.getCurrentPressureBar()
            ));
        } else {
            resp.setPressureQualityWarning("Pressure Telemetry: Simulated demo sensor data. For real operational compliance, always verify dispenser manometer before filling.");
        }

        resp.setActionableTips(List.of(
                "Refuel before entering highway sections where CNG pumps are spaced 40+ km apart.",
                "Ensure engine is switched off and all passengers alight before dispenser nozzle attachment.",
                "Optimal filling occurs between 200-215 bar. If station pressure drops below 175 bar, consider filling only partial and topping up later."
        ));

        resp.setGeminiModel(GEMINI_MODEL + " (Simulated Demo)");
        resp.setIsSimulated(true);

        return resp;
    }

    public GeminiChatResponse chatWithAdvisor(GeminiChatRequest request) {
        String msg = request.getMessage() != null ? request.getMessage().trim() : "";
        if (msg.isEmpty()) {
            return new GeminiChatResponse("How can I assist you with CNG planning today?", 
                    List.of("Recommend the best pump", "Which station has highest pressure?", "Can I reach Agra with current fuel?"),
                    GEMINI_MODEL, !isLiveGeminiConfigured());
        }

        if (isLiveGeminiConfigured()) {
            try {
                return callLiveGeminiChat(request);
            } catch (Exception e) {
                log.warn("Gemini chat API call failed, falling back to simulated response: {}", e.getMessage());
            }
        }

        return generateSimulatedChat(msg, request);
    }

    private GeminiChatResponse callLiveGeminiChat(GeminiChatRequest request) throws Exception {
        String apiKey = getActiveApiKey();
        String url = GEMINI_ENDPOINT + "?key=" + apiKey;

        String prompt = "You are the CNG Navigator AI Copilot, a helpful and technical driving assistant specializing in CNG fueling, pressure limits, queue management, and route planning.\n" +
                "Context:\n" +
                "Route summary: " + request.getRouteSummary() + "\n" +
                "User remaining fuel: " + request.getCurrentFuelPercentage() + "%\n\n" +
                "User query: " + request.getMessage() + "\n\n" +
                "Provide a helpful, precise answer (under 120 words). Provide 2-3 quick follow-up questions at the end.";

        Map<String, Object> body = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.4
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String reply = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

            return new GeminiChatResponse(
                    reply,
                    List.of("What is the peak queue hour?", "How does low pressure affect my mileage?", "Show alternative route"),
                    GEMINI_MODEL + " (Live)",
                    false
            );
        }

        throw new RuntimeException("Gemini chat failed");
    }

    private GeminiChatResponse generateSimulatedChat(String msg, GeminiChatRequest request) {
        String lower = msg.toLowerCase();
        String reply;
        List<String> followUps;

        if (lower.contains("pressure") || lower.contains("bar")) {
            reply = "CNG filling pressure directly dictates your driving range. Standard automotive cylinders are rated for 200 bar at 15°C. When a station delivers 205-215 bar, you get 100% capacity (e.g. 10 kg). At 160-170 bar, you only get ~7.5 kg, slashing your range by 25%. Our system marks stations with fresh >200 bar telemetry as preferred stops!";
            followUps = List.of("Which station has >200 bar right now?", "Does ambient temperature affect CNG pressure?", "Is high pressure dangerous?");
        } else if (lower.contains("queue") || lower.contains("wait") || lower.contains("line")) {
            reply = "Queues at CNG pumps fluctuate heavily by time of day. Early mornings (6-8 AM) and shift changeovers (3-4 PM) see commercial taxi clusters. We monitor live queue counts and dispenser throughput so you can bypass a 30-minute queue by taking a mere 1.5 km detour.";
            followUps = List.of("Show stations with shortest queue", "What is the average dispensing time per car?", "Can I book a queue slot?");
        } else if (lower.contains("reach") || lower.contains("range") || lower.contains("mileage")) {
            double pct = request.getCurrentFuelPercentage() != null ? request.getCurrentFuelPercentage() : 25.0;
            reply = String.format("With approximately %.0f%% fuel in a standard 10 kg cylinder, your safe remaining range is ~60 km. Given traffic and highway segments, we strongly recommend refueling at the Best Overall station within the next 25-35 km before entering open expressway corridors.", pct);
            followUps = List.of("Plan stop at Best Overall station", "Find 24x7 stations on route", "What is CNG price along this route?");
        } else {
            reply = "As your CNG Navigator Copilot, I evaluate real-time queue lengths, cylinder pressure reliability, and detour minutes to pinpoint the optimal refueling spot for your specific vehicle and journey. Let me know if you want to optimize for shortest queue, minimal detour, or maximum pressure!";
            followUps = List.of("What is the Best Overall pump on my route?", "Why shouldn't I just go to the nearest station?", "How is pressure telemetry verified?");
        }

        return new GeminiChatResponse(reply, followUps, GEMINI_MODEL + " (Simulated Demo)", true);
    }
}
