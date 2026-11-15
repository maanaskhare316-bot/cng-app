// CNG Navigator Main Application Engine
class CNGApp {
  constructor() {
    this.mapCtrl = null;
    this.currentRouteData = null;
    this.discoveredStations = [];
    this.allStations = [];
    this.selectedStopStationId = null;

    // Preset corridors for instant one-click testing
    this.presets = {
      delhi_agra: {
        start: { name: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 },
        dest: { name: "Taj Mahal, Agra", lat: 27.1751, lng: 78.0421 }
      },
      delhi_jaipur: {
        start: { name: "Dhaula Kuan, New Delhi", lat: 28.5921, lng: 77.1610 },
        dest: { name: "Hawa Mahal, Jaipur", lat: 26.9239, lng: 75.8267 }
      },
      mumbai_pune: {
        start: { name: "BKC, Mumbai", lat: 19.0662, lng: 72.8687 },
        dest: { name: "Shivajinagar, Pune", lat: 18.5308, lng: 73.8475 }
      }
    };
  }

  async init() {
    this.mapCtrl = new CNGMapController("map");
    await this.fetchAllStations();
    this.setupEventListeners();
    this.setupAutocomplete();

    // Check Gemini API status
    this.checkGeminiStatus();

    // Automatically load Delhi to Agra corridor on startup for instant live demonstration
    this.loadPreset("delhi_agra");
  }

  // Common landmarks and presets for instant offline/zero-latency autocomplete
  getPopularLocations() {
    return [
      { name: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167, sub: "Central Delhi, Delhi" },
      { name: "India Gate, New Delhi", lat: 28.6129, lng: 77.2295, sub: "New Delhi, Delhi" },
      { name: "Sarita Vihar, New Delhi", lat: 28.5355, lng: 77.2915, sub: "South East Delhi, Delhi" },
      { name: "Sector 18, Noida", lat: 28.5708, lng: 77.3271, sub: "Gautam Buddha Nagar, UP" },
      { name: "Pari Chowk, Greater Noida", lat: 28.4682, lng: 77.5040, sub: "Greater Noida, UP" },
      { name: "Jewar Interchange, Yamuna Expressway", lat: 28.1420, lng: 77.5620, sub: "Jewar, UP" },
      { name: "Mathura Junction, Mathura", lat: 27.4924, lng: 77.6737, sub: "Mathura, UP" },
      { name: "Taj Mahal, Agra", lat: 27.1751, lng: 78.0421, sub: "Agra, UP" },
      { name: "Sikandra, Agra", lat: 27.2185, lng: 77.9380, sub: "Agra, UP" },
      { name: "Dhaula Kuan, New Delhi", lat: 28.5921, lng: 77.1610, sub: "South West Delhi, Delhi" },
      { name: "IFFCO Chowk, Gurugram", lat: 28.4715, lng: 77.0725, sub: "Gurugram, Haryana" },
      { name: "Manesar IMT, Haryana", lat: 28.3580, lng: 76.9280, sub: "Manesar, Haryana" },
      { name: "Neemrana Industrial Area, Rajasthan", lat: 27.9890, lng: 76.3880, sub: "Neemrana, NH-48" },
      { name: "Hawa Mahal, Jaipur", lat: 26.9239, lng: 75.8267, sub: "Jaipur, Rajasthan" },
      { name: "BKC, Mumbai", lat: 19.0662, lng: 72.8687, sub: "Bandra Kurla Complex, Mumbai" },
      { name: "Vashi, Navi Mumbai", lat: 19.0771, lng: 72.9986, sub: "Navi Mumbai, Maharashtra" },
      { name: "Panvel Expressway Entry, Navi Mumbai", lat: 19.0220, lng: 73.1050, sub: "Navi Mumbai, Maharashtra" },
      { name: "Lonavala, Maharashtra", lat: 18.7557, lng: 73.4091, sub: "Mumbai-Pune Expressway" },
      { name: "Hinjewadi Phase 1, Pune", lat: 18.5910, lng: 73.7380, sub: "Pune, Maharashtra" },
      { name: "Shivajinagar, Pune", lat: 18.5308, lng: 73.8475, sub: "Pune, Maharashtra" }
    ];
  }

