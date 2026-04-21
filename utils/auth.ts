import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { users } from '../db/schema';

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export async function registerUser({ name, email, password }: RegisterInput) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));

  if (existing.length > 0) {
    throw new Error('An account with this email already exists.');
  }

  await db.insert(users).values({
    name: name.trim(),
    email: normalizedEmail,
    password: password.trim(),
    createdAt: new Date().toISOString(),
  });

  const createdUser = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));

  if (createdUser.length === 0) {
    throw new Error('Failed to create account.');
  }

  return createdUser[0];
}

export async function loginUser({ email, password }: LoginInput) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail));

  if (result.length === 0) {
    throw new Error('No account found for this email.');
  }

  const user = result[0];

  if (user.password !== password.trim()) {
    throw new Error('Incorrect password.');
  }

  return user;
}

export async function getUserById(userId: number) {
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0] ?? null;
}

export async function deleteUserById(userId: number) {
  await db.delete(users).where(eq(users.id, userId));
}