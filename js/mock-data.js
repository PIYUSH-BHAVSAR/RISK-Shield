// ============================================
// MOCK DATA FOR THE APPLICATION
// ============================================

// Transactions data
const SAMPLE_TRANSACTIONS = [
  {
    id: "TXN-001",
    customerId: "CUST-12345",
    kycVerified: true,
    accountAge: "2 years",
    amount: 2450.5,
    channel: "Mobile App",
    timestamp: "2024-01-15 14:32:00",
    prediction: "Legitimate",
    explanation: "Low risk transaction. Customer has verified identity and clean history.",
  },
  {
    id: "TXN-002",
    customerId: "CUST-67890",
    kycVerified: false,
    accountAge: "3 days",
    amount: 15890.0,
    channel: "Web",
    timestamp: "2024-01-15 13:15:00",
    prediction: "Risky",
    explanation: "High amount for new account. KYC not verified. Recommend manual review.",
  },
  {
    id: "TXN-003",
    customerId: "CUST-11111",
    kycVerified: true,
    accountAge: "6 months",
    amount: 890.75,
    channel: "API",
    timestamp: "2024-01-15 12:45:00",
    prediction: "Legitimate",
    explanation: "Consistent with user behavior. Amount within normal range.",
  },
  {
    id: "TXN-004",
    customerId: "CUST-22222",
    kycVerified: false,
    accountAge: "1 day",
    amount: 500.0,
    channel: "Mobile App",
    timestamp: "2024-01-15 11:20:00",
    prediction: "Risky",
    explanation: "Unusual location. Multiple failed login attempts detected.",
  },
  {
    id: "TXN-005",
    customerId: "CUST-33333",
    kycVerified: true,
    accountAge: "1 year",
    amount: 3200.0,
    channel: "ATM",
    timestamp: "2024-01-15 10:30:00",
    prediction: "Legitimate",
    explanation: "Regular transaction pattern. Verified customer with good history.",
  },
  {
    id: "TXN-006",
    customerId: "CUST-44444",
    kycVerified: true,
    accountAge: "5 years",
    amount: 75000.0,
    channel: "Wire Transfer",
    timestamp: "2024-01-15 09:15:00",
    prediction: "Legitimate",
    explanation: "Large but expected transfer. Verified large account holder.",
  },
  {
    id: "TXN-007",
    customerId: "CUST-55555",
    kycVerified: false,
    accountAge: "5 hours",
    amount: 50000.0,
    channel: "Wire Transfer",
    timestamp: "2024-01-15 08:00:00",
    prediction: "Fraud",
    explanation: "Brand new account attempting large international transfer. High fraud risk.",
  },
  {
    id: "TXN-008",
    customerId: "CUST-66666",
    kycVerified: true,
    accountAge: "8 months",
    amount: 1250.0,
    channel: "Mobile App",
    timestamp: "2024-01-14 23:45:00",
    prediction: "Legitimate",
    explanation: "Within normal spending patterns. No red flags detected.",
  },
];

// Analytics data
const FRAUD_TREND_DATA = [
  { date: "Jan 1", legitimate: 450, risky: 120, fraud: 30 },
  { date: "Jan 2", legitimate: 520, risky: 140, fraud: 35 },
  { date: "Jan 3", legitimate: 480, risky: 110, fraud: 25 },
  { date: "Jan 4", legitimate: 610, risky: 160, fraud: 45 },
  { date: "Jan 5", legitimate: 570, risky: 130, fraud: 40 },
  { date: "Jan 6", legitimate: 690, risky: 180, fraud: 55 },
  { date: "Jan 7", legitimate: 750, risky: 150, fraud: 50 },
];

const CHANNEL_DISTRIBUTION = [
  { name: "Mobile App", value: 2500, percentage: 35 },
  { name: "Web", value: 1800, percentage: 25 },
  { name: "API", value: 1500, percentage: 21 },
  { name: "ATM", value: 800, percentage: 11 },
  { name: "Wire Transfer", value: 400, percentage: 8 },
];

const TRANSACTION_VOLUME_DATA = [
  { hour: "00:00", volume: 120 },
  { hour: "04:00", volume: 85 },
  { hour: "08:00", volume: 320 },
  { hour: "12:00", volume: 450 },
  { hour: "16:00", volume: 520 },
  { hour: "20:00", volume: 410 },
  { hour: "23:59", volume: 180 },
];

