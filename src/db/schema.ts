import { pgTable, text, serial, timestamp, varchar, decimal, integer, boolean, json } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const companies = pgTable('companies', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  contactEmail: varchar('contact_email', { length: 255 }),
  branding: json('branding'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const packages = pgTable('packages', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  validitySeconds: integer('validity_seconds'),
  dataLimitBytes: text('data_limit_bytes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const vouchers = pgTable('vouchers', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  packageId: text('package_id').references(() => packages.id),
  code: varchar('code', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).default('active'),
  usedBy: varchar('used_by', { length: 255 }),
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const routers = pgTable('routers', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 100 }),
  secretKey: varchar('secret_key', { length: 255 }),
  status: varchar('status', { length: 50 }).default('offline'),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  companyId: text('company_id').references(() => companies.id).notNull(),
  userId: text('user_id').references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  gateway: varchar('gateway', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow(),
});