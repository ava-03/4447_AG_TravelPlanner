import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import Activities from '../screens/Activities';
import AddActivity from '../screens/AddActivity';
import AddCategory from '../screens/AddCategory';
import AddTrip from '../screens/AddTrip';
import Categories from '../screens/Categories';
import EditActivity from '../screens/EditActivity';
import EditCategory from '../screens/EditCategory';
import EditTrip from '../screens/EditTrip';
import Insights from '../screens/Insights';
import Login from '../screens/Login';
import Profile from '../screens/Profile';
import Register from '../screens/Register';
import Targets from '../screens/Targets';
import TripDetails from '../screens/TripDetails';
import Trips from '../screens/Trips';
import { getCurrentUserId } from '../utils/authStorage';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Trips: undefined;
  TripDetails: { tripId: number };
  AddTrip: undefined;
  EditTrip: { tripId: number };
  Activities: undefined;
  AddActivity: { tripId?: number } | undefined;
  EditActivity: { activityId: number };
  Categories: undefined;
  AddCategory: undefined;
  EditCategory: { categoryId: number };
  Targets: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Trips' | null>(null);

  useEffect(() => {
    async function loadSession() {
      const userId = await getCurrentUserId();
      setInitialRoute(userId ? 'Trips' : 'Login');
    }

    loadSession();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Trips" component={Trips} />
        <Stack.Screen name="TripDetails" component={TripDetails} options={{ title: 'Trip Details' }} />
        <Stack.Screen name="AddTrip" component={AddTrip} options={{ title: 'Add Trip' }} />
        <Stack.Screen name="EditTrip" component={EditTrip} options={{ title: 'Edit Trip' }} />
        <Stack.Screen name="Activities" component={Activities} />
        <Stack.Screen name="AddActivity" component={AddActivity} options={{ title: 'Add Activity' }} />
        <Stack.Screen name="EditActivity" component={EditActivity} options={{ title: 'Edit Activity' }} />
        <Stack.Screen name="Categories" component={Categories} />
        <Stack.Screen name="AddCategory" component={AddCategory} options={{ title: 'Add Category' }} />
        <Stack.Screen name="EditCategory" component={EditCategory} options={{ title: 'Edit Category' }} />
        <Stack.Screen name="Targets" component={Targets} />
        <Stack.Screen name="Insights" component={Insights} />
        <Stack.Screen name="Profile" component={Profile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}