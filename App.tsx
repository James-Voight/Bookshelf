import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { ImportScreen } from './src/screens/ImportScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { BarcodeScannerScreen } from './src/screens/BarcodeScannerScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { SubscriptionScreen } from './src/screens/SubscriptionScreen';
import { RecommendationsScreen } from './src/screens/RecommendationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Library':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Insights':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Import':
              iconName = focused ? 'download' : 'download-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1c1c1e' : '#fff',
          borderTopColor: isDark ? '#333' : '#e0e0e0',
        },
      })}
    >
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Import" component={ImportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {/* Main App */}
            <Stack.Screen name="Main" component={TabNavigator} />
        
            {/* Book Detail */}
            <Stack.Screen 
              name="BookDetail" 
              component={BookDetailScreen}
              options={{ presentation: 'card' }}
            />
        
            {/* Barcode Scanner */}
            <Stack.Screen 
              name="BarcodeScanner" 
              component={BarcodeScannerScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
        
            {/* Subscription Screen */}
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{ presentation: 'card' }}
            />

            {/* Recommendations Screen */}
            <Stack.Screen 
              name="Recommendations" 
              component={RecommendationsScreen}
              options={{ presentation: 'card' }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen}
            options={{ presentation: 'modal' }}
          />
        )}
      </Stack.Navigator>
    </>
  );
}

const MAX_MOBILE_WIDTH = 430;

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.outerContainer, isDark && styles.outerContainerDark]}>
      <View style={styles.mobileContainer}>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerContainerDark: {
    backgroundColor: '#1a1a1a',
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? MAX_MOBILE_WIDTH : undefined,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web' ? {
      height: '100%',
      maxHeight: 932,
      borderRadius: 0,
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(0,0,0,0.3)',
    } : {}),
  },
});
