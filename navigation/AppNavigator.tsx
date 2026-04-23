import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/Login';
import Register from '../screens/Register';
import Trips from '../screens/Trips';
import AddTrip from '../screens/AddTrip';
import EditTrip from '../screens/EditTrip';
import TripDetails from '../screens/TripDetails';
import Categories from '../screens/Categories';
import AddCategory from '../screens/AddCategory';
import EditCategory from '../screens/EditCategory';
import Insights from '../screens/Insights';
import Profile from '../screens/Profile';
import AddActivity from '../screens/AddActivity';
import EditActivity from '../screens/EditActivity';
import AddTarget from '../screens/AddTarget';
import EditTarget from '../screens/EditTarget';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

function AppNavigatorInner() {
  const { colors } = useTheme();

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.header,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.header },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Login" component={Login as any} />
        <Stack.Screen name="Register" component={Register as any} />
        <Stack.Screen name="Trips" component={Trips as any} options={{ title: 'My Trips' }} />
        <Stack.Screen name="AddTrip" component={AddTrip as any} options={{ title: 'Add Trip' }} />
        <Stack.Screen name="EditTrip" component={EditTrip as any} options={{ title: 'Edit Trip' }} />
        <Stack.Screen name="TripDetails" component={TripDetails as any} options={{ title: 'Trip Details' }} />
        <Stack.Screen name="Categories" component={Categories as any} />
        <Stack.Screen name="AddCategory" component={AddCategory as any} />
        <Stack.Screen name="EditCategory" component={EditCategory as any} />
        <Stack.Screen name="Insights" component={Insights as any} />
        <Stack.Screen name="Profile" component={Profile as any} />
        <Stack.Screen name="AddActivity" component={AddActivity as any} />
        <Stack.Screen name="EditActivity" component={EditActivity as any} />
        <Stack.Screen name="AddTarget" component={AddTarget as any} />
        <Stack.Screen name="EditTarget" component={EditTarget as any} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <ThemeProvider>
      <AppNavigatorInner />
    </ThemeProvider>
  );
}