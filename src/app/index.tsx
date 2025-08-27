// app/index.tsx
import { View, Text } from 'react-native';
import MainTab from '~/components/mainTab';

export default function Index({ navigation }: any) {
  return (
    <View className="flex-1 bg-cozy_background">
      {/* Screen content */}

      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold">Dream Diary</Text>
      </View>

      {/* Custom tab at bottom */}
      <MainTab navigation={navigation} />
    </View>
  );
}
