package com.cngnavigator.controller;

import com.cngnavigator.dto.GeminiAdvisoryRequest;
import com.cngnavigator.dto.GeminiAdvisoryResponse;
import com.cngnavigator.dto.GeminiChatRequest;
import com.cngnavigator.dto.GeminiChatResponse;
import com.cngnavigator.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
@CrossOrigin(origins = "*")
public class GeminiController {

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getGeminiStatus() {
        boolean live = geminiService.isLiveGeminiConfigured();
        return ResponseEntity.ok(Map.of(
                "configured", live,
                "model", live ? "gemini-3.8-flash (Live API)" : "gemini-3.8-flash (Simulated Demo Mode)",
                "mode", live ? "LIVE" : "SIMULATED",
                "description", live ? "Connected to Google Gemini API" : "Simulated Gemini Copilot active (add GEMINI_API_KEY to enable live calls)"
        ));
    }

    @PostMapping("/advisor")
    public ResponseEntity<GeminiAdvisoryResponse> getTripAdvisory(@RequestBody GeminiAdvisoryRequest request) {
        return ResponseEntity.ok(geminiService.generateTripAdvisory(request));
    }

    @PostMapping("/chat")
    public ResponseEntity<GeminiChatResponse> chatWithAdvisor(@RequestBody GeminiChatRequest request) {
        return ResponseEntity.ok(geminiService.chatWithAdvisor(request));
    }
}
