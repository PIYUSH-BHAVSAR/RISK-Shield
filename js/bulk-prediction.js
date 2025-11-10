// Bulk Prediction functionality with Backend API Integration
const API_BASE_URL = 'https://pylord-api-bfsi.hf.space';
let bulkResults = [];
let filteredResults = [];

document.addEventListener('DOMContentLoaded', () => {
  initUploadArea();
  initFilters();
  initExport();
  initDownloadSample();
});

function initUploadArea() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('csv-file-input');
  const uploadContent = document.getElementById('upload-content');

  // Click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.background = 'rgba(59, 130, 246, 0.1)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'var(--muted)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border)';
    uploadArea.style.background = 'var(--muted)';
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      showNotification('Please upload a valid CSV file', 'error');
    }
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  });

  // New upload button
  document.getElementById('new-upload-btn')?.addEventListener('click', () => {
    resetUpload();
  });
}

async function handleFileUpload(file) {
  const userEmail = getCurrentUserEmail();
  
  if (!userEmail) {
    showNotification('Please login first', 'error');
    window.location.href = '/auth.html';
    return;
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    showNotification('File size exceeds 10MB limit', 'error');
    return;
  }

  // Update upload UI
  const uploadContent = document.getElementById('upload-content');
  uploadContent.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 auto 1rem; color: #22c55e;">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
    </svg>
    <p style="font-weight: 600; color: #22c55e;">${file.name}</p>
    <p style="font-size: 0.875rem; color: var(--muted-foreground);">${(file.size / 1024).toFixed(2)} KB</p>
  `;

  // Read and process CSV
  try {
    const csvText = await file.text();
    const transactions = parseCSV(csvText);
    
    if (transactions.length === 0) {
      showNotification('No valid transactions found in CSV', 'error');
      return;
    }

    // Check maximum limit (1000 transactions)
    if (transactions.length > 1000) {
      showNotification('Maximum 1000 transactions allowed per request', 'error');
      return;
    }

    showNotification(`Found ${transactions.length} transactions. Processing...`, 'info');
    await processBulkPredictions(transactions, userEmail);
    
  } catch (error) {
    console.error('Error processing CSV:', error);
    showNotification(error.message || 'Failed to process CSV file', 'error');
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const transactions = [];

  // Required columns
  const requiredColumns = ['customer_id', 'transaction_amount', 'kyc_verified', 'account_age_days', 'channel_encoded', 'transaction_datetime'];
  
  // Check if all required columns exist
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      console.warn(`Skipping invalid row ${i}: column count mismatch`);
      continue;
    }

    const transaction = {};
    headers.forEach((header, index) => {
      transaction[header] = values[index];
    });

    // Validate and format transaction
    try {
      const formattedTransaction = {
        customer_id: transaction.customer_id,
        transaction_id: transaction.transaction_id || 'TXN' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
        transaction_datetime: transaction.transaction_datetime,
        transaction_amount: parseFloat(transaction.transaction_amount),
        kyc_verified: parseInt(transaction.kyc_verified),
        account_age_days: parseInt(transaction.account_age_days),
        channel_encoded: parseInt(transaction.channel_encoded)
      };

      // Validate values
      if (isNaN(formattedTransaction.transaction_amount) || 
          isNaN(formattedTransaction.kyc_verified) || 
          isNaN(formattedTransaction.account_age_days) || 
          isNaN(formattedTransaction.channel_encoded)) {
        throw new Error('Invalid numeric values');
      }

      if (formattedTransaction.kyc_verified !== 0 && formattedTransaction.kyc_verified !== 1) {
        throw new Error('kyc_verified must be 0 or 1');
      }

      if (formattedTransaction.channel_encoded < 0 || formattedTransaction.channel_encoded > 3) {
        throw new Error('channel_encoded must be between 0 and 3');
      }

      transactions.push(formattedTransaction);
    } catch (err) {
      console.warn(`Skipping invalid row ${i}:`, err.message);
    }
  }

  if (transactions.length === 0) {
    throw new Error('No valid transactions found after parsing');
  }

  return transactions;
}

async function processBulkPredictions(transactions, userEmail) {
  // Show processing UI
  document.getElementById('processing-status').style.display = 'block';
  document.getElementById('total-count').textContent = transactions.length;
  document.getElementById('processed-count').textContent = '0';
  document.getElementById('progress-bar').style.width = '0%';

  try {
    // Call bulk predict API
    const response = await fetch(`${API_BASE_URL}/api/bulk-predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userEmail,
        transactions: transactions
      })
    });

    const result = await response.json();
    console.log('Bulk prediction response:', result);

    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Bulk prediction failed');
    }
    
    if (result.status === 'success') {
      // Animate progress to 100%
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        document.getElementById('processed-count').textContent = Math.floor((progress / 100) * transactions.length);
        document.getElementById('progress-bar').style.width = progress + '%';
        
        if (progress >= 100) {
          clearInterval(interval);
          // Process results after animation
          setTimeout(() => {
            processResults(result.data);
          }, 300);
        }
      }, 50);
    } else {
      throw new Error(result.message || 'Bulk prediction failed');
    }
    
  } catch (error) {
    console.error('Bulk prediction error:', error);
    showNotification(error.message || 'Failed to process bulk predictions. Please try again.', 'error');
    document.getElementById('processing-status').style.display = 'none';
  }
}

