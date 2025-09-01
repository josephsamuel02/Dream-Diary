// components/CustomTab.tsx
import {  TouchableOpacity, Text } from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const MainTab = ({ navigation }: any) => {
  return (
    <LinearGradient
      colors={['#F5EDE0', '#D97706']} // cozy brown → white
      locations={[0, 0.5]} // brown stops at 70%, white takes the rest
      start={{ x: 0.5, y: 0 }} // top center
      end={{ x: 0.5, y: 1 }} // bottom center
      className="flex-row items-center justify-around rounded-t-3xl py-3 pb-20 shadow-lg">
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
    </LinearGradient>
  );
};

export default MainTab;
