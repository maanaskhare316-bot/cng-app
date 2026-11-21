package com.cngnavigator.dto;

import java.util.ArrayList;
import java.util.List;

public class StationComparisonResponse {
    private List<StationSummaryDto> rankedStations = new ArrayList<>();
    private StationSummaryDto bestOverall;
    private StationSummaryDto fastestRefueling;
    private StationSummaryDto nearestStation;
    private String matrixSource;

    public StationComparisonResponse() {}

    public List<StationSummaryDto> getRankedStations() {
        return rankedStations;
    }

    public void setRankedStations(List<StationSummaryDto> rankedStations) {
        this.rankedStations = rankedStations;
    }

    public StationSummaryDto getBestOverall() {
        return bestOverall;
    }

    public void setBestOverall(StationSummaryDto bestOverall) {
        this.bestOverall = bestOverall;
    }

    public StationSummaryDto getFastestRefueling() {
        return fastestRefueling;
    }

    public void setFastestRefueling(StationSummaryDto fastestRefueling) {
        this.fastestRefueling = fastestRefueling;
    }

    public StationSummaryDto getNearestStation() {
        return nearestStation;
    }

    public void setNearestStation(StationSummaryDto nearestStation) {
        this.nearestStation = nearestStation;
    }

    public String getMatrixSource() {
        return matrixSource;
    }

    public void setMatrixSource(String matrixSource) {
        this.matrixSource = matrixSource;
    }
}