function processResults(data) {
  // Hide processing
  document.getElementById('processing-status').style.display = 'none';
  
  // Transform results to match display format
  bulkResults = data.results.map(result => {
    let status;
    if (result.status === 'error') {
      status = 'Error';
    } else if (result.is_fraud === 1) {
      status = 'Fraud';
    } else if (result.risk_score > 0.4) {
      status = 'Risky';
    } else {
      status = 'Legitimate';
    }

    return {
      transaction_id: result.transaction_id,
      customer_id: result.customer_id,
      transaction_amount: result.transaction_amount || 0,
      channel_encoded: result.channel_encoded || 0,
      kyc_verified: result.kyc_verified || 0,
      account_age_days: result.account_age_days || 0,
      transaction_datetime: result.transaction_datetime || '',
      risk_score: result.risk_score || 0,
      combined_score: result.risk_score || 0,
      is_fraud: result.is_fraud,
      model_risk_score: result.model_risk_score || 0,
      rule_score: result.rule_score || 0,
      rules_triggered: result.rules_triggered || [],
      status: status,
      error_message: result.error_message,
      explanation: result.rules_triggered && result.rules_triggered.length > 0 
        ? result.rules_triggered.join(', ') 
        : (result.is_fraud === 1 ? 'High fraud probability detected' : 'Low risk transaction')
    };
  });

  // Display results
  displayResults(data);
  
  // Show success notification
  showNotification(
    `Bulk prediction completed: ${data.successful} successful, ${data.failed} failed. ${data.fraud_detected} fraud detected (${data.fraud_rate.toFixed(1)}% fraud rate)`,
    'success'
  );
}

