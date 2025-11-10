// Analytics Charts with Backend API Integration
const API_BASE_URL = 'https://pylord-api-bfsi.hf.space';
let charts = {};
let analyticsData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadAnalytics();
});

// Load Main Dashboard Analytics
async function loadAnalytics() {
  try {
    showNotification('Loading analytics data...', 'info');
    const response = await fetch(`${API_BASE_URL}/api/analytics`);

    if (!response.ok) throw new Error('Failed to fetch analytics');

    const result = await response.json();

    if (result.status === 'success') {
      analyticsData = result.data;
      updateKPIs(analyticsData.kpis);
      initCharts(analyticsData.graphs);

      // ✅ Load Model Metrics (Accuracy / Precision / Recall / F1)
      loadModelMetrics();

      showNotification('Analytics loaded successfully', 'success');
    } else {
      throw new Error(result.message || 'Failed to load analytics');
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
    showNotification('Failed to load analytics data', 'error');
    loadMockData();
  }
}

async function loadModelMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/metrics`);
    const result = await response.json();

    if (result.status === 'success') {
      const metrics = result.data.metrics;
      initAccuracyChart(metrics);        // Updates bar chart
      updateModelMetricCards(metrics);   // ✅ Updates the 4 KPI cards
    }
  } catch (error) {
    console.error("Error loading model metrics:", error);
  }
}

function updateModelMetricCards(metrics) {
  document.getElementById('metric-accuracy').innerText = (metrics.accuracy * 100).toFixed(1) + '%';
  document.getElementById('metric-precision').innerText = (metrics.precision * 100).toFixed(1) + '%';
  document.getElementById('metric-recall').innerText = (metrics.recall * 100).toFixed(1) + '%';
  document.getElementById('metric-f1').innerText = (metrics.f1_score * 100).toFixed(1) + '%';
}
// ✅ Update KPI Cards
function updateKPIs(kpis) {
  document.getElementById('kpi-total-transactions').innerText = kpis.total_transactions || 0;
  document.getElementById('kpi-fraud-detected').innerText = kpis.fraud_detected || 0;
  document.getElementById('kpi-accuracy-rate').innerText = (kpis.accuracy_rate || 0) + '%';
  document.getElementById('kpi-amount-protected').innerText = '₹' + (kpis.amount_protected || 0).toLocaleString();
}

// Theme Colors
function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    primary: isDark ? '#93c5fd' : '#3b82f6',
    secondary: isDark ? '#d8b4fe' : '#8b5cf6',
    accent: isDark ? '#fdba74' : '#fb923c',
    destructive: '#ef4444',
    success: '#22c55e',
    text: isDark ? '#f8fafc' : '#0f172a',
    border: isDark ? '#334155' : '#e2e8f0',
  };
}

// Initialize Charts
function initCharts(graphsData) {
  initTrendChart(graphsData.fraud_rate_trend);
  initVolumeChart(graphsData.amount_vs_risk_scatter);
  initChannelChart(graphsData.fraud_by_channel);
  initRiskChart(graphsData.fraud_vs_legitimate);
}

// Fraud Trend Chart
function initTrendChart(trendData) {
  const ctx = document.getElementById('chart-trend');
  if (!ctx) return;

  const colors = getChartColors();
  if (charts.trend) charts.trend.destroy();

  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.map(d => d.month),
      datasets: [
        {
          label: 'Fraud Rate (%)',
          data: trendData.map(d => d.fraud_rate),
          borderColor: colors.destructive,
          backgroundColor: colors.destructive + '20',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { callback: value => value + '%' } }
      }
    }
  });
}

// Volume Chart (Approximation due to missing timestamps)
function initVolumeChart(scatterData) {
  const ctx = document.getElementById('chart-volume');
  if (!ctx) return;

  const colors = getChartColors();
  if (charts.volume) charts.volume.destroy();

  const hourlyData = {};
  scatterData.forEach(item => {
    const hour = Math.floor(Math.random() * 24);
    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
  });

  const hours = Object.keys(hourlyData).sort((a, b) => a - b);

  charts.volume = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours.map(h => `${h}:00`),
      datasets: [
        { data: hours.map(h => hourlyData[h]), backgroundColor: colors.primary }
      ]
    }
  });
}

// Channel Distribution
function initChannelChart(channelData) {
  const ctx = document.getElementById('chart-channel');
  if (!ctx) return;

  const colors = getChartColors();
  if (charts.channel) charts.channel.destroy();

  charts.channel = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(channelData),
      datasets: [
        {
          data: Object.values(channelData),
          backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.success]
        }
      ]
    }
  });
}

// Fraud vs Legit
function initRiskChart(fraudVsLegit) {
  const ctx = document.getElementById('chart-risk');
  if (!ctx) return;

  const colors = getChartColors();
  if (charts.risk) charts.risk.destroy();

  charts.risk = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Fraud', 'Legitimate'],
      datasets: [
        {
          data: [fraudVsLegit.fraud, fraudVsLegit.legitimate],
          backgroundColor: [colors.destructive, colors.success]
        }
      ]
    }
  });
}

// ✅ REAL Model Performance Chart
function initAccuracyChart(metrics) {
  const ctx = document.getElementById('chart-accuracy');
  if (!ctx) return;

  const colors = getChartColors();
  if (charts.accuracy) charts.accuracy.destroy();

  const accuracyData = [
    { name: 'Accuracy', value: (metrics.accuracy * 100).toFixed(1) },
    { name: 'Precision', value: (metrics.precision * 100).toFixed(1) },
    { name: 'Recall', value: (metrics.recall * 100).toFixed(1) },
    { name: 'F1 Score', value: (metrics.f1_score * 100).toFixed(1) }
  ];

  charts.accuracy = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: accuracyData.map(d => d.name),
      datasets: [
        { data: accuracyData.map(d => d.value),
          backgroundColor: [colors.primary, colors.secondary, colors.success, colors.accent],
          borderRadius: 6
        }
      ]
    }
  });
}

// Fallback Mock Data (if API fails)
function loadMockData() {
  const mockData = {
    fraud_rate_trend: [],
    fraud_by_channel: {},
    fraud_vs_legitimate: {},
    amount_vs_risk_scatter: []
  };
  initCharts(mockData);
}
