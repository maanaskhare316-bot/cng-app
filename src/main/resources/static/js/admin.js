// CNG Navigator Admin & Station Operator Portal
class AdminPortal {
  constructor() {
    this.adminKey = localStorage.getItem("cng_admin_key") || "cng-admin-secret-2026";
    this.verified = false;
  }

  openPortal() {
    const modal = document.getElementById("adminModal");
    modal.classList.add("open");
    document.getElementById("adminKeyInput").value = this.adminKey;
    this.populateStationDropdown();
  }

  closePortal() {
    document.getElementById("adminModal").classList.remove("open");
  }

  async verifyKey() {
    const key = document.getElementById("adminKeyInput").value.trim();
    const statusDiv = document.getElementById("adminAuthStatus");

    try {
      const resp = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": key
        }
      });

      const data = await resp.json();
      if (resp.ok && data.authorized) {
        this.adminKey = key;
        localStorage.setItem("cng_admin_key", key);
        this.verified = true;
        statusDiv.innerHTML = `<span style="color:#059669; font-weight:bold;">&check; Authenticated as Authorized Station Operator</span>`;
        document.getElementById("adminOperationsForm").style.display = "block";
      } else {
        this.verified = false;
        statusDiv.innerHTML = `<span style="color:#ef4444; font-weight:bold;">&cross; Invalid Admin Secret Key</span>`;
      }
    } catch (e) {
      statusDiv.innerHTML = `<span style="color:#ef4444;">Server error during verification</span>`;
    }
  }

  populateStationDropdown() {
    const select = document.getElementById("adminStationSelect");
    select.innerHTML = '<option value="">-- Choose CNG Station --</option>';
    
    if (window.cngApp && window.cngApp.allStations) {
      window.cngApp.allStations.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.city}) [ID: ${s.id}]`;
        select.appendChild(opt);
      });
    }
    this.populateAdminStationsList();
  }

  switchTab(tabName) {
    document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.remove("active"));

    if (tabName === "telemetry") {
      document.getElementById("tabBtnTelemetry").classList.add("active");
      document.getElementById("tabContentTelemetry").classList.add("active");
    } else {
      document.getElementById("tabBtnStations").classList.add("active");
      document.getElementById("tabContentStations").classList.add("active");
      this.populateAdminStationsList();
    }
  }

  populateAdminStationsList() {
    const listEl = document.getElementById("adminStationsList");
    if (!listEl) return;
    listEl.innerHTML = "";

    const stations = (window.cngApp && window.cngApp.allStations) || [];
    if (stations.length === 0) {
      listEl.innerHTML = `<div style="padding:10px; color:#64748b; text-align:center;">No stations found.</div>`;
      return;
    }

    stations.forEach(s => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-bottom:1px solid #f1f5f9;";
      row.innerHTML = `
        <div style="flex:1; padding-right:8px;">
          <div style="font-weight:600; color:#0f172a;">${s.name}</div>
          <div style="font-size:11px; color:#64748b;">${s.operator} &bull; ${s.city} &bull; ₹${s.verifiedPricePerKg ? s.verifiedPricePerKg.toFixed(2) : 'N/A'}/kg &bull; ${s.verifiedOpen ? '<span style="color:#10b981;">Open</span>' : '<span style="color:#ef4444;">Closed</span>'}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-sm" style="font-size:10px; padding:2px 6px;" onclick="window.adminPortal.editStationRecord(${s.id})">Edit</button>
          <button class="btn btn-secondary btn-sm" style="font-size:10px; padding:2px 6px; color:#ef4444;" onclick="window.adminPortal.deleteStationRecord(${s.id})">Delete</button>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  editStationRecord(id) {
    const s = window.cngApp.allStations.find(item => item.id === id);
    if (!s) return;

    document.getElementById("adminStationId").value = s.id;
    document.getElementById("adminStationName").value = s.name || "";
    document.getElementById("adminStationOperator").value = s.operator || "";
    document.getElementById("adminStationAddress").value = s.address || "";
    document.getElementById("adminStationCity").value = s.city || "";
    document.getElementById("adminStationState").value = s.state || "";
    document.getElementById("adminStationLat").value = s.latitude || "";
    document.getElementById("adminStationLng").value = s.longitude || "";
    document.getElementById("adminStationPrice").value = s.verifiedPricePerKg || "";
    document.getElementById("adminStationCapacity").value = s.dispenserCapacityPerHour || 30;
    document.getElementById("adminStationVerifiedOpen").checked = Boolean(s.verifiedOpen);
    document.getElementById("adminStationHours").value = s.operatingHours || "24x7";

    document.getElementById("adminStationFormTitle").innerText = `Edit Station Record [ID: ${s.id}]`;
  }

  resetStationForm() {
    document.getElementById("adminStationId").value = "";
    document.getElementById("adminStationName").value = "";
    document.getElementById("adminStationOperator").value = "";
    document.getElementById("adminStationAddress").value = "";
    document.getElementById("adminStationCity").value = "";
    document.getElementById("adminStationState").value = "";
    document.getElementById("adminStationLat").value = "";
    document.getElementById("adminStationLng").value = "";
    document.getElementById("adminStationPrice").value = "";
    document.getElementById("adminStationCapacity").value = "30";
    document.getElementById("adminStationVerifiedOpen").checked = true;
    document.getElementById("adminStationHours").value = "24x7";
    document.getElementById("adminStationFormTitle").innerText = "Create New CNG Station Record";
  }

  async saveStationRecord() {
    const idVal = document.getElementById("adminStationId").value;
    const name = document.getElementById("adminStationName").value.trim();
    const operator = document.getElementById("adminStationOperator").value.trim();
    const address = document.getElementById("adminStationAddress").value.trim();
    const city = document.getElementById("adminStationCity").value.trim();
    const state = document.getElementById("adminStationState").value.trim();
    const lat = parseFloat(document.getElementById("adminStationLat").value);
    const lng = parseFloat(document.getElementById("adminStationLng").value);
    const price = parseFloat(document.getElementById("adminStationPrice").value);
    const capacity = parseInt(document.getElementById("adminStationCapacity").value, 10) || 30;
    const verifiedOpen = document.getElementById("adminStationVerifiedOpen").checked;
    const hours = document.getElementById("adminStationHours").value.trim() || "24x7";
    const msgDiv = document.getElementById("adminFeedbackMsg");

    if (!name || !address || !city || isNaN(lat) || isNaN(lng)) {
      alert("Please fill in all required fields (Name, Address, City, Latitude, Longitude).");
      return;
    }

    const payload = {
      name: name,
      operator: operator || "Independent Gas Distributor",
      address: address,
      city: city,
      state: state || "India",
      latitude: lat,
      longitude: lng,
      verifiedPricePerKg: isNaN(price) ? null : price,
      dispenserCapacityPerHour: capacity,
      activeDispensers: 4,
      verifiedOpen: verifiedOpen,
      operatingHours: hours,
      amenities: "Air, Restroom, Digital Payment"
    };

    if (idVal) {
      payload.id = parseInt(idVal, 10);
    }

    try {
      const resp = await fetch("/api/admin/stations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.adminKey
        },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        msgDiv.innerHTML = `<div style="background:#ecfdf5; color:#065f46; padding:8px; border-radius:6px; font-size:12px;">&check; Station record "${name}" saved successfully!</div>`;
        this.resetStationForm();
        if (window.cngApp) {
          await window.cngApp.fetchAllStations();
          this.populateStationDropdown();
          window.cngApp.refreshCurrentView();
        }
      } else {
        const err = await resp.json();
        msgDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:8px; border-radius:6px; font-size:12px;">Error: ${err.error || 'Failed to save station'}</div>`;
      }
    } catch (e) {
      msgDiv.innerHTML = `<div style="color:#ef4444;">Server error saving station.</div>`;
    }
  }

  async deleteStationRecord(id) {
    if (!confirm(`Are you sure you want to delete station ID ${id}?`)) return;
    const msgDiv = document.getElementById("adminFeedbackMsg");

    try {
      const resp = await fetch(`/api/admin/stations/${id}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Key": this.adminKey
        }
      });

      if (resp.ok) {
        msgDiv.innerHTML = `<div style="background:#ecfdf5; color:#065f46; padding:8px; border-radius:6px; font-size:12px;">&check; Station ${id} deleted successfully.</div>`;
        if (window.cngApp) {
          await window.cngApp.fetchAllStations();
          this.populateStationDropdown();
          window.cngApp.refreshCurrentView();
        }
      } else {
        msgDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:8px; border-radius:6px; font-size:12px;">Failed to delete station.</div>`;
      }
    } catch (e) {
      msgDiv.innerHTML = `<div style="color:#ef4444;">Server error deleting station.</div>`;
    }
  }

  async submitQueueTelemetry() {
    const stationId = document.getElementById("adminStationSelect").value;
    const count = parseInt(document.getElementById("adminQueueCount").value, 10);
    const source = document.getElementById("adminQueueSource").value;
    const msgDiv = document.getElementById("adminFeedbackMsg");

    if (!stationId) {
      alert("Please select a station first.");
      return;
    }

    try {
      const resp = await fetch("/api/admin/queue-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.adminKey
        },
        body: JSON.stringify({
          stationId: parseInt(stationId, 10),
          vehiclesWaiting: count,
          dataSource: source,
          reportedBy: "Authorized Admin Portal",
          isLiveSensor: true
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        msgDiv.innerHTML = `<div style="background:#ecfdf5; color:#065f46; padding:8px; border-radius:6px; font-size:12px;">&check; Queue updated: ${count} vehicles waiting (~${data.estimatedWaitMinutes} min wait). Source: ${source}.</div>`;
        if (window.cngApp) window.cngApp.refreshCurrentView();
      } else {
        msgDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:8px; border-radius:6px; font-size:12px;">Error: ${data.error}</div>`;
      }
    } catch (e) {
      msgDiv.innerHTML = `<div style="color:#ef4444;">Failed to submit queue telemetry.</div>`;
    }
  }

  async submitPressureTelemetry() {
    const stationId = document.getElementById("adminStationSelect").value;
    const pressure = parseFloat(document.getElementById("adminPressureBar").value);
    const status = document.getElementById("adminSensorStatus").value;
    const source = document.getElementById("adminPressureSource").value;
    const msgDiv = document.getElementById("adminFeedbackMsg");

    if (!stationId || isNaN(pressure)) {
      alert("Please select a station and enter a valid pressure in bar.");
      return;
    }

    try {
      const resp = await fetch("/api/admin/pressure-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": this.adminKey
        },
        body: JSON.stringify({
          stationId: parseInt(stationId, 10),
          pressureBar: pressure,
          sensorStatus: status,
          dataSource: source,
          isLiveSensor: true
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        msgDiv.innerHTML = `<div style="background:#ecfdf5; color:#065f46; padding:8px; border-radius:6px; font-size:12px;">&check; Pressure updated: ${pressure} bar (Status: ${status}). Source: ${source}.</div>`;
        if (window.cngApp) window.cngApp.refreshCurrentView();
      } else {
        msgDiv.innerHTML = `<div style="background:#fee2e2; color:#991b1b; padding:8px; border-radius:6px; font-size:12px;">Error: ${data.error}</div>`;
      }
    } catch (e) {
      msgDiv.innerHTML = `<div style="color:#ef4444;">Failed to submit pressure telemetry.</div>`;
    }
  }
}

window.adminPortal = new AdminPortal();