function displayResults(data) {
  document.getElementById('results-section').style.display = 'block';
  
  // Update summary
  const legitimate = bulkResults.filter(r => r.status === 'Legitimate').length;
  const risky = bulkResults.filter(r => r.status === 'Risky').length;
  const fraud = bulkResults.filter(r => r.status === 'Fraud').length;
  
  document.getElementById('summary-total').textContent = data.total_processed || bulkResults.length;
  document.getElementById('summary-legitimate').textContent = legitimate;
  document.getElementById('summary-risky').textContent = risky;
  document.getElementById('summary-fraud').textContent = fraud;
  
  // Display table
  filteredResults = [...bulkResults];
  renderResultsTable();
  
  // Scroll to results
  setTimeout(() => {
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function renderResultsTable() {
  const tbody = document.querySelector('#results-table tbody');
  tbody.innerHTML = '';
  
  if (filteredResults.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No results match your filters</td></tr>';
    return;
  }
  
  filteredResults.forEach(result => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 0.875rem; color: var(--primary);">${result.transaction_id}</td>
      <td>${result.customer_id}</td>
      <td style="font-weight: 600;">${formatCurrency(result.transaction_amount)}</td>
      <td>${getChannelName(result.channel_encoded)}</td>
      <td>
        <span style="font-weight: 600; color: ${getRiskColor(result.risk_score)}">
          ${(result.risk_score * 100).toFixed(1)}%
        </span>
      </td>
      <td>
        <span class="badge" style="background-color: ${getStatusBg(result.status)}; color: ${getStatusColor(result.status)};">
          ${result.status}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="showTransactionDetail('${result.transaction_id}')">
          View Details
        </button>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

function getRiskColor(score) {
  if (score > 0.7) return 'var(--destructive)';
  if (score > 0.4) return 'var(--accent)';
  return '#22c55e';
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

window.showTransactionDetail = function(transactionId) {
  const transaction = bulkResults.find(t => t.transaction_id === transactionId);
  if (!transaction) return;
  
  const modalContent = document.getElementById('modal-content');
  
  // Build rules triggered list
  let rulesHTML = '';
  if (transaction.rules_triggered && transaction.rules_triggered.length > 0) {
    rulesHTML = `
      <div>
        <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.5rem;">Rules Triggered</p>
        <div style="background: var(--muted); padding: 1rem; border-radius: var(--radius);">
          ${transaction.rules_triggered.map(rule => `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--destructive);">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span style="font-size: 0.875rem;">${rule}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Build error message
  let errorHTML = '';
  if (transaction.error_message) {
    errorHTML = `
      <div class="alert alert-error">
        <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${transaction.error_message}</span>
      </div>
    `;
  }
  
  modalContent.innerHTML = `
    ${errorHTML}
    <div style="display: grid; gap: 1rem;">
      <div>
        <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Transaction ID</p>
        <p style="font-weight: 600;">${transaction.transaction_id}</p>
      </div>
      <div>
        <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Customer ID</p>
        <p style="font-weight: 600;">${transaction.customer_id}</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Amount</p>
          <p style="font-weight: 600; font-size: 1.25rem;">${formatCurrency(transaction.transaction_amount)}</p>
        </div>
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Risk Score</p>
          <p style="font-weight: 600; font-size: 1.25rem; color: ${getRiskColor(transaction.risk_score)};">
            ${(transaction.risk_score * 100).toFixed(1)}%
          </p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Model Score</p>
          <p style="font-weight: 600;">${(transaction.model_risk_score * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Rule Score</p>
          <p style="font-weight: 600;">${(transaction.rule_score * 100).toFixed(1)}%</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Channel</p>
          <p style="font-weight: 600;">${getChannelName(transaction.channel_encoded)}</p>
        </div>
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">KYC Verified</p>
          <p style="font-weight: 600;">${transaction.kyc_verified === 1 ? 'Yes' : 'No'}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Account Age</p>
          <p style="font-weight: 600;">${transaction.account_age_days} days</p>
        </div>
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Timestamp</p>
          <p style="font-weight: 600; font-size: 0.875rem;">${transaction.transaction_datetime}</p>
        </div>
      </div>
      <div>
        <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Status</p>
        <span class="badge" style="background-color: ${getStatusBg(transaction.status)}; color: ${getStatusColor(transaction.status)}; padding: 0.5rem 1rem; font-size: 0.875rem;">
          ${transaction.status}
        </span>
      </div>
      ${rulesHTML}
      ${transaction.explanation && !rulesHTML ? `
        <div>
          <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.5rem;">Explanation</p>
          <div style="background: var(--muted); padding: 1rem; border-radius: var(--radius); font-size: 0.875rem; line-height: 1.6;">
            ${transaction.explanation}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  document.getElementById('detail-modal').classList.add('active');
};

window.closeDetailModal = function() {
  document.getElementById('detail-modal').classList.remove('active');
};

function initFilters() {
  const filterStatus = document.getElementById('filter-status');
  
  filterStatus.addEventListener('change', () => {
    const status = filterStatus.value;
    
    if (status) {
      filteredResults = bulkResults.filter(r => r.status === status);
    } else {
      filteredResults = [...bulkResults];
    }
    
    renderResultsTable();
  });
}

function initExport() {
  document.getElementById('export-results-btn')?.addEventListener('click', () => {
    if (filteredResults.length === 0) {
      showNotification('No results to export', 'warning');
      return;
    }
    
    const data = filteredResults.map(result => ({
      'Transaction ID': result.transaction_id,
      'Customer ID': result.customer_id,
      'Amount': result.transaction_amount,
      'Channel': getChannelName(result.channel_encoded),
      'KYC Verified': result.kyc_verified === 1 ? 'Yes' : 'No',
      'Account Age (Days)': result.account_age_days,
      'Risk Score': (result.risk_score * 100).toFixed(2) + '%',
      'Model Score': (result.model_risk_score * 100).toFixed(2) + '%',
      'Rule Score': (result.rule_score * 100).toFixed(2) + '%',
      'Status': result.status,
      'Timestamp': result.transaction_datetime,
      'Rules Triggered': result.rules_triggered ? result.rules_triggered.join('; ') : '',
      'Explanation': result.explanation || '',
      'Error': result.error_message || ''
    }));
    
    exportToCSV(data, `bulk_predictions_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Results exported successfully!', 'success');
  });
}

function initDownloadSample() {
  document.getElementById('download-sample-btn')?.addEventListener('click', () => {
    const sampleData = [
      {
        customer_id: 'CUST001',
        transaction_id: 'TXN001',
        transaction_amount: 1500.00,
        kyc_verified: 1,
        account_age_days: 365,
        channel_encoded: 0,
        transaction_datetime: '2024-01-15 14:30:00'
      },
      {
        customer_id: 'CUST002',
        transaction_id: 'TXN002',
        transaction_amount: 25000.00,
        kyc_verified: 0,
        account_age_days: 15,
        channel_encoded: 1,
        transaction_datetime: '2024-01-15 23:45:00'
      },
      {
        customer_id: 'CUST003',
        transaction_id: 'TXN003',
        transaction_amount: 500.00,
        kyc_verified: 1,
        account_age_days: 730,
        channel_encoded: 2,
        transaction_datetime: '2024-01-16 10:15:00'
      },
      {
        customer_id: 'CUST001',
        transaction_id: 'TXN004',
        transaction_amount: 125000.00,
        kyc_verified: 0,
        account_age_days: 5,
        channel_encoded: 0,
        transaction_datetime: '2024-01-16 02:30:00'
      }
    ];
    
    exportToCSV(sampleData, 'sample_transactions.csv');
    showNotification('Sample CSV downloaded!', 'success');
  });
}

function resetUpload() {
  // Reset upload area
  const uploadContent = document.getElementById('upload-content');
  uploadContent.innerHTML = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; color: var(--muted-foreground);">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    <h3 style="margin-bottom: 0.5rem;">Click to upload or drag and drop</h3>
    <p style="color: var(--muted-foreground); font-size: 0.875rem; margin-bottom: 1rem;">CSV files only (Max 10MB)</p>
    <button class="btn btn-outline" type="button">Browse Files</button>
  `;
  
  // Reset file input
  document.getElementById('csv-file-input').value = '';
  
  // Hide results
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('processing-status').style.display = 'none';
  
  // Clear results
  bulkResults = [];
  filteredResults = [];
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}