import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { activities, categories, targets } from '../db/schema';

export type TargetInput = {
  userId: number;
  tripId: number;
  categoryId: number | null;
  period: 'weekly' | 'monthly';
  goal: number;
  title: string;
};

export async function getTargetsByTripId(tripId: number) {
  return await db.select().from(targets).where(eq(targets.tripId, tripId));
}

export async function getTargetById(targetId: number) {
  const result = await db.select().from(targets).where(eq(targets.id, targetId));
  return result[0] ?? null;
}

export async function createTarget(data: TargetInput) {
  await db.insert(targets).values({
    userId: data.userId,
    tripId: data.tripId,
    categoryId: data.categoryId,
    period: data.period,
    metricType: 'minutes',
    goal: data.goal,
    title: data.title.trim(),
  });
}

export async function updateTarget(
  targetId: number,
  data: Omit<TargetInput, 'userId'>
) {
  await db
    .update(targets)
    .set({
      tripId: data.tripId,
      categoryId: data.categoryId,
      period: data.period,
      metricType: 'minutes',
      goal: data.goal,
      title: data.title.trim(),
    })
    .where(eq(targets.id, targetId));
}

export async function deleteTarget(targetId: number) {
  await db.delete(targets).where(eq(targets.id, targetId));
}

export async function getCategoriesForTargetUser(userId: number) {
  return await db.select().from(categories).where(eq(categories.userId, userId));
}

export async function calculateTripTargetProgress(target: {
  tripId: number;
  categoryId: number | null;
  goal: number;
}) {
  let tripActivities;

  if (target.categoryId) {
    tripActivities = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.tripId, target.tripId),
          eq(activities.categoryId, target.categoryId)
        )
      );
  } else {
    tripActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.tripId, target.tripId));
  }

  const minuteActivities = tripActivities.filter(
    (activity) => activity.metricUnit === 'minutes'
  );

  const current = minuteActivities.reduce(
    (sum, activity) => sum + activity.metricValue,
    0
  );

  const remaining = Math.max(target.goal - current, 0);

  let status: 'Unmet' | 'Met' | 'Exceeded' = 'Unmet';
  if (current === target.goal) status = 'Met';
  if (current > target.goal) status = 'Exceeded';

  return { current, remaining, status };
}