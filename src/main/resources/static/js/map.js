// CNG Navigator Map Controller (Leaflet + OpenStreetMap)
class CNGMapController {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.routeLayer = null;
    this.altRouteLayers = [];
    this.stationMarkers = [];
    this.startMarker = null;
    this.destMarker = null;
    this.stopMarker = null;
    this.initMap();
  }

  initMap() {
    // Default center on Delhi NCR / Northern Corridor
    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: true
    }).setView([28.6139, 77.2090], 9);

    // High quality OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  clearMap() {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
    this.altRouteLayers.forEach(layer => this.map.removeLayer(layer));
    this.altRouteLayers = [];

    this.stationMarkers.forEach(m => this.map.removeLayer(m));
    this.stationMarkers = [];

    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = null;
    }
    if (this.destMarker) {
      this.map.removeLayer(this.destMarker);
      this.destMarker = null;
    }
    if (this.stopMarker) {
      this.map.removeLayer(this.stopMarker);
      this.stopMarker = null;
    }
  }

  renderRouteAndStations(routeData, onSelectStation) {
    this.clearMap();

    const geometry = routeData.routeGeometry;
    if (geometry && geometry.length > 0) {
      // Primary Route Polyline (Emerald Gradient Style)
      this.routeLayer = L.polyline(geometry, {
        color: "#10b981",
        weight: 6,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(this.map);

      // Start Marker (A)
      const startCoord = geometry[0];
      const startIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:#10b981; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; border:3px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3);">A</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      this.startMarker = L.marker(startCoord, { icon: startIcon }).addTo(this.map)
        .bindPopup("<b>Starting Location (A)</b>");

      // Destination Marker (B)
      const destCoord = geometry[geometry.length - 1];
      const destIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background:#ef4444; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; border:3px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3);">B</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      this.destMarker = L.marker(destCoord, { icon: destIcon }).addTo(this.map)
        .bindPopup("<b>Destination (B)</b>");

      // Alternative Routes
      if (routeData.alternatives && routeData.alternatives.length > 0) {
        routeData.alternatives.forEach((alt, idx) => {
          if (alt.routeGeometry && alt.routeGeometry.length > 0) {
            const altLayer = L.polyline(alt.routeGeometry, {
              color: "#64748b",
              dashArray: "6, 8",
              weight: 4,
              opacity: 0.65
            }).addTo(this.map);
            altLayer.bindPopup(`<b>${alt.name}</b><br>${alt.distanceKm} km &bull; ${alt.durationMinutes} mins<br><i>${alt.description}</i>`);
            this.altRouteLayers.push(altLayer);
          }
        });
      }
    }

    // Render Station Markers
    if (routeData.stations && routeData.stations.length > 0) {
      routeData.stations.forEach(station => {
        const marker = this.createStationMarker(station, onSelectStation);
        marker.addTo(this.map);
        this.stationMarkers.push(marker);
      });
    }

    // Fit Map to View
    if (this.routeLayer) {
      this.map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });
    }
  }

  createStationMarker(station, onSelectStation) {
    let pinColor = "#10b981"; // fast queue
    let queueBadge = `${station.vehiclesWaiting || 0}`;

    if (station.vehiclesWaiting >= 12) {
      pinColor = "#ef4444"; // heavy queue
    } else if (station.vehiclesWaiting >= 6) {
      pinColor = "#f59e0b"; // moderate queue
    }

    let starBadge = "";
    if (station.recommendationCategory === "BEST_OVERALL") {
      starBadge = `<span style="position:absolute; top:-6px; right:-6px; background:#eab308; color:white; border-radius:50%; width:16px; height:16px; font-size:10px; display:flex; align-items:center; justify-content:center; border:1px solid white;">★</span>`;
    }

    const iconHtml = `
      <div style="position:relative; width:34px; height:34px; cursor:pointer;" id="marker-st-${station.id}">
        <div style="background:${pinColor}; width:32px; height:32px; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 22h12M4 9h10M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"></path></svg>
          <span style="font-size:9px; font-weight:800; line-height:1;">${queueBadge}</span>
        </div>
        ${starBadge}
      </div>
    `;

    const customIcon = L.divIcon({
      className: "cng-station-pin",
      html: iconHtml,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });

    const marker = L.marker([station.latitude, station.longitude], { icon: customIcon });

    const popupContent = `
      <div style="font-family:-apple-system,sans-serif; min-width:210px; padding:4px;">
        <div style="font-size:13px; font-weight:bold; color:#0f172a; margin-bottom:2px;">${station.name}</div>
        <div style="font-size:11px; color:#64748b; margin-bottom:6px;">${station.operator} &bull; ${station.city}</div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#f8fafc; padding:6px; border-radius:6px; font-size:11px; margin-bottom:8px;">
          <div><span style="color:#64748b;">Queue:</span> <b>${station.vehiclesWaiting} cars</b> (~${station.estimatedWaitMinutes}m)</div>
          <div><span style="color:#64748b;">Detour:</span> <b>+${station.extraDetourKm} km</b> (+${station.estimatedDetourMinutes}m)</div>
          <div><span style="color:#64748b;">Pressure:</span> <b>${station.currentPressureBar ? station.currentPressureBar + ' bar' : 'N/A'}</b></div>
          <div><span style="color:#64748b;">Status:</span> <b>${station.verifiedOpen ? 'Verified Open' : 'Closed'}</b></div>
        </div>

        <div style="display:flex; gap:4px;">
          <button onclick="window.cngApp.openStationDetails(${station.id})" style="flex:1; background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer;">Details & Charts</button>
          <button onclick="window.cngApp.addStopAndRecalculate(${station.id})" style="background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Add Stop</button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.on("click", () => {
      if (onSelectStation) onSelectStation(station);
    });

    return marker;
  }

  highlightStation(stationId) {
    const st = this.stationMarkers.find(m => m.getLatLng());
    // Fly to coordinates smoothly
    const found = window.cngApp.discoveredStations.find(s => s.id === stationId);
    if (found) {
      this.map.flyTo([found.latitude, found.longitude], 13, { duration: 0.8 });
    }
  }
}
