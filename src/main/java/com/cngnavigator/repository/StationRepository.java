package com.cngnavigator.repository;

import com.cngnavigator.model.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    List<Station> findByCityIgnoreCase(String city);

    @Query("SELECT s FROM Station s WHERE " +
           "s.latitude BETWEEN :minLat AND :maxLat AND " +
           "s.longitude BETWEEN :minLng AND :maxLng")
    List<Station> findWithinBoundingBox(@Param("minLat") Double minLat,
                                        @Param("maxLat") Double maxLat,
                                        @Param("minLng") Double minLng,
                                        @Param("maxLng") Double maxLng);
}
