import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { LinearGradient } from 'expo-linear-gradient';
const CustomHeader = () => {
  return (
    <LinearGradient
      colors={['#D97706', '#F5EDE0']} // cozy brown → white
       locations={[0, 0.99]} // brown stops at 70%, white takes the rest
      start={{ x: 0.5, y: 0 }} // top center
      end={{ x: 0.5, y: 1 }} // bottom center
      className="flex h-36 w-full flex-row items-center justify-between px-2 pt-1">
      <Text className="font-arizonia text-2xl font-bold text-cozy_text">Dream Diary</Text>

      <View className=" flex h-auto w-auto flex-row items-center justify-end">
        <TouchableOpacity className="mx-1">
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            alert('Menu clicked!');
          }}
          className="mx-1">
          <Entypo name="dots-three-vertical" size={21} color="white" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default CustomHeader;
