import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Auth from './src/screens/Auth';
import Users from './src/screens/Users';
import Chat from './src/screens/Chat';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Auth" 
          component={Auth} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Users" 
          component={Users} 
          options={{ title: 'Select User' }}
        />
        <Stack.Screen 
          name="Chat" 
          component={Chat} 
          options={({ route }: any) => ({ 
            title: route.params?.other?.name || 'Chat' 
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
