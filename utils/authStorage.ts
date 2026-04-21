import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_ID_KEY = 'currentUserId';

export async function setCurrentUserId(userId: number) {
  await AsyncStorage.setItem(CURRENT_USER_ID_KEY, String(userId));
}

export async function getCurrentUserId(): Promise<number | null> {
  const value = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);

  if (!value) return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function clearCurrentUserId() {
  await AsyncStorage.removeItem(CURRENT_USER_ID_KEY);
}