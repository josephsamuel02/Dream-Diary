import { Tabs } from 'expo-router';
import { FontAwesome6, Fontisto, Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
export default function Layout() {
  const iconSize = 20;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: 'dodgerblue' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'normal', fontSize: 18, padding: 0 },
        tabBarActiveTintColor: 'dodgerblue', // active icon/text color
        tabBarInactiveTintColor: 'gray', // inactive color
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Welcome',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/Explore/index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Fontisto name="search" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="screens/Home/index"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color }) => <Feather name="upload" size={iconSize} color={color} />,
        }}
      />

      <Tabs.Screen
        name="screens/About/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <FontAwesome6 name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
