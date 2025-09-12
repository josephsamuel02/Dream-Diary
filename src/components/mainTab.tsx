import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// redux
import { useAppDispatch } from '~/store/hooks';
import { addEntry } from '~/store/slices/diarySlice';

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const MainTab = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const createAndOpenNewEntry = () => {
    const id = genId();
    const todayIso = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    // create empty entry for today (title optional)
    dispatch(
      addEntry({
        id,
        date: todayIso,
        title: '',
      })
    );
    // navigate to DiaryInput and pass the entryId as a query param
    router.push(`/DiaryInput?entryId=${encodeURIComponent(id)}`);
  };

  return (
    <View className=" absolute bottom-0 right-0 z-20 ml-auto w-28 flex-col items-center justify-around  gap-y-3 ">
      {/* Camera */}
      <TouchableOpacity className="items-center">
        <Feather
          name="camera"
          size={24}
          className="items-center rounded-full bg-white p-3 text-cozy_accent shadow-md"
        />
      </TouchableOpacity>

      <TouchableOpacity className="items-center">
        <Ionicons
          name="mic-outline"
          size={30}
          className="items-center rounded-full bg-white p-3 text-cozy_accent shadow-md"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={createAndOpenNewEntry}
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
