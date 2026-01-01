import { pgTable, serial, varchar, text, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const loads = pgTable("loads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shipperId: varchar("shipper_id", { length: 64 }).notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  mode: varchar("mode", { length: 16 }).notNull(),
  region: varchar("region", { length: 32 }).notNull(),
  budgetAmount: decimal("budget_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("CREATED"),
  driverId: varchar("driver_id", { length: 64 }),
  contractId: varchar("contract_id", { length: 64 }),
  escrowDepositId: varchar("escrow_deposit_id", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drivers = pgTable("drivers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  homeBase: text("home_base").notNull(),
  equipment: varchar("equipment", { length: 32 }).notNull(),
  loadsCompleted: integer("loads_completed").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditLines = pgTable("credit_lines", {
  id: serial("id").primaryKey(),
  driverId: varchar("driver_id", { length: 64 }).notNull().unique(),
  limitAmount: decimal("limit_amount", { precision: 12, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  available: decimal("available", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
  tier: varchar("tier", { length: 16 }).notNull().default("STANDARD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  driverId: varchar("driver_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 16 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  loadId: varchar("load_id", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  driverId: varchar("driver_id", { length: 64 }).notNull(),
  shipperId: varchar("shipper_id", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dynastyFee: decimal("dynasty_fee", { precision: 12, scale: 2 }).notNull(),
  driverPayout: decimal("driver_payout", { precision: 12, scale: 2 }).notNull(),
  terms: jsonb("terms").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
});

export const escrowDeposits = pgTable("escrow_deposits", {
  id: varchar("id", { length: 64 }).primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  shipperId: varchar("shipper_id", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  escrowAddress: varchar("escrow_address", { length: 64 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("HELD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  driverId: varchar("driver_id", { length: 64 }).notNull(),
  grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull(),
  dynastyFee: decimal("dynasty_fee", { precision: 12, scale: 2 }).notNull(),
  netDriverPayout: decimal("net_driver_payout", { precision: 12, scale: 2 }).notNull(),
  repaymentAmount: decimal("repayment_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dispatchRecords = pgTable("dispatch_records", {
  id: varchar("id", { length: 64 }).primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  driverId: varchar("driver_id", { length: 64 }).notNull(),
  method: varchar("method", { length: 24 }).notNull(),
  overrideReason: text("override_reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const externalContracts = pgTable("external_contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  externalId: varchar("external_id", { length: 128 }).notNull(),
  source: varchar("source", { length: 32 }).notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  mode: varchar("mode", { length: 16 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  equipment: varchar("equipment", { length: 32 }),
  shipperName: text("shipper_name"),
  dynastyScore: integer("dynasty_score").notNull().default(0),
  redirected: boolean("redirected").notNull().default(false),
  redirectTarget: varchar("redirect_target", { length: 32 }),
  status: varchar("status", { length: 24 }).notNull().default("GATHERED"),
  convertedLoadId: varchar("converted_load_id", { length: 64 }),
  gatheredAt: timestamp("gathered_at").notNull().defaultNow(),
});

export const tokenTransactions = pgTable("token_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: varchar("type", { length: 32 }).notNull(),
  loadId: varchar("load_id", { length: 64 }),
  driverId: varchar("driver_id", { length: 64 }),
  fromAddress: varchar("from_address", { length: 64 }).notNull(),
  toAddress: varchar("to_address", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  txHash: varchar("tx_hash", { length: 128 }),
  status: varchar("status", { length: 16 }).notNull().default("PENDING"),
  tokenContract: varchar("token_contract", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const securityEvents = pgTable("security_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  type: varchar("type", { length: 48 }).notNull(),
  ip: varchar("ip", { length: 64 }),
  path: varchar("path", { length: 256 }),
  data: jsonb("data"),
  severity: varchar("severity", { length: 16 }).notNull().default("INFO"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  accessTokenHash: varchar("access_token_hash", { length: 128 }).notNull(),
  refreshTokenHash: varchar("refresh_token_hash", { length: 128 }).notNull(),
  metadata: jsonb("metadata"),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 64 }).primaryKey(),
  partnerId: varchar("partner_id", { length: 64 }).notNull(),
  partnerName: text("partner_name").notNull(),
  secretHash: varchar("secret_hash", { length: 128 }).notNull(),
  permissions: jsonb("permissions").notNull(),
  rateLimit: integer("rate_limit").notNull().default(100),
  status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
  lastUsed: timestamp("last_used"),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditEntries = pgTable("audit_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  actor: varchar("actor", { length: 64 }).notNull(),
  data: jsonb("data"),
  metadata: jsonb("metadata"),
  hash: varchar("hash", { length: 128 }).notNull(),
  previousHash: varchar("previous_hash", { length: 128 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const liveIntelSources = pgTable("live_intel_sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  endpoint: text("endpoint"),
  status: varchar("status", { length: 16 }).notNull().default("ACTIVE"),
  lastFetchAt: timestamp("last_fetch_at"),
  lastSuccessAt: timestamp("last_success_at"),
  failureCount: integer("failure_count").notNull().default(0),
  config: jsonb("config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const liveIntelSnapshots = pgTable("live_intel_snapshots", {
  id: serial("id").primaryKey(),
  sourceId: varchar("source_id", { length: 64 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  metrics: jsonb("metrics").notNull(),
  advisories: jsonb("advisories"),
  region: varchar("region", { length: 32 }),
  mode: varchar("mode", { length: 16 }),
  obtainedAt: timestamp("obtained_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const liveIntelAlerts = pgTable("live_intel_alerts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sourceId: varchar("source_id", { length: 64 }).notNull(),
  category: varchar("category", { length: 32 }).notNull(),
  severity: varchar("severity", { length: 16 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  affectedRegions: jsonb("affected_regions"),
  affectedModes: jsonb("affected_modes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const partnerStatus = pgTable("partner_status", {
  id: varchar("id", { length: 64 }).primaryKey(),
  partnerId: varchar("partner_id", { length: 64 }).notNull(),
  partnerName: text("partner_name").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("ONLINE"),
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  contractsAvailable: integer("contracts_available").notNull().default(0),
  avgResponseTime: integer("avg_response_time"),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const driverLoyalty = pgTable("driver_loyalty", {
  id: serial("id").primaryKey(),
  driverId: varchar("driver_id", { length: 64 }).notNull().unique(),
  tier: varchar("tier", { length: 24 }).notNull().default("BRONZE"),
  totalPoints: integer("total_points").notNull().default(0),
  currentPoints: integer("current_points").notNull().default(0),
  tierStartDate: timestamp("tier_start_date").notNull().defaultNow(),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  lifetimeLoads: integer("lifetime_loads").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  driverId: varchar("driver_id", { length: 64 }).notNull(),
  action: varchar("action", { length: 32 }).notNull(),
  points: integer("points").notNull(),
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull().default("1.0"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const complianceChecks = pgTable("compliance_checks", {
  id: serial("id").primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  driverId: varchar("driver_id", { length: 64 }),
  compliant: boolean("compliant").notNull(),
  mode: varchar("mode", { length: 16 }).notNull(),
  region: varchar("region", { length: 32 }).notNull(),
  errors: jsonb("errors"),
  warnings: jsonb("warnings"),
  passes: jsonb("passes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const complianceExceptions = pgTable("compliance_exceptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  driverId: varchar("driver_id", { length: 64 }),
  exceptionType: varchar("exception_type", { length: 48 }).notNull(),
  reason: text("reason").notNull(),
  overridden: boolean("overridden").notNull().default(false),
  overrideBy: varchar("override_by", { length: 64 }),
  overrideAt: timestamp("override_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const riskAssessments = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  driverId: varchar("driver_id", { length: 64 }),
  compositeScore: integer("composite_score").notNull(),
  compositeLevel: varchar("composite_level", { length: 16 }).notNull(),
  riskMultiplier: decimal("risk_multiplier", { precision: 4, scale: 2 }).notNull(),
  categories: jsonb("categories"),
  recommendations: jsonb("recommendations"),
  region: varchar("region", { length: 32 }),
  mode: varchar("mode", { length: 16 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const driverRewards = pgTable("driver_rewards", {
  id: serial("id").primaryKey(),
  driverId: varchar("driver_id", { length: 64 }).notNull().unique(),
  rewardPoints: integer("reward_points").notNull().default(0),
  badges: jsonb("badges"),
  streaks: jsonb("streaks"),
  activeBoosts: jsonb("active_boosts"),
  redemptions: jsonb("redemptions"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rewardTransactions = pgTable("reward_transactions", {
  id: serial("id").primaryKey(),
  driverId: varchar("driver_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  value: integer("value").notNull(),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const couriers = pgTable("couriers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: varchar("phone", { length: 24 }),
  type: varchar("type", { length: 32 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("ONBOARDING"),
  homeZone: varchar("home_zone", { length: 32 }),
  onboardingProgress: jsonb("onboarding_progress"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  walletAddress: varchar("wallet_address", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  activatedAt: timestamp("activated_at"),
});

export const courierVehicles = pgTable("courier_vehicles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  courierId: varchar("courier_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 24 }).notNull(),
  licensePlate: varchar("license_plate", { length: 24 }),
  make: varchar("make", { length: 48 }),
  model: varchar("model", { length: 48 }),
  year: integer("year"),
  isActive: boolean("is_active").notNull().default(true),
  currentZone: varchar("current_zone", { length: 32 }),
  isAvailable: boolean("is_available").notNull().default(false),
  lastLocation: jsonb("last_location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courierDeliveries = pgTable("courier_deliveries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  courierId: varchar("courier_id", { length: 64 }),
  vehicleId: varchar("vehicle_id", { length: 64 }),
  pickup: jsonb("pickup").notNull(),
  delivery: jsonb("delivery").notNull(),
  serviceLevel: varchar("service_level", { length: 24 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  estimatedTime: integer("estimated_time"),
  actualTime: integer("actual_time"),
  podUrl: text("pod_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
  completedAt: timestamp("completed_at"),
});

export const returns = pgTable("returns", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  customerId: varchar("customer_id", { length: 64 }),
  reason: varchar("reason", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("INITIATED"),
  items: jsonb("items").notNull(),
  rmaNumber: varchar("rma_number", { length: 32 }),
  centerId: varchar("center_id", { length: 32 }),
  labelUrl: text("label_url"),
  trackingNumber: varchar("tracking_number", { length: 64 }),
  pickupScheduled: timestamp("pickup_scheduled"),
  inspectionResults: jsonb("inspection_results"),
  approvedRefund: decimal("approved_refund", { precision: 10, scale: 2 }),
  disposition: varchar("disposition", { length: 24 }),
  refundTransactionId: varchar("refund_transaction_id", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const universalCapturedContracts = pgTable("universal_captured_contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  externalId: varchar("external_id", { length: 128 }).notNull(),
  source: varchar("source", { length: 48 }).notNull(),
  contractType: varchar("contract_type", { length: 24 }).notNull(),
  mode: varchar("mode", { length: 16 }).notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }),
  dynastyScore: integer("dynasty_score").notNull(),
  status: varchar("status", { length: 24 }).notNull().default("CAPTURED"),
  priority: varchar("priority", { length: 16 }),
  partnerId: varchar("partner_id", { length: 64 }),
  partnerType: varchar("partner_type", { length: 32 }),
  dynastyLoadId: varchar("dynasty_load_id", { length: 64 }),
  loadboardView: varchar("loadboard_view", { length: 24 }),
  captureReason: varchar("capture_reason", { length: 24 }),
  metadata: jsonb("metadata"),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  allocatedAt: timestamp("allocated_at"),
  routedAt: timestamp("routed_at"),
});

export const distributionPartners = pgTable("distribution_partners", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  modes: jsonb("modes"),
  regions: jsonb("regions"),
  capacity: jsonb("capacity"),
  pricing: jsonb("pricing"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalLoads: integer("total_loads").notNull().default(0),
  activeLoads: integer("active_loads").notNull().default(0),
  walletAddress: varchar("wallet_address", { length: 64 }),
  bscBalance: decimal("bsc_balance", { precision: 18, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const distributedLoads = pgTable("distributed_loads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  partnerId: varchar("partner_id", { length: 64 }).notNull(),
  sourceType: varchar("source_type", { length: 24 }).notNull(),
  sourceId: varchar("source_id", { length: 64 }).notNull(),
  mode: varchar("mode", { length: 16 }).notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 24 }).notNull().default("ASSIGNED"),
  strategy: varchar("strategy", { length: 24 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const mobileOperators = pgTable("mobile_operators", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: varchar("phone", { length: 24 }),
  homeBase: text("home_base").notNull(),
  homeCoords: jsonb("home_coords"),
  equipment: varchar("equipment", { length: 32 }),
  operatorType: varchar("operator_type", { length: 24 }).notNull().default("OWNER_OPERATOR"),
  status: varchar("status", { length: 24 }).notNull().default("ACTIVE"),
  notificationPrefs: jsonb("notification_prefs"),
  currentLocation: jsonb("current_location"),
  routeToHome: jsonb("route_to_home"),
  activeLoadId: varchar("active_load_id", { length: 64 }),
  walletAddress: varchar("wallet_address", { length: 64 }),
  bscBalance: decimal("bsc_balance", { precision: 18, scale: 8 }).default("0"),
  pushToken: text("push_token"),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loadNotifications = pgTable("load_notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  operatorId: varchar("operator_id", { length: 64 }).notNull(),
  loadId: varchar("load_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 24 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }),
  distance: decimal("distance", { precision: 10, scale: 2 }),
  deadheadMiles: decimal("deadhead_miles", { precision: 10, scale: 2 }),
  homeDirectionScore: integer("home_direction_score"),
  expiresAt: timestamp("expires_at"),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
  response: varchar("response", { length: 16 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bscBuybacks = pgTable("bsc_buybacks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  partnerId: varchar("partner_id", { length: 64 }).notNull(),
  partnerType: varchar("partner_type", { length: 24 }).notNull(),
  bscAmount: decimal("bsc_amount", { precision: 18, scale: 8 }).notNull(),
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }).notNull(),
  fiatCurrency: varchar("fiat_currency", { length: 8 }).notNull().default("USD"),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 8 }).notNull(),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  txHash: varchar("tx_hash", { length: 128 }),
  payoutMethod: varchar("payout_method", { length: 24 }),
  payoutDetails: jsonb("payout_details"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bridgeTransactions = pgTable("bridge_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  direction: varchar("direction", { length: 16 }).notNull(),
  sourceChain: varchar("source_chain", { length: 24 }).notNull(),
  destChain: varchar("dest_chain", { length: 24 }).notNull(),
  sourceToken: varchar("source_token", { length: 24 }).notNull(),
  destToken: varchar("dest_token", { length: 24 }).notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  bridgeFee: decimal("bridge_fee", { precision: 18, scale: 8 }),
  sourceTxHash: varchar("source_tx_hash", { length: 128 }),
  destTxHash: varchar("dest_tx_hash", { length: 128 }),
  status: varchar("status", { length: 24 }).notNull().default("INITIATED"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const fiatTransactions = pgTable("fiat_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 24 }).notNull(),
  cryptoAmount: decimal("crypto_amount", { precision: 18, scale: 8 }).notNull(),
  cryptoToken: varchar("crypto_token", { length: 24 }).notNull(),
  fiatAmount: decimal("fiat_amount", { precision: 12, scale: 2 }).notNull(),
  fiatCurrency: varchar("fiat_currency", { length: 8 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 8 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerTxId: varchar("provider_tx_id", { length: 128 }),
  status: varchar("status", { length: 24 }).notNull().default("PENDING"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const ecclesiaAnchors = pgTable("ecclesia_anchors", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  module: varchar("module", { length: 48 }).notNull(),
  category: varchar("category", { length: 32 }),
  localHash: varchar("local_hash", { length: 128 }).notNull(),
  ecclesiaScrollId: varchar("ecclesia_scroll_id", { length: 64 }),
  ecclesiaHash: varchar("ecclesia_hash", { length: 128 }),
  anchorStatus: varchar("anchor_status", { length: 24 }).notNull().default("PENDING"),
  retryCount: integer("retry_count").notNull().default(0),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  anchoredAt: timestamp("anchored_at"),
});

export const loadsRelations = relations(loads, ({ one }) => ({
  driver: one(drivers, {
    fields: [loads.driverId],
    references: [drivers.id],
  }),
  contract: one(contracts, {
    fields: [loads.contractId],
    references: [contracts.id],
  }),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  creditLine: one(creditLines, {
    fields: [drivers.id],
    references: [creditLines.driverId],
  }),
  loads: many(loads),
}));

export type Load = typeof loads.$inferSelect;
export type InsertLoad = typeof loads.$inferInsert;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;
export type CreditLine = typeof creditLines.$inferSelect;
export type InsertCreditLine = typeof creditLines.$inferInsert;
