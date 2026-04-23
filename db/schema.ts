import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('created_at').notNull(),
});

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  notes: text('notes'),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
});

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id').notNull(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  metricValue: integer('metric_value').notNull(),
  metricUnit: text('metric_unit').notNull(),
  notes: text('notes'),
  isCompleted: integer('is_completed').notNull().default(0),
});

export const targets = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id'),
  period: text('period').notNull(),
  metricType: text('metric_type').notNull(),
  goal: integer('goal').notNull(),
  title: text('title').notNull(),
});

export const packingItems = sqliteTable('packing_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  title: text('title').notNull(),
  isChecked: integer('is_checked').notNull().default(0),
});