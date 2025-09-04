// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { Arizonia_400Regular } from '@expo-google-fonts/arizonia';

import '../../global.css';
import CustomHeader from '../components/mainNav';
import DiaryInputHeader from '~/components/diaryInputHeader';

export default function Layout() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: Poppins_400Regular,
    PoppinsBold: Poppins_700Bold,
    RobotoRegular: Roboto_400Regular,
    RobotoMedium: Roboto_500Medium,
    Arizonia: Arizonia_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              header: () => <CustomHeader />,
            }}
          />
          <Stack.Screen
            name="DiaryInput/index"
            options={{
              title: 'Diary input',
              header: ({ navigation }) => <DiaryInputHeader navigation={navigation} />,
            }}
          />
          <Stack.Screen name="Home/index" options={{ title: 'Upload' }} />
          <Stack.Screen name="About/index" options={{ title: 'Profile' }} />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