const PREDICTION_ACCURACY_DATA = [
  { name: "True Positive", value: 850, percentage: 85 },
  { name: "False Positive", value: 95, percentage: 9.5 },
  { name: "False Negative", value: 45, percentage: 4.5 },
  { name: "True Negative", value: 10, percentage: 1 },
];

const RISK_SCORE_DISTRIBUTION = [
  { range: "0-20%", count: 3200 },
  { range: "20-40%", count: 2100 },
  { range: "40-60%", count: 1400 },
  { range: "60-80%", count: 650 },
  { range: "80-100%", count: 250 },
];

// Feature Importance Data
const FEATURE_IMPORTANCE_DATA = [
  { feature: "Transaction Amount", importance: 0.285 },
  { feature: "Account Age", importance: 0.198 },
  { feature: "KYC Status", importance: 0.165 },
  { feature: "Login Location", importance: 0.142 },
  { feature: "Previous History", importance: 0.128 },
  { feature: "Device Fingerprint", importance: 0.082 },
];

// Model Metrics
const MODEL_METRICS = [
  { metric: "Accuracy", value: "99.2%", target: "95%" },
  { metric: "Precision", value: "98.8%", target: "97%" },
  { metric: "Recall", value: "97.5%", target: "96%" },
  { metric: "F1 Score", value: "98.1%", target: "96%" },
  { metric: "AUC-ROC", value: "0.9932", target: "0.95" },
  { metric: "Specificity", value: "99.0%", target: "98%" },
];

// Confusion Matrix
const CONFUSION_MATRIX = {
  truePositive: 850,
  falsePositive: 95,
  falseNegative: 45,
  trueNegative: 10,
};

// Sample transactions for LLM explanation
const SAMPLE_TRANSACTIONS_FOR_EXPLANATION = [
  {
    id: "TXN-002",
    amount: 15890,
    accountAge: "3 days",
    kycVerified: false,
    channel: "Web",
  },
  {
    id: "TXN-007",
    amount: 50000,
    accountAge: "5 hours",
    kycVerified: false,
    channel: "Wire Transfer",
  },
  {
    id: "TXN-004",
    amount: 500,
    accountAge: "1 day",
    kycVerified: false,
    channel: "Mobile App",
  },
];

// LLM Explanations
const LLM_EXPLANATIONS = {
  "TXN-002":
    "This transaction is classified as RISKY with 87% confidence. The system detected several red flags: (1) New account created only 3 days ago with large transaction amount of $15,890 - typical fraud pattern. (2) KYC verification not completed - high risk indicator. (3) Web channel transaction from new device - unusual access pattern. (4) Transaction amount exceeds typical new account limits. The model recommends manual review and KYC verification before processing.",
  "TXN-007":
    "This transaction is classified as FRAUD with 94% confidence. Critical risk factors identified: (1) Brand new account created only 5 hours ago - extremely high risk. (2) Large wire transfer of $50,000 - international high-value transaction. (3) KYC verification not completed - unverified user attempting large transfer. (4) Multiple risk factors combined indicate sophisticated fraud attempt. Recommend immediate blocking and investigation.",
  "TXN-004":
    "This transaction is classified as RISKY with 76% confidence. Notable concerns: (1) Very new account (1 day old) attempting transaction. (2) KYC not verified - user identity unconfirmed. (3) Unusual login location detected - geographic anomaly. (4) Multiple failed login attempts before transaction. While amount is small, transaction pattern suggests potential account takeover. Recommend KYC completion and additional verification.",
};

// Profile data
const PROFILE_DATA = {
  fullName: "John Doe",
  email: "john@example.com",
  phone: "+1 (555) 123-4567",
  company: "Acme Corp",
  position: "Chief Financial Officer",
  country: "United States",
};

// Notifications preferences
const NOTIFICATION_PREFERENCES = {
  emailAlerts: true,
  fraudAlerts: true,
  weeklyReport: true,
  productUpdates: false,
  securityNotices: true,
};

// Helper function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Helper function to format date
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status) {
    case "Legitimate":
      return "#22c55e";
    case "Risky":
      return "#f59e0b";
    case "Fraud":
      return "#ef4444";
    default:
      return "#3b82f6";
  }
}

// Helper function to get status background
function getStatusBg(status) {
  switch (status) {
    case "Legitimate":
      return "rgba(34, 197, 94, 0.1)";
    case "Risky":
      return "rgba(245, 158, 11, 0.1)";
    case "Fraud":
      return "rgba(239, 68, 68, 0.1)";
    default:
      return "rgba(59, 130, 246, 0.1)";
  }
}
