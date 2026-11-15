// CNG Navigator Gemini AI Copilot Integration
class GeminiAssistant {
  constructor() {
    this.chatOpen = false;
    this.isGenerating = false;
  }

  toggleChat() {
    const drawer = document.getElementById("geminiChatDrawer");
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      drawer.classList.add("open");
      document.getElementById("chatUserInput").focus();
    } else {
      drawer.classList.remove("open");
    }
  }

  async fetchTripAdvisory(routeData, originText, destText) {
    const advisoryBox = document.getElementById("geminiAdvisoryContent");
    const advisoryWrapper = document.getElementById("geminiAdvisorySection");

    advisoryWrapper.style.display = "block";
    advisoryBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; color:#4f46e5; font-size:13px;">
        <div class="spinner" style="width:16px; height:16px; border-width:2px; margin:0;"></div>
        Analyzing route corridor, live dispenser pressure, and queue congestion with Gemini 3.8 Flash...
      </div>
    `;

    try {
      const response = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: originText,
          destination: destText,
          vehicleTankCapacityKg: 10.0,
          currentFuelPercentage: 25.0,
          estimatedVehicleMileageKmPerKg: 24.0,
          candidateStations: routeData.stations
        })
      });

      if (!response.ok) throw new Error("Advisory request failed");
      const data = await response.json();
      this.renderAdvisory(data);
    } catch (e) {
      console.error(e);
      advisoryBox.innerHTML = `
        <div style="color:#ef4444; font-size:12px;">
          Unable to generate Gemini Advisory at this moment. You can continue using smart algorithmic recommendations.
        </div>
      `;
    }
  }

  renderAdvisory(data) {
    const box = document.getElementById("geminiAdvisoryContent");
    const modeBadge = data.isSimulated 
      ? `<span class="badge badge-demo" title="Simulated Gemini Copilot">Demo Simulation</span>`
      : `<span class="badge badge-gemini" title="Connected to Google Gemini API">Gemini 3.8 Flash (Live)</span>`;

    box.innerHTML = `
      <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:11px; font-weight:700; color:#4f46e5; text-transform:uppercase;">AI Route Fuel Strategy</span>
        ${modeBadge}
      </div>
      
      <p style="font-size:12.5px; line-height:1.45; color:#1e293b; margin-bottom:8px; font-weight:500;">
        ${data.tripBriefing}
      </p>

      <div style="background:#f5f3ff; border:1px solid #ddd6fe; border-radius:8px; padding:8px 10px; margin-bottom:8px; font-size:12px; color:#4338ca;">
        <b>Recommended Fuel Stop:</b> ${data.recommendedStationName}
        <div style="font-size:11.5px; color:#475569; margin-top:3px; line-height:1.35;">
          ${data.recommendedStrategy}
        </div>
      </div>

      <div style="font-size:11.5px; color:#64748b; line-height:1.35; margin-bottom:6px;">
        <span style="color:#f59e0b; font-weight:600;">Queue Risk:</span> ${data.queueRiskAssessment}
      </div>

      <div style="font-size:11.5px; color:#64748b; line-height:1.35; margin-bottom:8px;">
        <span style="color:#10b981; font-weight:600;">Pressure Audit:</span> ${data.pressureQualityWarning}
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:4px;">
        ${data.actionableTips.map(tip => `
          <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:6px; padding:3px 7px; font-size:11px; color:#475569;">
            &bull; ${tip}
          </div>
        `).join('')}
      </div>
    `;
  }

  async sendChatMessage(customMsg = null) {
    const input = document.getElementById("chatUserInput");
    const msg = customMsg || input.value.trim();
    if (!msg || this.isGenerating) return;

    this.appendMessage(msg, "user");
    if (!customMsg) input.value = "";
    this.isGenerating = true;

    const botMsgId = "bot-typing-" + Date.now();
    this.appendTypingIndicator(botMsgId);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          routeSummary: window.cngApp ? window.cngApp.getRouteSummaryText() : "Trip from origin to destination",
          currentFuelPercentage: 25.0
        })
      });

      const data = await response.json();
      this.removeTypingIndicator(botMsgId);
      this.appendMessage(data.reply, "bot");
      this.renderFollowUps(data.quickFollowUps);
    } catch (e) {
      this.removeTypingIndicator(botMsgId);
      this.appendMessage("Sorry, I could not process your query at this moment.", "bot");
    } finally {
      this.isGenerating = false;
    }
  }

  appendMessage(text, sender) {
    const container = document.getElementById("chatMessages");
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerText = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  appendTypingIndicator(id) {
    const container = document.getElementById("chatMessages");
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble bot";
    bubble.id = id;
    bubble.innerHTML = `<span style="color:#64748b; font-style:italic;">Gemini is analyzing...</span>`;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  renderFollowUps(suggestions) {
    const container = document.getElementById("chatSuggestions");
    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = suggestions.map(s => `
      <span class="suggestion-pill" onclick="window.geminiAssistant.sendChatMessage('${s.replace(/'/g, "\\'")}')">${s}</span>
    `).join("");
  }
}

window.geminiAssistant = new GeminiAssistant();
