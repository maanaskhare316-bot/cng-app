package com.cngnavigator.repository;

import com.cngnavigator.model.PressureReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PressureReadingRepository extends JpaRepository<PressureReading, Long> {

    Optional<PressureReading> findFirstByStationIdOrderByCreatedAtDesc(Long stationId);

    List<PressureReading> findTop20ByStationIdOrderByCreatedAtAsc(Long stationId);

    List<PressureReading> findTop20ByStationIdOrderByCreatedAtDesc(Long stationId);

    @Query("SELECT p FROM PressureReading p WHERE p.id IN (" +
           "  SELECT MAX(p2.id) FROM PressureReading p2 GROUP BY p2.stationId" +
           ")")
    List<PressureReading> findLatestForStations();
}
