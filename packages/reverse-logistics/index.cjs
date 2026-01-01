const crypto = require('crypto');

const RETURN_REASONS = {
  DAMAGED: { id: 'DAMAGED', name: 'Damaged in Transit', refundPercent: 100, restockable: false },
  WRONG_ITEM: { id: 'WRONG_ITEM', name: 'Wrong Item Shipped', refundPercent: 100, restockable: true },
  DEFECTIVE: { id: 'DEFECTIVE', name: 'Product Defective', refundPercent: 100, restockable: false },
  NOT_AS_DESCRIBED: { id: 'NOT_AS_DESCRIBED', name: 'Not As Described', refundPercent: 100, restockable: true },
  CHANGED_MIND: { id: 'CHANGED_MIND', name: 'Changed Mind', refundPercent: 85, restockable: true },
  BETTER_PRICE: { id: 'BETTER_PRICE', name: 'Found Better Price', refundPercent: 80, restockable: true },
  NO_LONGER_NEEDED: { id: 'NO_LONGER_NEEDED', name: 'No Longer Needed', refundPercent: 85, restockable: true },
  LATE_DELIVERY: { id: 'LATE_DELIVERY', name: 'Late Delivery', refundPercent: 100, restockable: true },
  REFUSED_DELIVERY: { id: 'REFUSED_DELIVERY', name: 'Refused at Delivery', refundPercent: 90, restockable: true }
};

const RETURN_STATUSES = {
  REQUESTED: { id: 'REQUESTED', name: 'Return Requested', order: 1 },
  RMA_ISSUED: { id: 'RMA_ISSUED', name: 'RMA Issued', order: 2 },
  LABEL_GENERATED: { id: 'LABEL_GENERATED', name: 'Return Label Generated', order: 3 },
  PICKUP_SCHEDULED: { id: 'PICKUP_SCHEDULED', name: 'Pickup Scheduled', order: 4 },
  IN_TRANSIT: { id: 'IN_TRANSIT', name: 'Return In Transit', order: 5 },
  RECEIVED: { id: 'RECEIVED', name: 'Return Received', order: 6 },
  INSPECTING: { id: 'INSPECTING', name: 'Under Inspection', order: 7 },
  APPROVED: { id: 'APPROVED', name: 'Return Approved', order: 8 },
  REJECTED: { id: 'REJECTED', name: 'Return Rejected', order: 8 },
  REFUNDED: { id: 'REFUNDED', name: 'Refund Processed', order: 9 },
  RESTOCKED: { id: 'RESTOCKED', name: 'Item Restocked', order: 10 },
  DISPOSED: { id: 'DISPOSED', name: 'Item Disposed', order: 10 },
  CLOSED: { id: 'CLOSED', name: 'Return Closed', order: 11 }
};

const DISPOSITION_TYPES = {
  RESTOCK: { id: 'RESTOCK', name: 'Restock as New', recoveryPercent: 100 },
  RESTOCK_OPEN_BOX: { id: 'RESTOCK_OPEN_BOX', name: 'Restock as Open Box', recoveryPercent: 80 },
  REFURBISH: { id: 'REFURBISH', name: 'Send to Refurbishment', recoveryPercent: 60 },
  LIQUIDATE: { id: 'LIQUIDATE', name: 'Liquidate/Wholesale', recoveryPercent: 30 },
  DONATE: { id: 'DONATE', name: 'Donate to Charity', recoveryPercent: 0, taxBenefit: true },
  RECYCLE: { id: 'RECYCLE', name: 'Recycle Materials', recoveryPercent: 5 },
  DISPOSE: { id: 'DISPOSE', name: 'Dispose/Destroy', recoveryPercent: 0 }
};

