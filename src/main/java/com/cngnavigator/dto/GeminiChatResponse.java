package com.cngnavigator.dto;

import java.util.List;

public class GeminiChatResponse {
    private String reply;
    private List<String> quickFollowUps;
    private String geminiModel;
    private Boolean isSimulated;

    public GeminiChatResponse() {}

    public GeminiChatResponse(String reply, List<String> quickFollowUps, String geminiModel, Boolean isSimulated) {
        this.reply = reply;
        this.quickFollowUps = quickFollowUps;
        this.geminiModel = geminiModel;
        this.isSimulated = isSimulated;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public List<String> getQuickFollowUps() { return quickFollowUps; }
    public void setQuickFollowUps(List<String> quickFollowUps) { this.quickFollowUps = quickFollowUps; }

    public String getGeminiModel() { return geminiModel; }
    public void setGeminiModel(String geminiModel) { this.geminiModel = geminiModel; }

    public Boolean getIsSimulated() { return isSimulated; }
    public void setIsSimulated(Boolean isSimulated) { this.isSimulated = isSimulated; }
}
