import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { activities, categories, trips } from '../db/schema';

export type ActivityInput = {
  tripId: number;
  categoryId: number;
  title: string;
  date: string;
  metricValue: number;
  metricUnit: string;
  notes?: string;
  isCompleted: number;
};

export async function getActivitiesByUserId(userId: number) {
  const userTrips = await db.select().from(trips).where(eq(trips.userId, userId));

  if (userTrips.length === 0) return [];

  const tripIds = userTrips.map((trip) => trip.id);

  return await db.select().from(activities).where(inArray(activities.tripId, tripIds));
}

export async function getActivityById(activityId: number) {
  const result = await db.select().from(activities).where(eq(activities.id, activityId));
  return result[0] ?? null;
}

export async function createActivity(data: ActivityInput) {
  await db.insert(activities).values({
    tripId: data.tripId,
    categoryId: data.categoryId,
    title: data.title.trim(),
    date: data.date.trim(),
    metricValue: data.metricValue,
    metricUnit: data.metricUnit.trim(),
    notes: data.notes?.trim() || null,
    isCompleted: data.isCompleted,
  });
}

export async function updateActivity(activityId: number, data: ActivityInput) {
  await db
    .update(activities)
    .set({
      tripId: data.tripId,
      categoryId: data.categoryId,
      title: data.title.trim(),
      date: data.date.trim(),
      metricValue: data.metricValue,
      metricUnit: data.metricUnit.trim(),
      notes: data.notes?.trim() || null,
      isCompleted: data.isCompleted,
    })
    .where(eq(activities.id, activityId));
}

export async function deleteActivity(activityId: number) {
  await db.delete(activities).where(eq(activities.id, activityId));
}

export async function getTripsForUser(userId: number) {
  return await db.select().from(trips).where(eq(trips.userId, userId));
}

export async function getCategoriesForUser(userId: number) {
  return await db.select().from(categories).where(eq(categories.userId, userId));
}

export async function getActivitiesByTripId(tripId: number) {
  return await db.select().from(activities).where(eq(activities.tripId, tripId));
}

export async function getCategoryMapForUser(userId: number) {
  const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));

  return Object.fromEntries(
    userCategories.map((category) => [category.id, category.name])
  ) as Record<number, string>;
}