const RETURN_CENTERS = [
  { id: 'RC_EAST', name: 'Dynasty East Returns', location: 'Newark, NJ', region: 'NORTH_AMERICA', capacity: 50000, currentLoad: 0 },
  { id: 'RC_WEST', name: 'Dynasty West Returns', location: 'Los Angeles, CA', region: 'NORTH_AMERICA', capacity: 45000, currentLoad: 0 },
  { id: 'RC_CENTRAL', name: 'Dynasty Central Returns', location: 'Dallas, TX', region: 'NORTH_AMERICA', capacity: 40000, currentLoad: 0 },
  { id: 'RC_EU', name: 'Dynasty Europe Returns', location: 'Rotterdam, NL', region: 'EUROPE', capacity: 35000, currentLoad: 0 },
  { id: 'RC_APAC', name: 'Dynasty APAC Returns', location: 'Singapore', region: 'ASIA_PACIFIC', capacity: 30000, currentLoad: 0 }
];

const returns = new Map();
const rmaNumbers = new Map();

function generateRMA() {
  const prefix = 'RMA';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function initiateReturn(orderId, items, reason, customerInfo) {
  const returnId = `RET-${crypto.randomBytes(6).toString('hex')}`;
  const rmaNumber = generateRMA();
  
  const returnRequest = {
    id: returnId,
    rmaNumber,
    orderId,
    items: items.map(item => ({
      ...item,
      returnQuantity: item.returnQuantity || item.quantity,
      condition: 'PENDING_INSPECTION'
    })),
    reason: RETURN_REASONS[reason] || RETURN_REASONS.CHANGED_MIND,
    customer: customerInfo,
    status: 'REQUESTED',
    timeline: [{
      status: 'REQUESTED',
      timestamp: new Date().toISOString(),
      note: 'Return request initiated'
    }],
    createdAt: new Date().toISOString(),
    estimatedRefund: calculateEstimatedRefund(items, reason),
    assignedCenter: null,
    trackingNumber: null,
    inspectionResult: null
  };
  
  returns.set(returnId, returnRequest);
  rmaNumbers.set(rmaNumber, returnId);
  
  return { success: true, return: returnRequest };
}

function calculateEstimatedRefund(items, reason) {
  const reasonConfig = RETURN_REASONS[reason] || RETURN_REASONS.CHANGED_MIND;
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.returnQuantity || item.quantity)), 0);
  return {
    subtotal,
    refundPercent: reasonConfig.refundPercent,
    estimatedAmount: subtotal * (reasonConfig.refundPercent / 100),
    restockingFee: subtotal * ((100 - reasonConfig.refundPercent) / 100)
  };
}

function issueRMA(returnId, approvedItems) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  
  const center = selectReturnCenter(returnRequest.customer.region);
  
  returnRequest.status = 'RMA_ISSUED';
  returnRequest.assignedCenter = center;
  returnRequest.approvedItems = approvedItems || returnRequest.items;
  returnRequest.timeline.push({
    status: 'RMA_ISSUED',
    timestamp: new Date().toISOString(),
    note: `RMA approved, assigned to ${center.name}`
  });
  
  return { success: true, return: returnRequest, center };
}

function selectReturnCenter(customerRegion) {
  const regionalCenters = RETURN_CENTERS.filter(c => c.region === customerRegion);
  if (regionalCenters.length === 0) {
    return RETURN_CENTERS.find(c => c.region === 'NORTH_AMERICA');
  }
  return regionalCenters.reduce((best, center) => {
    const bestUtilization = best.currentLoad / best.capacity;
    const centerUtilization = center.currentLoad / center.capacity;
    return centerUtilization < bestUtilization ? center : best;
  }, regionalCenters[0]);
}

function generateReturnLabel(returnId, courierService) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  
  const trackingNumber = `${courierService.toUpperCase()}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  
  returnRequest.status = 'LABEL_GENERATED';
  returnRequest.trackingNumber = trackingNumber;
  returnRequest.courierService = courierService;
  returnRequest.labelGeneratedAt = new Date().toISOString();
  returnRequest.timeline.push({
    status: 'LABEL_GENERATED',
    timestamp: new Date().toISOString(),
    note: `Return label generated via ${courierService}`
  });
  
  return {
    success: true,
    trackingNumber,
    labelUrl: `https://dynasty.returns/label/${returnId}`,
    qrCode: `https://dynasty.returns/qr/${trackingNumber}`,
    instructions: [
      'Pack items securely in original packaging if available',
      'Include all accessories and documentation',
      'Attach the return label to the outside of the package',
      `Drop off at any ${courierService} location or schedule pickup`
    ]
  };
}

