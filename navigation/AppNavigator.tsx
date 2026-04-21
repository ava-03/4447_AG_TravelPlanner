import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';

import Activities from '../screens/Activities';
import Categories from '../screens/Categories';
import Insights from '../screens/Insights';
import Login from '../screens/Login';
import Profile from '../screens/Profile';
import Register from '../screens/Register';
import Targets from '../screens/Targets';
import Trips from '../screens/Trips';
import { getCurrentUserId } from '../utils/authStorage';

const Stack = createNativeStackNavigator();

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
        <Stack.Screen name="Activities" component={Activities} />
        <Stack.Screen name="Categories" component={Categories} />
        <Stack.Screen name="Targets" component={Targets} />
        <Stack.Screen name="Insights" component={Insights} />
        <Stack.Screen name="Profile" component={Profile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}