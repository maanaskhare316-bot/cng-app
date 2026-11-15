package com.cngnavigator.dto;

import java.util.List;

public class GeminiAdvisoryResponse {
    private String tripBriefing;
    private Long recommendedStationId;
    private String recommendedStationName;
    private String recommendedStrategy;
    private String queueRiskAssessment;
    private String pressureQualityWarning;
    private Double estimatedRangeRemainingKm;
    private List<String> actionableTips;
    private String geminiModel;
    private Boolean isSimulated;

    public GeminiAdvisoryResponse() {}

    public String getTripBriefing() { return tripBriefing; }
    public void setTripBriefing(String tripBriefing) { this.tripBriefing = tripBriefing; }

    public Long getRecommendedStationId() { return recommendedStationId; }
    public void setRecommendedStationId(Long recommendedStationId) { this.recommendedStationId = recommendedStationId; }

    public String getRecommendedStationName() { return recommendedStationName; }
    public void setRecommendedStationName(String recommendedStationName) { this.recommendedStationName = recommendedStationName; }

    public String getRecommendedStrategy() { return recommendedStrategy; }
    public void setRecommendedStrategy(String recommendedStrategy) { this.recommendedStrategy = recommendedStrategy; }

    public String getQueueRiskAssessment() { return queueRiskAssessment; }
    public void setQueueRiskAssessment(String queueRiskAssessment) { this.queueRiskAssessment = queueRiskAssessment; }

    public String getPressureQualityWarning() { return pressureQualityWarning; }
    public void setPressureQualityWarning(String pressureQualityWarning) { this.pressureQualityWarning = pressureQualityWarning; }

    public Double getEstimatedRangeRemainingKm() { return estimatedRangeRemainingKm; }
    public void setEstimatedRangeRemainingKm(Double estimatedRangeRemainingKm) { this.estimatedRangeRemainingKm = estimatedRangeRemainingKm; }

    public List<String> getActionableTips() { return actionableTips; }
    public void setActionableTips(List<String> actionableTips) { this.actionableTips = actionableTips; }

    public String getGeminiModel() { return geminiModel; }
    public void setGeminiModel(String geminiModel) { this.geminiModel = geminiModel; }

    public Boolean getIsSimulated() { return isSimulated; }
    public void setIsSimulated(Boolean isSimulated) { this.isSimulated = isSimulated; }
}
