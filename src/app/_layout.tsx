// app/_layout.tsx
import { Stack } from 'expo-router';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Arizonia_400Regular } from '@expo-google-fonts/arizonia';

import '../../global.css';
import CustomHeader from '../components/mainNav';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: Poppins_400Regular,
    PoppinsBold: Poppins_700Bold,
    RobotoRegular: Roboto_400Regular,
    RobotoMedium: Roboto_500Medium,
    Arizonia: Arizonia_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: '#fff',
        // headerTitleStyle: { fontWeight: 'normal', fontSize: 18 },
        // headerShown: false
      }}>
      {/* Screens */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Dream Diary',
          header: () => <CustomHeader />,
        }}
      />
      <Stack.Screen
        name="Home/index"
        options={{
          title: 'Upload',
        }}
      />
      <Stack.Screen
        name="About/index"
        options={{
          title: 'Profile',
        }}
      />
    </Stack>
  );
}
