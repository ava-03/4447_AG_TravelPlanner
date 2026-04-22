import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { activities, categories, trips } from '../db/schema';

export async function getTripInsights(tripId: number) {
  const tripActivities = await db.select().from(activities).where(eq(activities.tripId, tripId));

  const trip = await db.select().from(trips).where(eq(trips.id, tripId));
  const currentTrip = trip[0];

  if (!currentTrip) {
    throw new Error('Trip not found.');
  }

  const tripCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, currentTrip.userId));

  const categoryMap = Object.fromEntries(
    tripCategories.map((category: { id: number; name: string }) => [category.id, category.name])
  ) as Record<number, string>;

  const minuteActivities = tripActivities.filter(
    (activity: { metricUnit: string }) => activity.metricUnit === 'minutes'
  );

  const totalMinutes = minuteActivities.reduce(
    (sum: number, activity: { metricValue: number }) => sum + activity.metricValue,
    0
  );

  const totalActivities = tripActivities.length;

  const completedActivities = tripActivities.filter(
    (activity: { isCompleted: number }) => activity.isCompleted === 1
  ).length;

  const minutesByCategoryMap: Record<string, number> = {};

  minuteActivities.forEach(
    (activity: { categoryId: number; metricValue: number }) => {
      const categoryName = categoryMap[activity.categoryId] ?? 'Unknown';

      if (!minutesByCategoryMap[categoryName]) {
        minutesByCategoryMap[categoryName] = 0;
      }

      minutesByCategoryMap[categoryName] += activity.metricValue;
    }
  );

  const minutesByCategory = Object.entries(minutesByCategoryMap).map(
    ([name, minutes]) => ({
      name,
      minutes,
    })
  );

  let busiestCategory = 'None';

  if (minutesByCategory.length > 0) {
    const topCategory = [...minutesByCategory].sort((a, b) => b.minutes - a.minutes)[0];
    busiestCategory = topCategory.name;
  }

  return {
    totalMinutes,
    totalActivities,
    completedActivities,
    busiestCategory,
    minutesByCategory,
  };
}