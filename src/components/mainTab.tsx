// components/CustomTab.tsx
import { View, TouchableOpacity, Text } from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';

const MainTab = ({ navigation }: any) => {
  return (
    <View className="bg-cozy_accent flex-row items-center justify-around rounded-t-3xl py-3 pb-20 shadow-lg">
      {/* Home */}
      <TouchableOpacity
        className="items-center"

        //   onPress={() => navigation.navigate('index')}
      >
        <Feather name="camera" size={26} color="white" />
        <Text className="text-xs text-white">Image</Text>
      </TouchableOpacity>

      {/* Upload */}
      <TouchableOpacity
      //    onPress={() => navigation.navigate('Home/index')}
      >
        <AntDesign name="pluscircle" size={68} color="white" />
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        className="items-center"

        //   onPress={() => navigation.navigate('About/index')}
      >
        <Ionicons name="mic-outline" size={30} color="white" />
        <Text className="text-xs text-white">Voice</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MainTab;
