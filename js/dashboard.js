// Dashboard functionality with Backend API Integration
const API_BASE_URL = 'https://pylord-api-bfsi.hf.space';
let currentPage = 1;
const itemsPerPage = 10;
let allTransactions = [];
let filteredTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  loadUserTransactions();
  initFilters();
  initPagination();
  initExport();
});

async function loadUserTransactions() {
  const userEmail = getCurrentUserEmail();
  
  if (!userEmail) {
    showNotification('Please login first', 'error');
    window.location.href = '/auth.html';
    return;
  }

  try {
    // Show loading state
    const tbody = document.querySelector('#transactions-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading transactions...</td></tr>';

    // Fetch transactions from API
    const response = await fetch(`${API_BASE_URL}/api/transactions/${encodeURIComponent(userEmail)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const result = await response.json();
    
    if (result.status === 'success') {
      allTransactions = result.data.transactions.map(txn => ({
        id: txn.transaction_id,
        customerId: txn.customer_id,
        kycVerified: txn.derived_features.kyc_verified === 1,
        accountAge: txn.derived_features.account_age_days + ' days',
        amount: txn.derived_features.transaction_amount,
        channel: getChannelName(txn.derived_features.channel_encoded),
        timestamp: txn.timestamp,
        prediction: txn.is_fraud === 1 ? 'Fraud' : (txn.risk_score > 0.5 ? 'Risky' : 'Legitimate'),
        riskScore: txn.risk_score,
        explanation: txn.explanation
      }));
      
      filteredTransactions = [...allTransactions];
      updateStats();
      renderTable();
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No transactions found</td></tr>';
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    showNotification('Failed to load transactions', 'error');
    const tbody = document.querySelector('#transactions-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--destructive);">Error loading transactions. Please try again.</td></tr>';
  }
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

function updateStats() {
  const legitimateCount = allTransactions.filter(t => t.prediction === 'Legitimate').length;
  const fraudCount = allTransactions.filter(t => t.prediction === 'Fraud').length;
  const totalVolume = allTransactions.reduce((sum, t) => sum + t.amount, 0);
  const verifiedCount = allTransactions.filter(t => t.kycVerified).length;
  
  document.getElementById('total-transactions').textContent = allTransactions.length.toLocaleString();
  document.getElementById('fraud-rate').textContent = allTransactions.length > 0 
    ? ((fraudCount / allTransactions.length) * 100).toFixed(2) + '%' 
    : '0%';
  document.getElementById('total-volume').textContent = '$' + (totalVolume / 1000).toFixed(1) + 'K';
  document.getElementById('verified-users').textContent = verifiedCount;
}

function renderTable() {
  const tbody = document.querySelector('#transactions-table tbody');
  tbody.innerHTML = '';
  
  if (filteredTransactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No transactions match your filters</td></tr>';
    updatePaginationInfo();
    return;
  }
  
  const { items } = paginate(filteredTransactions, currentPage, itemsPerPage);
  
  items.forEach(txn => {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.title = 'Click to view details';
    
    row.innerHTML = `
      <td style="font-family: monospace; font-size: 0.875rem; color: var(--primary);">${txn.id}</td>
      <td>${txn.customerId}</td>
      <td>
        <span class="badge ${txn.kycVerified ? 'badge-success' : 'badge-warning'}">
          ${txn.kycVerified ? 'Yes' : 'No'}
        </span>
      </td>
      <td style="font-weight: 600;">${formatCurrency(txn.amount)}</td>
      <td>${txn.channel}</td>
      <td>
        <span class="badge" style="background-color: ${getStatusBg(txn.prediction)}; color: ${getStatusColor(txn.prediction)};">
          ${txn.prediction} (${(txn.riskScore * 100).toFixed(1)}%)
        </span>
      </td>
    `;
    
    // Add click event to show details
    row.addEventListener('click', () => showTransactionDetails(txn));
    
    tbody.appendChild(row);
  });
  
  updatePaginationInfo();
}

function showTransactionDetails(txn) {
  // Create modal HTML
  const modalHTML = `
    <div class="modal-overlay" id="transaction-detail-modal" style="display: flex;">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title">Transaction Details</h2>
          <button class="modal-close" onclick="closeTransactionModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; gap: 1rem;">
            <div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Transaction ID</p>
              <p style="font-weight: 600;">${txn.id}</p>
            </div>
            <div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Customer ID</p>
              <p style="font-weight: 600;">${txn.customerId}</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Amount</p>
                <p style="font-weight: 600; font-size: 1.25rem;">${formatCurrency(txn.amount)}</p>
              </div>
              <div>
                <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Risk Score</p>
                <p style="font-weight: 600; font-size: 1.25rem; color: ${txn.riskScore > 0.6 ? 'var(--destructive)' : 'var(--primary)'};">${(txn.riskScore * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Channel</p>
                <p style="font-weight: 600;">${txn.channel}</p>
              </div>
              <div>
                <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">KYC Verified</p>
                <p style="font-weight: 600;">${txn.kycVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Timestamp</p>
              <p style="font-weight: 600;">${new Date(txn.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.25rem;">Status</p>
              <span class="badge" style="background-color: ${getStatusBg(txn.prediction)}; color: ${getStatusColor(txn.prediction)}; padding: 0.5rem 1rem; font-size: 0.875rem;">
                ${txn.prediction}
              </span>
            </div>
            <div>
              <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.5rem;">Explanation</p>
              <div style="background: var(--muted); padding: 1rem; border-radius: var(--radius); font-size: 0.875rem; line-height: 1.6;">
                ${txn.explanation || 'No explanation available'}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeTransactionModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('transaction-detail-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Global function to close modal
window.closeTransactionModal = function() {
  const modal = document.getElementById('transaction-detail-modal');
  if (modal) {
    modal.style.display = 'none';
    setTimeout(() => modal.remove(), 300);
  }
};

function initFilters() {
  const searchInput = document.getElementById('search-input');
  const filterPrediction = document.getElementById('filter-prediction');
  const filterChannel = document.getElementById('filter-channel');
  
  const updateFilters = debounce(() => {
    const searchTerm = searchInput.value.toLowerCase();
    const prediction = filterPrediction.value;
    const channel = filterChannel.value;
    
    filteredTransactions = allTransactions.filter(txn => {
      const matchesSearch = txn.id.toLowerCase().includes(searchTerm) || 
                           txn.customerId.toLowerCase().includes(searchTerm);
      const matchesPrediction = !prediction || txn.prediction === prediction;
      const matchesChannel = !channel || txn.channel === channel;
      return matchesSearch && matchesPrediction && matchesChannel;
    });
    
    currentPage = 1;
    renderTable();
  }, 300);
  
  searchInput.addEventListener('input', updateFilters);
  filterPrediction.addEventListener('change', updateFilters);
  filterChannel.addEventListener('change', updateFilters);
}

function initPagination() {
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function updatePaginationInfo() {
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, filteredTransactions.length);
  
  document.getElementById('pagination-info').textContent = 
    filteredTransactions.length > 0 
      ? `Showing ${start} to ${end} of ${filteredTransactions.length} transactions`
      : 'No transactions to display';
  
  const pageButtonsContainer = document.getElementById('page-buttons');
  pageButtonsContainer.innerHTML = '';
  
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}`;
    btn.textContent = i;
    btn.style.minWidth = '40px';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderTable();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    pageButtonsContainer.appendChild(btn);
  }
  
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function initExport() {
  const exportBtn = document.getElementById('export-btn');
  exportBtn.addEventListener('click', () => {
    if (filteredTransactions.length === 0) {
      showNotification('No transactions to export', 'warning');
      return;
    }
    
    const data = filteredTransactions.map(txn => ({
      'Transaction ID': txn.id,
      'Customer ID': txn.customerId,
      'KYC Verified': txn.kycVerified ? 'Yes' : 'No',
      'Account Age': txn.accountAge,
      'Amount': txn.amount,
      'Channel': txn.channel,
      'Timestamp': txn.timestamp,
      'Prediction': txn.prediction,
      'Risk Score': (txn.riskScore * 100).toFixed(2) + '%',
      'Explanation': txn.explanation,
    }));
    
    exportToCSV(data, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    showNotification('Transactions exported successfully!', 'success');
  });
}