import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
const CustomHeader = () => {
  return (
    <View className="bg-cozy_accent h-32 w-full flex-col px-2 py-4 pt-6 ">
      <View className="my-4 flex h-auto w-full flex-row justify-end  ">
        <TouchableOpacity className="mx-1">
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            alert('Menu clicked!');
          }}
          className="mx-1">
          <Entypo name="dots-three-vertical" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <Text className="text-text-cozy font-arizonia text-xl">Dream Diary</Text>
    </View>
  );
};

export default CustomHeader;