function schedulePickup(returnId, pickupDetails) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  
  returnRequest.status = 'PICKUP_SCHEDULED';
  returnRequest.pickup = {
    scheduledDate: pickupDetails.date,
    timeWindow: pickupDetails.timeWindow || '9:00 AM - 5:00 PM',
    address: pickupDetails.address,
    specialInstructions: pickupDetails.instructions,
    confirmationNumber: `PU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  };
  returnRequest.timeline.push({
    status: 'PICKUP_SCHEDULED',
    timestamp: new Date().toISOString(),
    note: `Pickup scheduled for ${pickupDetails.date}`
  });
  
  return { success: true, return: returnRequest, pickup: returnRequest.pickup };
}

function updateReturnStatus(returnId, status, metadata = {}) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  
  returnRequest.status = status;
  returnRequest.timeline.push({
    status,
    timestamp: new Date().toISOString(),
    note: metadata.note || `Status updated to ${status}`,
    ...metadata
  });
  
  if (status === 'RECEIVED') {
    returnRequest.receivedAt = new Date().toISOString();
    const center = RETURN_CENTERS.find(c => c.id === returnRequest.assignedCenter?.id);
    if (center) center.currentLoad++;
  }
  
  return { success: true, return: returnRequest };
}

function inspectReturn(returnId, inspectionResults) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  
  returnRequest.status = 'INSPECTING';
  returnRequest.inspectionResult = {
    inspectedAt: new Date().toISOString(),
    inspector: inspectionResults.inspector,
    items: inspectionResults.items.map(item => ({
      ...item,
      condition: item.condition,
      notes: item.notes,
      disposition: determineDisposition(item.condition, returnRequest.reason.id)
    }))
  };
  returnRequest.timeline.push({
    status: 'INSPECTING',
    timestamp: new Date().toISOString(),
    note: 'Inspection completed'
  });
  
  return { success: true, return: returnRequest };
}

function determineDisposition(condition, reasonId) {
  const conditionMap = {
    'NEW_SEALED': 'RESTOCK',
    'NEW_OPEN': 'RESTOCK_OPEN_BOX',
    'LIKE_NEW': 'RESTOCK_OPEN_BOX',
    'GOOD': 'REFURBISH',
    'FAIR': 'LIQUIDATE',
    'POOR': 'RECYCLE',
    'DAMAGED': 'DISPOSE',
    'DEFECTIVE': 'DISPOSE'
  };
  return DISPOSITION_TYPES[conditionMap[condition] || 'LIQUIDATE'];
}

function approveReturn(returnId, refundAmount) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  
  returnRequest.status = 'APPROVED';
  returnRequest.approvedRefund = refundAmount || returnRequest.estimatedRefund.estimatedAmount;
  returnRequest.approvedAt = new Date().toISOString();
  returnRequest.timeline.push({
    status: 'APPROVED',
    timestamp: new Date().toISOString(),
    note: `Return approved, refund: $${returnRequest.approvedRefund.toFixed(2)}`
  });
  
  return { success: true, return: returnRequest };
}

function processRefund(returnId, refundMethod) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest) return { success: false, error: 'Return not found' };
  if (returnRequest.status !== 'APPROVED') return { success: false, error: 'Return not approved' };
  
  returnRequest.status = 'REFUNDED';
  returnRequest.refund = {
    amount: returnRequest.approvedRefund,
    method: refundMethod,
    processedAt: new Date().toISOString(),
    transactionId: `REF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`
  };
  returnRequest.timeline.push({
    status: 'REFUNDED',
    timestamp: new Date().toISOString(),
    note: `Refund of $${returnRequest.approvedRefund.toFixed(2)} processed via ${refundMethod}`
  });
  
  return { success: true, return: returnRequest, refund: returnRequest.refund };
}

function processDisposition(returnId) {
  const returnRequest = returns.get(returnId);
  if (!returnRequest || !returnRequest.inspectionResult) {
    return { success: false, error: 'Return not found or not inspected' };
  }
  
  const dispositions = returnRequest.inspectionResult.items.map(item => ({
    item,
    action: item.disposition,
    recoveryValue: item.value * (item.disposition.recoveryPercent / 100)
  }));
  
  const totalRecovery = dispositions.reduce((sum, d) => sum + d.recoveryValue, 0);
  const restockedItems = dispositions.filter(d => d.action.id.includes('RESTOCK'));
  
  if (restockedItems.length > 0) {
    returnRequest.status = 'RESTOCKED';
  } else {
    returnRequest.status = 'DISPOSED';
  }
  
  returnRequest.disposition = {
    processedAt: new Date().toISOString(),
    items: dispositions,
    totalRecovery
  };
  
  returnRequest.timeline.push({
    status: returnRequest.status,
    timestamp: new Date().toISOString(),
    note: `Items processed, recovery value: $${totalRecovery.toFixed(2)}`
  });
  
  const center = RETURN_CENTERS.find(c => c.id === returnRequest.assignedCenter?.id);
  if (center && center.currentLoad > 0) center.currentLoad--;
  
  return { success: true, return: returnRequest, dispositions };
}

function getReturn(returnId) {
  return returns.get(returnId) || null;
}

function getReturnByRMA(rmaNumber) {
  const returnId = rmaNumbers.get(rmaNumber);
  return returnId ? returns.get(returnId) : null;
}

function getReturns(filters = {}) {
  let result = Array.from(returns.values());
  
  if (filters.status) result = result.filter(r => r.status === filters.status);
  if (filters.reason) result = result.filter(r => r.reason.id === filters.reason);
  if (filters.centerId) result = result.filter(r => r.assignedCenter?.id === filters.centerId);
  if (filters.customerId) result = result.filter(r => r.customer?.id === filters.customerId);
  
  return result.slice(0, filters.limit || 100);
}

function getReturnAnalytics(period = 'month') {
  const allReturns = Array.from(returns.values());
  
  const byReason = {};
  Object.keys(RETURN_REASONS).forEach(r => byReason[r] = 0);
  allReturns.forEach(r => byReason[r.reason.id]++);
  
  const byStatus = {};
  Object.keys(RETURN_STATUSES).forEach(s => byStatus[s] = 0);
  allReturns.forEach(r => byStatus[r.status]++);
  
  const totalRefunded = allReturns
    .filter(r => r.refund)
    .reduce((sum, r) => sum + r.refund.amount, 0);
  
  const totalRecovered = allReturns
    .filter(r => r.disposition)
    .reduce((sum, r) => sum + r.disposition.totalRecovery, 0);
  
  return {
    period,
    summary: {
      totalReturns: allReturns.length,
      pendingReturns: allReturns.filter(r => !['CLOSED', 'REFUNDED', 'RESTOCKED', 'DISPOSED'].includes(r.status)).length,
      totalRefunded,
      totalRecovered,
      netLoss: totalRefunded - totalRecovered,
      avgProcessingDays: 3.5
    },
    byReason,
    byStatus,
    centerUtilization: RETURN_CENTERS.map(c => ({
      id: c.id,
      name: c.name,
      utilization: ((c.currentLoad / c.capacity) * 100).toFixed(1) + '%'
    }))
  };
}

function getReturnReasons() {
  return Object.values(RETURN_REASONS);
}

function getReturnStatuses() {
  return Object.values(RETURN_STATUSES);
}

function getDispositionTypes() {
  return Object.values(DISPOSITION_TYPES);
}

function getReturnCenters() {
  return RETURN_CENTERS;
}

module.exports = {
  RETURN_REASONS,
  RETURN_STATUSES,
  DISPOSITION_TYPES,
  RETURN_CENTERS,
  initiateReturn,
  issueRMA,
  generateReturnLabel,
  schedulePickup,
  updateReturnStatus,
  inspectReturn,
  approveReturn,
  processRefund,
  processDisposition,
  getReturn,
  getReturnByRMA,
  getReturns,
  getReturnAnalytics,
  getReturnReasons,
  getReturnStatuses,
  getDispositionTypes,
  getReturnCenters
};
