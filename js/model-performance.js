// Model Performance page functionality

let featureChart = null;
let METRICS_DATA = null;

// Load metrics from API
async function loadMetrics() {
  try {
    const res = await fetch('https://pylord-api-bfsi.hf.space/api/metrics');
    const json = await res.json();
    METRICS_DATA = json.data;

    updateMetricCards();
    updateConfusionMatrixUI(METRICS_DATA.metrics.confusion_matrix);
    updateFeatureChartUI(METRICS_DATA.feature_importance);

  } catch (err) {
    console.error("Failed to fetch metrics:", err);
  }
}

// Update Top Metric Cards
function updateMetricCards() {
  const m = METRICS_DATA.metrics;

  document.querySelector('#accuracy-card p:nth-child(2)').textContent = (m.accuracy * 100).toFixed(1) + '%';
  document.querySelectorAll('.card')[1].children[1].textContent = (m.precision * 100).toFixed(1) + '%';
  document.querySelectorAll('.card')[2].children[1].textContent = (m.recall * 100).toFixed(1) + '%';
  document.querySelectorAll('.card')[3].children[1].textContent = (m.f1_score * 100).toFixed(1) + '%';
  document.querySelectorAll('.card')[4].children[1].textContent = m.auc_roc.toFixed(4);

  // Specificity special calc
  const spec = (m.confusion_matrix.true_negative /
               (m.confusion_matrix.true_negative + m.confusion_matrix.false_positive)) * 100;
  document.querySelectorAll('.card')[5].children[1].textContent = spec.toFixed(1) + '%';
}

// Update Confusion Matrix
function updateConfusionMatrixUI(matrix) {
  const total = matrix.true_positive + matrix.true_negative + matrix.false_positive + matrix.false_negative;

  document.getElementById('tp-value').textContent = matrix.true_positive;
  document.getElementById('fp-value').textContent = matrix.false_positive;
  document.getElementById('fn-value').textContent = matrix.false_negative;
  document.getElementById('tn-value').textContent = matrix.true_negative;

  document.getElementById('matrix-accuracy').textContent =
    (((matrix.true_positive + matrix.true_negative) / total) * 100).toFixed(1) + '%';

  document.getElementById('sensitivity').textContent =
    (matrix.true_positive / (matrix.true_positive + matrix.false_negative) * 100).toFixed(1) + '%';

  document.getElementById('specificity').textContent =
    (matrix.true_negative / (matrix.true_negative + matrix.false_positive) * 100).toFixed(1) + '%';

  document.getElementById('fpr').textContent =
    (matrix.false_positive / (matrix.false_positive + matrix.true_negative) * 100).toFixed(1) + '%';
}

// Feature Chart Colors
function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    primary: isDark ? '#93c5fd' : '#3b82f6',
    text: isDark ? '#f8fafc' : '#0f172a'
  };
}

// Render Feature Importance Chart
function updateFeatureChartUI(features) {
  const ctx = document.getElementById('feature-chart');
  if (!ctx) return;

  // Sort by highest importance
  features.sort((a, b) => b.importance - a.importance);

  const labels = features.map(f => f.feature);
  const values = features.map(f => f.importance);
  const colors = getChartColors();

  if (featureChart) featureChart.destroy();

  featureChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Importance',
        data: values,
        backgroundColor: colors.primary,
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { color: colors.text }},
        y: { ticks: { color: colors.text }}
      }
    }
  });

  // Update “Most Important Feature” box
  document.getElementById("top-feature-name").textContent = labels[0];
  document.getElementById("top-feature-value").textContent =
    "Importance: " + (values[0] * 100).toFixed(1) + "%";
}

// Tabs System (fix feature tab chart visibility)
function initTabs() {
  const triggers = document.querySelectorAll('.tabs-trigger');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tabName = trigger.dataset.tab;

      triggers.forEach(t => t.classList.remove('active'));
      trigger.classList.add('active');

      document.querySelectorAll('.tabs-content').forEach(c => c.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');

      // ✅ Re-render feature chart only when the tab is clicked
      if (tabName === 'features' && METRICS_DATA) {
        updateFeatureChartUI(METRICS_DATA.feature_importance);
      }
    });
  });
}

// On Page Load
document.addEventListener('DOMContentLoaded', async () => {
  await loadMetrics();
  initTabs();
});
