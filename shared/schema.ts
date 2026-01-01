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
