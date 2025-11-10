// Single Prediction functionality with Backend API Integration
const API_BASE_URL = 'https://pylord-api-bfsi.hf.space';
let recentPredictions = [];

document.addEventListener('DOMContentLoaded', () => {
  initForm();
  loadRecentPredictions();
  setDefaultTimestamp();
});

function setDefaultTimestamp() {
  const timestampInput = document.getElementById('timestamp');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  timestampInput.value = now.toISOString().slice(0, 16);
}

function initForm() {
  const form = document.getElementById('prediction-form');
  const resetBtn = document.getElementById('reset-form');
  const newPredictionBtn = document.getElementById('new-prediction-btn');
  const saveResultBtn = document.getElementById('save-result-btn');

  form.addEventListener('submit', handleSubmit);
  resetBtn.addEventListener('click', resetFormHandler);
  
  if (newPredictionBtn) {
    newPredictionBtn.addEventListener('click', () => {
      resetFormHandler();
      hideResults();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (saveResultBtn) {
    saveResultBtn.addEventListener('click', saveResult);
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  
  const userEmail = getCurrentUserEmail();
  if (!userEmail) {
    showNotification('Please login first', 'error');
    window.location.href = '/auth.html';
    return;
  }
  
  const formData = new FormData(e.target);
  
  // Convert timestamp to required format (YYYY-MM-DD HH:MM:SS)
  const timestamp = new Date(formData.get('timestamp'));
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  const seconds = String(timestamp.getSeconds()).padStart(2, '0');
  const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
  // Map channel to encoded value
  const channelMap = {
    'Online': 0,
    'ATM': 1,
    'POS': 2,
    'Mobile': 3,
    'Wire Transfer': 0  // Map to Online as fallback
  };
  
  const channelValue = formData.get('channel');
  const channelEncoded = channelMap[channelValue] !== undefined ? channelMap[channelValue] : 0;
  
  // Generate unique transaction ID
  const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  
  const data = {
    email: userEmail,
    customer_id: formData.get('customerId'),
    transaction_id: transactionId,
    transaction_datetime: formattedTimestamp,
    transaction_amount: parseFloat(formData.get('amount')),
    kyc_verified: formData.get('kycVerified') === 'true' ? 1 : 0,
    account_age_days: parseInt(formData.get('accountAge')),
    channel_encoded: channelEncoded
  };

  // Validate data
  if (!validateFormData(data)) {
    showNotification('Please fill all required fields correctly', 'error');
    return;
  }

  console.log('Sending prediction request:', data);

  // Show loading state
  showLoading();

  try {
    // Call prediction API
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Prediction response:', result);

    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Prediction failed');
    }
    
    if (result.status === 'success') {
      // Display results
      displayResults(result.data, data);
      
      // Save to recent predictions
      saveToRecent(result.data, data);
      
      showNotification('Transaction analyzed successfully!', 'success');
    } else {
      throw new Error(result.message || 'Prediction failed');
    }
    
  } catch (error) {
    console.error('Prediction error:', error);
    showNotification(error.message || 'Failed to analyze transaction. Please try again.', 'error');
    hideLoading();
  }
}

function validateFormData(data) {
  if (!data.customer_id || data.customer_id.trim() === '') return false;
  if (data.kyc_verified === null || data.kyc_verified === undefined) return false;
  if (!data.account_age_days || data.account_age_days < 0) return false;
  if (!data.transaction_amount || data.transaction_amount <= 0) return false;
  if (data.channel_encoded === null || data.channel_encoded === undefined) return false;
  if (!data.transaction_datetime) return false;
  return true;
}

function showLoading() {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('results-container').style.display = 'none';
  document.getElementById('loading-state').style.display = 'block';
  window.scrollTo({ top: document.querySelector('.container').offsetHeight / 2, behavior: 'smooth' });
}

function hideLoading() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('empty-state').style.display = 'block';
}

function displayResults(result, inputData) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('results-container').style.display = 'block';

  const resultCard = document.getElementById('result-card');
  const resultIcon = document.getElementById('result-icon');
  const resultStatus = document.getElementById('result-status');
  const resultDescription = document.getElementById('result-description');
  const riskScore = document.getElementById('risk-score');
  const confidence = document.getElementById('confidence');

  // Set status and styling
  if (result.is_fraud === 1) {
    resultCard.style.borderLeft = '6px solid var(--destructive)';
    resultIcon.style.background = 'rgba(239, 68, 68, 0.1)';
    resultIcon.textContent = '🚫';
    resultStatus.textContent = 'FRAUD DETECTED';
    resultStatus.style.color = 'var(--destructive)';
    resultDescription.textContent = 'High probability of fraudulent activity';
  } else if (result.combined_score > 0.4) {
    resultCard.style.borderLeft = '6px solid var(--accent)';
    resultIcon.style.background = 'rgba(245, 158, 11, 0.1)';
    resultIcon.textContent = '⚠️';
    resultStatus.textContent = 'RISKY TRANSACTION';
    resultStatus.style.color = 'var(--accent)';
    resultDescription.textContent = 'Moderate risk level - manual review recommended';
  } else {
    resultCard.style.borderLeft = '6px solid #22c55e';
    resultIcon.style.background = 'rgba(34, 197, 94, 0.1)';
    resultIcon.textContent = '✅';
    resultStatus.textContent = 'LEGITIMATE';
    resultStatus.style.color = '#22c55e';
    resultDescription.textContent = 'Low risk transaction - safe to proceed';
  }

  riskScore.textContent = (result.combined_score * 100).toFixed(1) + '%';
  confidence.textContent = (result.model_risk_score * 100).toFixed(1) + '%';

  // Display risk factors
  displayRiskFactors(result);

  // Display recommendation
  displayRecommendation(result);

  // Store result for saving
  window.currentPredictionResult = result;

  // Scroll to results
  setTimeout(() => {
    document.getElementById('results-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

function displayRiskFactors(result) {
  const container = document.getElementById('risk-factors-list');
  container.innerHTML = '';

  const factors = [];

  // Add rules triggered as risk factors
  if (result.rules_triggered && result.rules_triggered.length > 0) {
    result.rules_triggered.forEach(rule => {
      factors.push({
        label: rule,
        severity: 'high',
        description: 'Rule-based detection',
        icon: '⚠️'
      });
    });
  }

  // Add feature-based factors
  const features = result.derived_features;
  
  if (features.account_age_days < 30) {
    factors.push({
      label: features.account_age_days < 7 ? 'Very New Account' : 'New Account',
      severity: features.account_age_days < 7 ? 'high' : 'medium',
      description: `Account age: ${features.account_age_days} days`,
      icon: '⚡'
    });
  }

  if (features.kyc_verified === 0) {
    factors.push({
      label: 'KYC Not Verified',
      severity: 'high',
      description: 'Customer identity not verified',
      icon: '🔒'
    });
  }

  if (features.is_high_amount_transaction === 1) {
    factors.push({
      label: 'High Amount Transaction',
      severity: 'medium',
      description: `Amount: ₹${features.transaction_amount.toLocaleString()}`,
      icon: '💰'
    });
  }

  if (features.is_night_txn === 1) {
    factors.push({
      label: 'Night Time Transaction',
      severity: 'medium',
      description: 'Transaction during unusual hours',
      icon: '🌙'
    });
  }

  if (features.is_weekend_txn === 1) {
    factors.push({
      label: 'Weekend Transaction',
      severity: 'low',
      description: 'Transaction on weekend',
      icon: '📅'
    });
  }

  if (factors.length === 0) {
    factors.push({
      label: 'Low Risk Profile',
      severity: 'low',
      description: 'No significant risk factors detected',
      icon: '✅'
    });
  }

  const severityColors = {
    high: 'var(--destructive)',
    medium: 'var(--accent)',
    low: '#22c55e'
  };

  factors.forEach(factor => {
    const factorElement = document.createElement('div');
    factorElement.style.cssText = `
      display: flex;
      align-items: start;
      gap: 1rem;
      padding: 1rem;
      border-left: 3px solid ${severityColors[factor.severity]};
      background: var(--muted);
      border-radius: var(--radius);
      margin-bottom: 0.75rem;
    `;
    
    factorElement.innerHTML = `
      <div style="font-size: 1.5rem;">${factor.icon}</div>
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <p style="font-weight: 600; font-size: 0.875rem;">${factor.label}</p>
          <span class="badge" style="background-color: ${severityColors[factor.severity]}20; color: ${severityColors[factor.severity]}; font-size: 0.65rem; text-transform: uppercase;">
            ${factor.severity}
          </span>
        </div>
        <p style="font-size: 0.75rem; color: var(--muted-foreground);">${factor.description}</p>
      </div>
    `;
    
    container.appendChild(factorElement);
  });
}

function displayRecommendation(result) {
  const alert = document.getElementById('recommendation-alert');
  const text = document.getElementById('recommendation-text');

  let recommendation;
  
  if (result.is_fraud === 1 || result.combined_score > 0.8) {
    recommendation = {
      action: 'Block Transaction',
      type: 'error',
      message: result.explanation || 'High fraud probability detected. Recommend blocking this transaction and conducting manual review.'
    };
  } else if (result.combined_score > 0.4) {
    recommendation = {
      action: 'Manual Review Required',
      type: 'warning',
      message: result.explanation || 'Moderate risk detected. Recommend manual review before processing.'
    };
  } else {
    recommendation = {
      action: 'Approve Transaction',
      type: 'success',
      message: result.explanation || 'Low risk transaction. Safe to proceed with standard monitoring.'
    };
  }

  alert.className = `alert alert-${recommendation.type}`;
  text.innerHTML = `<strong>${recommendation.action}:</strong> ${recommendation.message}`;
}

function hideResults() {
  document.getElementById('results-container').style.display = 'none';
  document.getElementById('empty-state').style.display = 'block';
}

function resetFormHandler() {
  document.getElementById('prediction-form').reset();
  setDefaultTimestamp();
  hideResults();
  showNotification('Form reset successfully', 'success');
}

function saveToRecent(result, inputData) {
  const prediction = {
    id: inputData.transaction_id,
    timestamp: new Date().toISOString(),
    customerId: inputData.customer_id,
    amount: inputData.transaction_amount,
    channel: getChannelName(inputData.channel_encoded),
    isFraud: result.is_fraud === 1,
    riskScore: result.combined_score,
    status: result.is_fraud === 1 ? 'Fraud' : (result.combined_score > 0.4 ? 'Risky' : 'Legitimate')
  };

  recentPredictions.unshift(prediction);
  if (recentPredictions.length > 5) {
    recentPredictions = recentPredictions.slice(0, 5);
  }

  saveToStorage('recentPredictions', recentPredictions);
  displayRecentPredictions();
}

function getChannelName(channelCode) {
  const channels = {
    0: 'Online',
    1: 'ATM',
    2: 'POS',
    3: 'Mobile'
  };
  return channels[channelCode] || 'Unknown';
}

function loadRecentPredictions() {
  const saved = getFromStorage('recentPredictions');
  if (saved) {
    recentPredictions = saved;
    displayRecentPredictions();
  }
}

function displayRecentPredictions() {
  const container = document.getElementById('recent-predictions');
  
  if (recentPredictions.length === 0) {
    container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">No recent predictions yet</p>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x: auto;">
      <table style="width: 100%; font-size: 0.875rem; border-collapse: collapse;">
        <thead style="background: var(--muted);">
          <tr>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Transaction ID</th>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Customer</th>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Amount</th>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Channel</th>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Risk Score</th>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Status</th>
            <th style="padding: 0.75rem; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border);">Date</th>
          </tr>
        </thead>
        <tbody>
          ${recentPredictions.map(pred => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 0.75rem; font-family: monospace; color: var(--primary); white-space: nowrap;">${pred.id}</td>
              <td style="padding: 0.75rem; white-space: nowrap;">${pred.customerId}</td>
              <td style="padding: 0.75rem; font-weight: 600; white-space: nowrap;">₹${pred.amount.toLocaleString()}</td>
              <td style="padding: 0.75rem; white-space: nowrap;">${pred.channel}</td>
              <td style="padding: 0.75rem; white-space: nowrap;">
                <span style="font-weight: 600; color: ${pred.riskScore > 0.7 ? 'var(--destructive)' : pred.riskScore > 0.4 ? 'var(--accent)' : '#22c55e'}">
                  ${(pred.riskScore * 100).toFixed(1)}%
                </span>
              </td>
              <td style="padding: 0.75rem; white-space: nowrap;">
                <span class="badge" style="background-color: ${getStatusBg(pred.status)}; color: ${getStatusColor(pred.status)};">
                  ${pred.status}
                </span>
              </td>
              <td style="padding: 0.75rem; color: var(--muted-foreground); font-size: 0.75rem; white-space: nowrap;">
                ${new Date(pred.timestamp).toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function saveResult() {
  if (!window.currentPredictionResult) {
    showNotification('No prediction result to save', 'warning');
    return;
  }

  const result = window.currentPredictionResult;
  
  // Create downloadable report
  const report = {
    predictionId: result.prediction_id || 'PRED-' + Date.now(),
    timestamp: result.timestamp || new Date().toISOString(),
    status: result.is_fraud === 1 ? 'FRAUD' : 'LEGITIMATE',
    riskScore: (result.combined_score * 100).toFixed(2) + '%',
    modelScore: (result.model_risk_score * 100).toFixed(2) + '%',
    ruleScore: (result.rule_score * 100).toFixed(2) + '%',
    rulesTriggered: result.rules_triggered,
    explanation: result.explanation,
    generatedBy: getCurrentUserEmail() || 'System'
  };
  
  // Save as JSON
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fraud-prediction-${report.predictionId}.json`;
  link.click();
  window.URL.revokeObjectURL(url);
  
  showNotification('Prediction result saved successfully!', 'success');
}