import { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { db } from './db/client';
import { activities, categories, targets, trips, users } from './db/schema';
import { seedDatabaseIfEmpty } from './db/seed';

type Counts = {
  users: number;
  trips: number;
  categories: number;
  activities: number;
  targets: number;
};

export default function App() {
  const [message, setMessage] = useState('Loading...');
  const [counts, setCounts] = useState<Counts>({
    users: 0,
    trips: 0,
    categories: 0,
    activities: 0,
    targets: 0,
  });

  useEffect(() => {
    async function init() {
      try {
        await seedDatabaseIfEmpty();

        const userRows = await db.select().from(users);
        const tripRows = await db.select().from(trips);
        const categoryRows = await db.select().from(categories);
        const activityRows = await db.select().from(activities);
        const targetRows = await db.select().from(targets);

        setCounts({
          users: userRows.length,
          trips: tripRows.length,
          categories: categoryRows.length,
          activities: activityRows.length,
          targets: targetRows.length,
        });

        setMessage('Trip Planner database ready');
      } catch (error) {
        console.error('Database init error:', error);
        setMessage('Database setup failed');
      }
    }

    init();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <View style={{ width: '100%', maxWidth: 320 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 12 }}>
          Trip Planner Setup
        </Text>

        <Text style={{ fontSize: 16, marginBottom: 16 }}>{message}</Text>

        <Text style={{ fontSize: 16, marginBottom: 6 }}>Users: {counts.users}</Text>
        <Text style={{ fontSize: 16, marginBottom: 6 }}>Trips: {counts.trips}</Text>
        <Text style={{ fontSize: 16, marginBottom: 6 }}>Categories: {counts.categories}</Text>
        <Text style={{ fontSize: 16, marginBottom: 6 }}>Activities: {counts.activities}</Text>
        <Text style={{ fontSize: 16, marginBottom: 6 }}>Targets: {counts.targets}</Text>
      </View>
    </SafeAreaView>
  );
}