  setupAutocomplete() {
    this.bindAutocompleteField("startLocationInput", "startAutocompleteList");
    this.bindAutocompleteField("destLocationInput", "destAutocompleteList");

    // Close autocomplete on click outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".input-group")) {
        document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.classList.remove("open"));
      }
    });
  }

  bindAutocompleteField(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    let debounceTimer = null;

    input.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (q.length < 2) {
        dropdown.classList.remove("open");
        dropdown.innerHTML = "";
        return;
      }

      debounceTimer = setTimeout(async () => {
        const queryLower = q.toLowerCase();
        // 1. Check local preset catalog
        let matches = this.getPopularLocations().filter(loc => 
          loc.name.toLowerCase().includes(queryLower) || loc.sub.toLowerCase().includes(queryLower)
        );

        // 2. Fetch live OSM Nominatim if query is longer and matches are few
        if (matches.length < 4) {
          try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`, {
              headers: { "Accept-Language": "en" }
            });
            if (resp.ok) {
              const nominatimData = await resp.json();
              nominatimData.forEach(item => {
                matches.push({
                  name: item.display_name.split(",")[0],
                  sub: item.display_name.split(",").slice(1, 4).join(", "),
                  lat: parseFloat(item.lat),
                  lng: parseFloat(item.lon)
                });
              });
            }
          } catch (err) {
            // Silently use preset matches if external geocoding is rate-limited
          }
        }

        // Render dropdown
        if (matches.length > 0) {
          dropdown.innerHTML = "";
          matches.slice(0, 6).forEach(m => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="margin-top:2px; flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <div>
                <div class="autocomplete-item-title">${m.name}</div>
                <div class="autocomplete-item-sub">${m.sub}</div>
              </div>
            `;
            item.onmousedown = () => {
              input.value = m.name;
              input.dataset.lat = m.lat;
              input.dataset.lng = m.lng;
              dropdown.classList.remove("open");
            };
            dropdown.appendChild(item);
          });
          dropdown.classList.add("open");
        } else {
          dropdown.classList.remove("open");
        }
      }, 250);
    });

    input.addEventListener("focus", () => {
      if (input.value.trim().length >= 2) {
        input.dispatchEvent(new Event("input"));
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        dropdown.classList.remove("open");
        this.calculateTripRoute();
      }
    });
  }

  formatRelativeTime(isoStr) {
    if (!isoStr) return "Just now";
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const diffSecs = Math.max(0, Math.floor((now - date) / 1000));
      if (diffSecs < 60) return "Just now";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch (e) {
      return "Just now";
    }
  }

  async checkGeminiStatus() {
    try {
      const resp = await fetch("/api/gemini/status");
      const data = await resp.json();
      const statusPill = document.getElementById("geminiStatusBadge");
      if (data.configured) {
        statusPill.innerHTML = `<span class="badge badge-gemini">&check; ${data.model}</span>`;
      } else {
        statusPill.innerHTML = `<span class="badge badge-gemini" title="Add GEMINI_API_KEY to activate live API">✨ Gemini 3.8 Flash (Demo Mode)</span>`;
      }
    } catch (e) {
      console.warn("Could not check Gemini status", e);
    }
  }

  async fetchAllStations() {
    try {
      const resp = await fetch("/api/stations");
      this.allStations = await resp.json();
    } catch (e) {
      console.error("Error fetching all stations:", e);
    }
  }

  setupEventListeners() {
    document.getElementById("btnCalcRoute").addEventListener("click", () => this.calculateTripRoute());
    document.getElementById("btnSwapLocations").addEventListener("click", () => this.swapLocations());
    document.getElementById("btnCurrentLocation").addEventListener("click", () => this.useCurrentLocation());
    document.getElementById("detourSlider").addEventListener("input", (e) => {
      document.getElementById("detourSliderValue").innerText = `${e.target.value} km`;
    });
    document.getElementById("detourSlider").addEventListener("change", () => {
      if (this.currentRouteData) {
        this.calculateTripRoute();
      }
    });
  }

  loadPreset(key) {
    const p = this.presets[key];
    if (!p) return;

    // Highlight chip
    document.querySelectorAll(".corridor-chip").forEach(c => c.classList.remove("active"));
    const activeChip = document.getElementById(`chip-${key}`);
    if (activeChip) activeChip.classList.add("active");

    document.getElementById("startLocationInput").value = p.start.name;
    document.getElementById("startLocationInput").dataset.lat = p.start.lat;
    document.getElementById("startLocationInput").dataset.lng = p.start.lng;

    document.getElementById("destLocationInput").value = p.dest.name;
    document.getElementById("destLocationInput").dataset.lat = p.dest.lat;
    document.getElementById("destLocationInput").dataset.lng = p.dest.lng;

    this.selectedStopStationId = null;
    this.updateStopBanner();
    this.calculateTripRoute();
  }

  swapLocations() {
    const sInput = document.getElementById("startLocationInput");
    const dInput = document.getElementById("destLocationInput");

    const tempName = sInput.value;
    const tempLat = sInput.dataset.lat;
    const tempLng = sInput.dataset.lng;

    sInput.value = dInput.value;
    sInput.dataset.lat = dInput.dataset.lat;
    sInput.dataset.lng = dInput.dataset.lng;

    dInput.value = tempName;
    dInput.dataset.lat = tempLat;
    dInput.dataset.lng = tempLng;

    if (sInput.value && dInput.value) {
      this.calculateTripRoute();
    }
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Using Delhi Connaught Place as reference.");
      return;
    }

    const sInput = document.getElementById("startLocationInput");
    sInput.value = "Locating GPS position...";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sInput.value = `Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
        sInput.dataset.lat = pos.coords.latitude;
        sInput.dataset.lng = pos.coords.longitude;
      },
      (err) => {
        // Fallback for sandboxed/mock environment
        sInput.value = "Current Location: Connaught Place, New Delhi";
        sInput.dataset.lat = "28.6315";
        sInput.dataset.lng = "77.2167";
      },
      { timeout: 5000 }
    );
  }

  async calculateTripRoute() {
    const sInput = document.getElementById("startLocationInput");
    const dInput = document.getElementById("destLocationInput");

    let startLat = parseFloat(sInput.dataset.lat || "28.6315");
    let startLng = parseFloat(sInput.dataset.lng || "77.2167");
    let destLat = parseFloat(dInput.dataset.lat || "27.1751");
    let destLng = parseFloat(dInput.dataset.lng || "78.0421");
    const maxDetour = parseFloat(document.getElementById("detourSlider").value || "5.0");

    const loadingEl = document.getElementById("stationsLoading");
    const listEl = document.getElementById("stationsList");
    const recSection = document.getElementById("recommendationsSection");

    loadingEl.style.display = "flex";
    listEl.innerHTML = "";
    recSection.style.display = "none";

    try {
      const resp = await fetch("/api/stations/search-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startLat: startLat,
          startLng: startLng,
          startAddress: sInput.value,
          destLat: destLat,
          destLng: destLng,
          destAddress: dInput.value,
          maxDetourKm: maxDetour,
          selectedStationId: this.selectedStopStationId
        })
      });

      if (!resp.ok) throw new Error("Failed to calculate route");

      const data = await resp.json();
      this.currentRouteData = data;
      this.discoveredStations = data.stations || [];

      loadingEl.style.display = "none";

      // Render Route Metrics Bar
      document.getElementById("routeMetricsStrip").style.display = "grid";
      document.getElementById("metricDistance").innerText = `${data.totalDistanceKm} km`;
      document.getElementById("metricDuration").innerText = `${Math.floor(data.totalDurationMinutes / 60)}h ${data.totalDurationMinutes % 60}m`;
      document.getElementById("metricStationsCount").innerText = `${this.discoveredStations.length} Pumps`;
      document.getElementById("routeSourceTag").innerText = data.routeSource;

      // Render Map
      this.mapCtrl.renderRouteAndStations(data, (st) => this.focusStationCard(st.id));

      // Render Recommendations
      this.renderRecommendations(data);

      // Render Stations List
      this.renderStationsList(this.discoveredStations);

      // Trigger Gemini Advisor
      if (window.geminiAssistant) {
        window.geminiAssistant.fetchTripAdvisory(data, sInput.value, dInput.value);
      }
    } catch (e) {
      loadingEl.style.display = "none";
      listEl.innerHTML = `<div class="empty-state"><p style="color:#ef4444;">Error calculating route: ${e.message}</p></div>`;
      console.error(e);
    }
  }

  renderRecommendations(data) {
    const sec = document.getElementById("recommendationsSection");
    if (!this.discoveredStations || this.discoveredStations.length === 0) {
      sec.style.display = "none";
      return;
    }

    sec.style.display = "block";
    const container = document.getElementById("recommendationCardsContainer");
    container.innerHTML = "";

    const { bestOverall, nearestOnRoute, shortestQueue } = data;

    if (bestOverall) {
      container.appendChild(this.buildRecCardElement("BEST OVERALL", "tag-best", "best-overall", bestOverall));
    }
    if (nearestOnRoute && nearestOnRoute.id !== (bestOverall && bestOverall.id)) {
      container.appendChild(this.buildRecCardElement("NEAREST ON ROUTE", "tag-nearest", "nearest", nearestOnRoute));
    }
    if (shortestQueue && shortestQueue.id !== (bestOverall && bestOverall.id) && shortestQueue.id !== (nearestOnRoute && nearestOnRoute.id)) {
      container.appendChild(this.buildRecCardElement("SHORTEST QUEUE", "tag-queue", "shortest-queue", shortestQueue));
    }
  }

  buildRecCardElement(badgeText, tagClass, cardModifier, station) {
    const div = document.createElement("div");
    div.className = `rec-card ${cardModifier}`;
    div.onclick = () => this.openStationDetails(station.id);

    div.innerHTML = `
      <div class="rec-badge-tag ${tagClass}">★ ${badgeText}</div>
      <div class="rec-station-name">${station.name}</div>
      <div class="rec-reason">${station.recommendationReason}</div>
      <div class="rec-stats-mini">
        <span>Queue: <b>${station.vehiclesWaiting} cars</b> (~${station.estimatedWaitMinutes}m)</span>
        <span>Detour: <b>+${station.extraDetourKm} km</b> (+${station.estimatedDetourMinutes}m)</span>
        <span>Pressure: <b>${station.currentPressureBar ? station.currentPressureBar + ' bar' : 'N/A'}</b></span>
      </div>
    `;
    return div;
  }

  renderStationsList(stations) {
    const listEl = document.getElementById("stationsList");
    listEl.innerHTML = "";

    if (!stations || stations.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <p>No CNG pumps found within the selected detour perimeter.</p>
          <span style="font-size:12px; margin-top:6px; color:#64748b;">Try increasing the search perimeter slider above.</span>
        </div>
      `;
      return;
    }

    stations.forEach(station => {
      const card = document.createElement("div");
      card.className = "station-card";
      card.id = `station-card-${station.id}`;
      card.onclick = () => this.mapCtrl.highlightStation(station.id);

      // Freshness tags
      const qFreshClass = station.queueFreshness === "FRESH" ? "freshness-fresh" : (station.queueFreshness === "STALE" ? "freshness-stale" : "freshness-simulated");
      const pFreshClass = station.pressureFreshness === "FRESH" ? "freshness-fresh" : (station.pressureFreshness === "STALE" ? "freshness-stale" : "freshness-simulated");

      let dotColor = "dot-green";
      if (station.vehiclesWaiting >= 12) dotColor = "dot-red";
      else if (station.vehiclesWaiting >= 6) dotColor = "dot-amber";

      const isCurrentStop = (this.selectedStopStationId === station.id);

      card.innerHTML = `
        <div class="card-header">
          <div>
            <div class="station-title">${station.name}</div>
            <span class="operator-badge">${station.operator} &bull; ${station.city}</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:3px;">
            <span class="badge ${station.verifiedOpen ? 'badge-live' : 'badge-demo'}">
              ${station.verifiedOpen ? 'Verified Open' : 'Closed'}
            </span>
            ${station.verifiedPricePerKg ? `<span style="font-size:11px; font-weight:700; color:#047857;">₹${station.verifiedPricePerKg.toFixed(2)}/kg</span>` : ''}
          </div>
        </div>

        <div class="station-address">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${station.address}
        </div>

        <div class="telemetry-grid">
          <div class="telemetry-cell">
            <span class="telemetry-label">Vehicle Queue</span>
            <div class="telemetry-value">
              <span class="status-dot ${dotColor}"></span>
              ${station.vehiclesWaiting} cars (~${station.estimatedWaitMinutes}m)
              <span class="freshness-tag ${qFreshClass}">${station.queueFreshness}</span>
            </div>
            <div class="telemetry-meta-row">
              <span class="telemetry-time-tag">Updated: ${this.formatRelativeTime(station.queueUpdatedAt)}</span>
              <span>${station.isQueueLive ? '● Live Sensor' : 'Simulated'}</span>
            </div>
          </div>

          <div class="telemetry-cell">
            <span class="telemetry-label">CNG Pressure</span>
            <div class="telemetry-value">
              ${station.currentPressureBar ? station.currentPressureBar + ' bar' : 'Offline'}
              <span class="freshness-tag ${pFreshClass}">${station.pressureFreshness}</span>
            </div>
            <div class="telemetry-meta-row">
              <span class="telemetry-time-tag">Updated: ${this.formatRelativeTime(station.pressureUpdatedAt)}</span>
              <span style="font-weight:600; color:${station.sensorStatus === 'ONLINE' ? '#059669' : '#dc2626'}">${station.sensorStatus}</span>
            </div>
          </div>

          <div class="telemetry-cell">
            <span class="telemetry-label">Extra Detour</span>
            <div class="telemetry-value" style="color:#059669;">
              +${station.extraDetourKm} km (+${station.estimatedDetourMinutes} min)
            </div>
            <div class="telemetry-meta-row">
              <span>${station.distanceFromRouteKm} km off corridor</span>
            </div>
          </div>

          <div class="telemetry-cell">
            <span class="telemetry-label">Verified Price & Bays</span>
            <div class="telemetry-value">
              ${station.verifiedPricePerKg ? '₹' + station.verifiedPricePerKg.toFixed(2) + '/kg' : 'Unverified'}
            </div>
            <div class="telemetry-meta-row">
              <span>${station.activeDispensers || 4} bays (${station.dispenserCapacityPerHour || 30} cars/hr)</span>
            </div>
          </div>
        </div>

        <div style="font-size:10.5px; color:#64748b; margin-bottom:8px;">
          Telemetry source: <i>${station.pressureDataSource}</i> &bull; Queue source: <i>${station.queueDataSource}</i>
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.cngApp.openStationDetails(${station.id})">
            View Details & Charts
          </button>
          
          <button class="btn ${isCurrentStop ? 'btn-gemini' : 'btn-secondary'} btn-sm" onclick="event.stopPropagation(); window.cngApp.addStopAndRecalculate(${station.id})">
            ${isCurrentStop ? '★ Current Stop' : '+ Add as Stop'}
          </button>

          <a href="https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}" target="_blank" class="btn btn-primary btn-sm" onclick="event.stopPropagation();" style="text-decoration:none;">
            Navigate
          </a>
        </div>
      `;

      listEl.appendChild(card);
    });
  }

  focusStationCard(stationId) {
    const card = document.getElementById(`station-card-${stationId}`);
    if (card) {
      document.querySelectorAll(".station-card").forEach(c => c.classList.remove("active-marker"));
      card.classList.add("active-marker");
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  addStopAndRecalculate(stationId) {
    if (this.selectedStopStationId === stationId) {
      this.selectedStopStationId = null;
    } else {
      this.selectedStopStationId = stationId;
    }
    this.updateStopBanner();
    this.calculateTripRoute();
  }

  removeStop() {
    this.selectedStopStationId = null;
    this.updateStopBanner();
    this.calculateTripRoute();
  }

  updateStopBanner() {
    const banner = document.getElementById("activeStopBanner");
    if (!this.selectedStopStationId) {
      banner.style.display = "none";
      return;
    }

    const st = this.allStations.find(s => s.id === this.selectedStopStationId) || 
               this.discoveredStations.find(s => s.id === this.selectedStopStationId);

    if (st) {
      banner.style.display = "flex";
      document.getElementById("activeStopName").innerText = st.name;
    }
  }

  async openStationDetails(stationId) {
    const st = this.allStations.find(s => s.id === stationId) || 
               this.discoveredStations.find(s => s.id === stationId);
    if (!st) return;

    const modal = document.getElementById("stationModal");
    modal.classList.add("open");

    document.getElementById("modalStationTitle").innerText = st.name;
    document.getElementById("modalStationSubtitle").innerText = `${st.operator} • ${st.address}, ${st.city}`;

    // Fill metrics
    document.getElementById("modalStatQueue").innerText = `${st.vehiclesWaiting || 0} cars`;
    document.getElementById("modalStatWait").innerText = `~${st.estimatedWaitMinutes || 0} mins`;
    document.getElementById("modalStatPressure").innerText = `${st.currentPressureBar ? st.currentPressureBar + ' bar' : 'Unavailable'}`;
    document.getElementById("modalStatPrice").innerText = `${st.verifiedPricePerKg ? '₹' + st.verifiedPricePerKg + '/kg' : 'N/A'}`;
    document.getElementById("modalStatDispensers").innerText = `${st.activeDispensers || 4} bays (${st.dispenserCapacityPerHour || 30} cars/hr)`;
    document.getElementById("modalStatHours").innerText = st.operatingHours || "24x7";
    document.getElementById("modalStatAmenities").innerText = st.amenities || "Air, Restroom";

    // Nav button in modal
    document.getElementById("modalNavBtn").href = `https://www.google.com/maps/dir/?api=1&destination=${st.latitude},${st.longitude}`;

    // Fetch and render historical pressure chart
    try {
      const resp = await fetch(`/api/telemetry/stations/${stationId}/pressure/history`);
      const readings = await resp.json();
      if (readings && readings.length > 0) {
        renderPressureChart("modalPressureChart", readings, st.minSafeLimitBar, st.maxSafeLimitBar);
      }
    } catch (e) {
      console.error("Error loading pressure chart:", e);
    }
  }

  closeStationModal() {
    document.getElementById("stationModal").classList.remove("open");
  }

  openComparisonModal() {
    const modal = document.getElementById("comparisonModal");
    modal.classList.add("open");

    const tbody = document.getElementById("comparisonTableBody");
    tbody.innerHTML = "";

    if (!this.discoveredStations || this.discoveredStations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#64748b;">No discovered stations yet. Calculate a route first.</td></tr>`;
      return;
    }

    this.discoveredStations.forEach(s => {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #f1f5f9";
      tr.innerHTML = `
        <td style="padding:10px; font-weight:bold; color:#0f172a;">${s.name}</td>
        <td style="padding:10px; color:#059669;">+${s.extraDetourKm} km (+${s.estimatedDetourMinutes}m)</td>
        <td style="padding:10px;"><b>${s.vehiclesWaiting} cars</b> (~${s.estimatedWaitMinutes}m)</td>
        <td style="padding:10px;"><b>${s.currentPressureBar ? s.currentPressureBar + ' bar' : 'N/A'}</b> (${s.pressureFreshness})</td>
        <td style="padding:10px;">${s.verifiedPricePerKg ? '₹' + s.verifiedPricePerKg + '/kg' : 'N/A'}</td>
        <td style="padding:10px;">
          <button class="btn btn-primary btn-sm" onclick="window.cngApp.openStationDetails(${s.id})">Details</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  closeComparisonModal() {
    document.getElementById("comparisonModal").classList.remove("open");
  }

  refreshCurrentView() {
    this.calculateTripRoute();
  }

  getRouteSummaryText() {
    if (!this.currentRouteData) return "Route from A to B";
    return `Route distance ${this.currentRouteData.totalDistanceKm} km, Duration ${this.currentRouteData.totalDurationMinutes} minutes, ${this.discoveredStations.length} CNG stations discovered along corridor.`;
  }
}

window.cngApp = new CNGApp();
document.addEventListener("DOMContentLoaded", () => window.cngApp.init());
