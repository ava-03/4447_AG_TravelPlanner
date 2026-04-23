import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { packingItems } from '../db/schema';

export async function getPackingItemsByTripId(tripId: number) {
  return await db
    .select()
    .from(packingItems)
    .where(eq(packingItems.tripId, tripId));
}

export async function createPackingItem(tripId: number, title: string) {
  await db.insert(packingItems).values({
    tripId,
    title: title.trim(),
    isChecked: 0,
  });
}

export async function togglePackingItem(itemId: number, isChecked: number) {
  await db
    .update(packingItems)
    .set({
      isChecked: isChecked === 1 ? 0 : 1,
    })
    .where(eq(packingItems.id, itemId));
}

export async function deletePackingItem(itemId: number) {
  await db.delete(packingItems).where(eq(packingItems.id, itemId));
}