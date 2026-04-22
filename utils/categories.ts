import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { categories } from '../db/schema';

export type CategoryInput = {
  userId: number;
  name: string;
  color: string;
  icon: string;
};

export async function getCategoriesByUserId(userId: number) {
  return await db.select().from(categories).where(eq(categories.userId, userId));
}

export async function getCategoryById(categoryId: number) {
  const result = await db.select().from(categories).where(eq(categories.id, categoryId));
  return result[0] ?? null;
}

export async function createCategory(data: CategoryInput) {
  await db.insert(categories).values({
    userId: data.userId,
    name: data.name.trim(),
    color: data.color.trim(),
    icon: data.icon.trim(),
  });
}

export async function updateCategory(
  categoryId: number,
  data: Omit<CategoryInput, 'userId'>
) {
  await db
    .update(categories)
    .set({
      name: data.name.trim(),
      color: data.color.trim(),
      icon: data.icon.trim(),
    })
    .where(eq(categories.id, categoryId));
}

export async function deleteCategory(categoryId: number) {
  await db.delete(categories).where(eq(categories.id, categoryId));
}