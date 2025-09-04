// components/CustomTab.tsx
import { TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const MainTab = () => {
  const router = useRouter();

  return (
    <View className=" absolute bottom-0 right-0 z-20 ml-auto w-28 flex-col items-center justify-around  gap-y-3 ">
      {/* Camera */}
      <TouchableOpacity
        className="items-center"
        //   onPress={() => navigation.navigate('index')}
      >
        <Feather
          name="camera"
          size={24}
          className="items-center rounded-full bg-white p-3 text-cozy_accent shadow-md"
        />
      </TouchableOpacity>

      {/* Voice */}
      <TouchableOpacity
        className="items-center"
        //   onPress={() => navigation.navigate('About/index')}
      >
        <Ionicons
          name="mic-outline"
          size={30}
          className="items-center rounded-full bg-white p-3 text-cozy_accent shadow-md"
        />
      </TouchableOpacity>

      {/* Add Text */}
      <TouchableOpacity
        onPress={() => router.push('/DiaryInput')}
        className="mb-8 items-center justify-center rounded-full bg-[#ffffff] p-3  shadow-md "
        style={{ width: 'auto', height: 'auto' }}>
        <Ionicons
          name="add-outline"
          size={55}
          color="#252525"
          className="  items-center rounded-full shadow-lg"
        />
      </TouchableOpacity>
    </View>
  );
};

export default MainTab;
