// CNG Navigator Telemetry & Pressure History Charts (Chart.js)
let pressureChartInstance = null;
let queueChartInstance = null;

function renderPressureChart(canvasId, readings, minLimit = 180.0, maxLimit = 220.0) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  if (pressureChartInstance) {
    pressureChartInstance.destroy();
  }

  const labels = readings.map(r => {
    const d = new Date(r.createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const dataValues = readings.map(r => r.pressureBar);

  pressureChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "CNG Pressure (bar)",
          data: dataValues,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: "#059669",
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: `Min Operating Limit (${minLimit} bar)`,
          data: Array(readings.length).fill(minLimit),
          borderColor: "#ef4444",
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        },
        {
          label: `Max Operating Limit (${maxLimit} bar)`,
          data: Array(readings.length).fill(maxLimit),
          borderColor: "#3b82f6",
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { size: 11, family: "-apple-system, sans-serif" }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} bar`;
            }
          }
        }
      },
      scales: {
        y: {
          min: Math.min(150, Math.floor(Math.min(...dataValues) / 10) * 10),
          max: 240,
          title: {
            display: true,
            text: "Pressure (bar)",
            font: { size: 12, weight: "bold" }
          },
          grid: { color: "#f1f5f9" }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } }
        }
      }
    }
  });
}
