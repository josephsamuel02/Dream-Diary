import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { LinearGradient } from 'expo-linear-gradient';
const CustomHeader = () => {
  return (
    <LinearGradient
      colors={['#D97706', '#F5EDE0']} // cozy brown → white
      start={{ x: 0.5, y: 0 }} // top center
      end={{ x: 0.5, y: 1 }} // bottom center
      className="h-36 w-full flex-col px-2 pt-1">
      <View className="my-4 mt-10 flex h-auto w-full flex-row justify-end">
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

      <Text className="font-arizonia text-2xl font-bold text-cozy_text">Dream Diary</Text>
    </LinearGradient>
  );
};

export default CustomHeader;
