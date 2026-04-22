import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { trips } from '../db/schema';

export type TripInput = {
  userId: number;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

export async function getTripsByUserId(userId: number) {
  return await db.select().from(trips).where(eq(trips.userId, userId));
}

export async function getTripById(tripId: number) {
  const result = await db.select().from(trips).where(eq(trips.id, tripId));
  return result[0] ?? null;
}

export async function createTrip(data: TripInput) {
  await db.insert(trips).values({
    userId: data.userId,
    name: data.name.trim(),
    destination: data.destination.trim(),
    startDate: data.startDate.trim(),
    endDate: data.endDate.trim(),
    notes: data.notes?.trim() || null,
  });
}

export async function updateTrip(
  tripId: number,
  data: Omit<TripInput, 'userId'>
) {
  await db
    .update(trips)
    .set({
      name: data.name.trim(),
      destination: data.destination.trim(),
      startDate: data.startDate.trim(),
      endDate: data.endDate.trim(),
      notes: data.notes?.trim() || null,
    })
    .where(eq(trips.id, tripId));
}

export async function deleteTrip(tripId: number) {
  await db.delete(trips).where(eq(trips.id, tripId));
}