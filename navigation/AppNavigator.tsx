import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login';
import Register from '../screens/Register';
import Trips from '../screens/Trips';
import Activities from '../screens/Activities';
import Categories from '../screens/Categories';
import Targets from '../screens/Targets';
import Insights from '../screens/Insights';
import Profile from '../screens/Profile';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
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