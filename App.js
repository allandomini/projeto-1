import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './LoginScreen';
import Home from './Home';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  // Verifica se há um usuário logado ao iniciar o app
  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const loggedInUser = await AsyncStorage.getItem('@loggedInUser');
        if (loggedInUser) {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('Erro ao verificar usuário logado:', error);
        setInitialRoute('Login');
      }
    };
    checkLoggedInUser();
  }, []);

  if (initialRoute === null) {
    // Mostra um loading enquanto verifica o estado de login
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{ 
          headerShown: false,
          contentStyle: {
            flex: 1,
            backgroundColor: '#FFFFFF'
          }
        }}
      >
        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Home"
          options={{
            contentStyle: {
              flex: 1,
              backgroundColor: '#FFFFFF'
            }
          }}
        >
          {(props) => <Home {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}