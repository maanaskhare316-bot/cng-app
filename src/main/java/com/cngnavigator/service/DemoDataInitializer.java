package com.cngnavigator.service;

import com.cngnavigator.model.PressureReading;
import com.cngnavigator.model.QueueObservation;
import com.cngnavigator.model.Station;
import com.cngnavigator.repository.PressureReadingRepository;
import com.cngnavigator.repository.QueueObservationRepository;
import com.cngnavigator.repository.StationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final StationRepository stationRepository;
    private final QueueObservationRepository queueObservationRepository;
    private final PressureReadingRepository pressureReadingRepository;

    public DemoDataInitializer(StationRepository stationRepository,
                               QueueObservationRepository queueObservationRepository,
                               PressureReadingRepository pressureReadingRepository) {
        this.stationRepository = stationRepository;
        this.queueObservationRepository = queueObservationRepository;
        this.pressureReadingRepository = pressureReadingRepository;
    }

    @Override
    public void run(String... args) {
        if (stationRepository.count() > 0) {
            log.info("Database already seeded with CNG stations.");
            return;
        }

        log.info("Seeding initial demo CNG stations and telemetry...");

        // Delhi - Yamuna Expressway - Agra Corridor
        Station s1 = new Station(
                "IGL CNG Mother Station - Sarita Vihar",
                "Indraprastha Gas Limited (IGL)",
                "Pocket A, Mathura Road, Sarita Vihar",
                "New Delhi", "Delhi",
                28.5355, 77.2915,
                true, 79.56, 36, 6, "24x7",
                "Restroom, Quick Food, Digital Air Dispenser, Card & UPI Payment"
        );
        s1.setContactPhone("+91 11 2695 1010");

        Station s2 = new Station(
                "IGL Mega Station - Sector 51",
                "Indraprastha Gas Limited (IGL)",
                "Main Master Plan Road, Sector 51",
                "Noida", "Uttar Pradesh",
                28.5772, 77.3718,
                true, 79.56, 30, 4, "06:00 - 23:00",
                "Restroom, Free Tyre Nitrogen, Convenience Store"
        );
        s2.setContactPhone("+91 120 248 3000");

        Station s3 = new Station(
                "Adani Total Gas - Pari Chowk Hub",
                "Adani Total Gas",
                "Plot 4B, Knowledge Park II, Near Pari Chowk",
                "Greater Noida", "Uttar Pradesh",
                28.4682, 77.5040,
                true, 81.20, 40, 6, "24x7",
                "Restroom, Cafe, Multi-bay High Speed Dispensers, Electric Vehicle Fast Charger"
        );
        s3.setContactPhone("+91 120 678 4400");

        Station s4 = new Station(
                "IndianOil & IGL Expressway CNG Hub - Jewar",
                "Indian Oil Corporation / IGL",
                "Yamuna Expressway KM 45, Near Jewar Interchange",
                "Jewar", "Uttar Pradesh",
                28.1420, 77.5620,
                true, 82.50, 48, 8, "24x7",
                "Highway Food Court, Restroom, High-Capacity Compressor, Driver Dormitory"
        );
        s4.setContactPhone("+91 5738 274 100");

        Station s5 = new Station(
                "BPCL Highway CNG Oasis - Mathura Bypass",
                "Bharat Petroleum",
                "NH-19 Mathura Bypass, Milestone 142",
                "Mathura", "Uttar Pradesh",
                27.5210, 77.6710,
                true, 83.10, 24, 4, "24x7",
                "Restroom, Truck/Car Parking, Highway Dhaba"
        );
        s5.setContactPhone("+91 565 240 5050");

        Station s6 = new Station(
                "Torrent Gas CNG - Sikandra Central",
                "Torrent Gas",
                "Delhi-Agra Highway, Sikandra Industrial Area",
                "Agra", "Uttar Pradesh",
                27.2185, 77.9380,
                true, 82.80, 30, 4, "05:00 - 00:00",
                "Restroom, Tea Stall, Digital Tyre Gauge"
        );
        s6.setContactPhone("+91 562 260 1200");

        // Delhi - Jaipur Corridor
        Station s7 = new Station(
                "Haryana City Gas - IFFCO Chowk",
                "Haryana City Gas Distribution",
                "Sector 29, Near IFFCO Chowk Flyover",
                "Gurugram", "Haryana",
                28.4715, 77.0725,
                true, 80.12, 32, 4, "24x7",
                "Restroom, ATM, EV Charging, Water Cooler"
        );

        Station s8 = new Station(
                "Torrent Gas Super Station - Manesar IMT",
                "Torrent Gas",
                "Sector 6, IMT Manesar, Delhi-Jaipur Expressway",
                "Manesar", "Haryana",
                28.3580, 76.9280,
                true, 81.50, 36, 6, "24x7",
                "Restroom, Food Court, Air Dispensers"
        );

        Station s9 = new Station(
                "Rajasthan State Gas - Neemrana Hub",
                "RSGL (Rajasthan State Gas Limited)",
                "RIICO Industrial Area Phase II, NH-48",
                "Neemrana", "Rajasthan",
                27.9890, 76.3880,
                true, 84.40, 28, 4, "24x7",
                "Restroom, Motel, Mechanic Shop"
        );

        Station s10 = new Station(
                "Adani Total Gas - Kukas Gateway",
                "Adani Total Gas",
                "Delhi Highway, RIICO Industrial Area Kukas",
                "Jaipur", "Rajasthan",
                27.0250, 75.8920,
                true, 83.90, 32, 4, "24x7",
                "Restroom, Fast Food, Car Wash"
        );

        // Mumbai - Pune Expressway Corridor
        Station s11 = new Station(
                "Mahanagar Gas Hub - Chembur Sion Link",
                "MGL (Mahanagar Gas Limited)",
                "Eastern Express Highway, Chembur",
                "Mumbai", "Maharashtra",
                19.0620, 72.8980,
                true, 75.00, 36, 6, "24x7",
                "Restroom, Air & Water, MGL City Center"
        );

        Station s12 = new Station(
                "MGL Mega CNG - Panvel Expressway Entry",
                "MGL (Mahanagar Gas Limited)",
                "Kalamboli Junction, Sion-Panvel Expressway",
                "Navi Mumbai", "Maharashtra",
                19.0220, 73.1050,
                true, 75.00, 48, 8, "24x7",
                "Restroom, Food Court, Nitrogen Air, 24x7 Convenience Store"
        );

        Station s13 = new Station(
                "MNGL Expressway Express Hub - Urse Toll",
                "MNGL (Maharashtra Natural Gas)",
                "Mumbai-Pune Expressway KM 82, Near Urse Toll Plaza",
                "Urse", "Maharashtra",
                18.7350, 73.6420,
                true, 77.20, 40, 6, "24x7",
                "Expressway Food Plaza, Restroom, Emergency Assistance"
        );

        Station s14 = new Station(
                "MNGL High-Capacity Station - Hinjewadi",
                "MNGL (Maharashtra Natural Gas)",
                "Phase 1, Hinjewadi Rajiv Gandhi Infotech Park",
                "Pune", "Maharashtra",
                18.5910, 73.7380,
                true, 77.20, 32, 4, "24x7",
                "Restroom, Coffee Shop, Digital Payment"
        );

        List<Station> saved = stationRepository.saveAll(List.of(s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14));

        LocalDateTime now = LocalDateTime.now();

        // Seed queue & pressure telemetry for each station
        seedStationTelemetry(s1, 14, 23, 195.0, "ONLINE", "Simulated Demo Data", false, now);
        seedStationTelemetry(s2, 8, 16, 208.5, "ONLINE", "Authorized Operator", true, now);
        seedStationTelemetry(s3, 3, 5, 214.0, "ONLINE", "SCADA Pressure Sensor", true, now);
        seedStationTelemetry(s4, 5, 6, 218.0, "ONLINE", "Authorized Operator", true, now);
        seedStationTelemetry(s5, 11, 28, 172.0, "DEGRADED", "Simulated Demo Data", false, now); // Low pressure example
        seedStationTelemetry(s6, 4, 8, 204.0, "ONLINE", "Simulated Demo Data", false, now);
        seedStationTelemetry(s7, 12, 22, 198.0, "ONLINE", "Authorized Operator", true, now);
        seedStationTelemetry(s8, 2, 4, 212.0, "ONLINE", "SCADA Pressure Sensor", true, now);
        seedStationTelemetry(s9, 6, 13, 201.0, "ONLINE", "Simulated Demo Data", false, now);
        seedStationTelemetry(s10, 7, 14, 206.0, "ONLINE", "Simulated Demo Data", false, now);
        seedStationTelemetry(s11, 16, 26, 196.0, "ONLINE", "Simulated Demo Data", false, now);
        seedStationTelemetry(s12, 4, 5, 215.0, "ONLINE", "Authorized Operator", true, now);
        seedStationTelemetry(s13, 5, 8, 210.0, "ONLINE", "SCADA Pressure Sensor", true, now);
        seedStationTelemetry(s14, 9, 17, 202.0, "ONLINE", "Simulated Demo Data", false, now);

        log.info("Successfully seeded {} CNG stations with realistic queue and pressure telemetry.", saved.size());
    }

    private void seedStationTelemetry(Station station, int currentQueue, int estimatedWait, 
                                      double currentPressure, String sensorStatus, 
                                      String dataSource, boolean isLive, LocalDateTime now) {
        // Current queue observation
        QueueObservation qCurrent = new QueueObservation(
                station.getId(), currentQueue, estimatedWait, dataSource,
                isLive ? "SCADA Camera Sensor" : "Station Dispatcher", isLive
        );
        qCurrent.setCreatedAt(now.minusMinutes(4));
        queueObservationRepository.save(qCurrent);

        // A few historical queue points
        for (int i = 1; i <= 4; i++) {
            int historicQueue = Math.max(1, currentQueue + (i % 2 == 0 ? 3 : -2));
            int histWait = Math.max(2, estimatedWait + (i % 2 == 0 ? 6 : -4));
            QueueObservation qHist = new QueueObservation(
                    station.getId(), historicQueue, histWait, dataSource, "Historical Log", isLive
            );
            qHist.setCreatedAt(now.minusMinutes(i * 35));
            queueObservationRepository.save(qHist);
        }

        // Pressure readings history (for Chart.js curve)
        double[] variations = { -3.5, 2.0, -1.0, 4.2, -2.1, 1.5, -0.5, 0.0 };
        for (int i = 0; i < variations.length; i++) {
            double p = Math.round((currentPressure + variations[i]) * 10.0) / 10.0;
            PressureReading pr = new PressureReading(
                    station.getId(), p, 180.0, 220.0, sensorStatus, dataSource, isLive
            );
            pr.setCreatedAt(now.minusMinutes((variations.length - i - 1) * 20));
            pressureReadingRepository.save(pr);
        }
    }
}
