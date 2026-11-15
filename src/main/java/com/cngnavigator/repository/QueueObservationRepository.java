package com.cngnavigator.repository;

import com.cngnavigator.model.QueueObservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueObservationRepository extends JpaRepository<QueueObservation, Long> {

    Optional<QueueObservation> findFirstByStationIdOrderByCreatedAtDesc(Long stationId);

    List<QueueObservation> findTop15ByStationIdOrderByCreatedAtDesc(Long stationId);

    @Query("SELECT q FROM QueueObservation q WHERE q.id IN (" +
           "  SELECT MAX(q2.id) FROM QueueObservation q2 GROUP BY q2.stationId" +
           ")")
    List<QueueObservation> findLatestForStations();
}
