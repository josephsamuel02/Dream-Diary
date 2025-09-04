// app/DiaryInput.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DiaryInputBody from '~/components/diaryInputBody';

export default function DiaryInput() {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [editable, setEditable] = useState(false);
  const maxLength = 5000;
  const [height] = useState(Dimensions.get('window').height - 160);

  // const insets = useSafeAreaInsets();

  // Open Camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert('Camera permission is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cozy_surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 p-2">
          {/* Title */}
          <View className="relative mb-2">
            {title.length === 0 && (
              <Text className="text-gray-300 absolute left-3 top-3 text-lg italic">
                Enter diary title...
              </Text>
            )}
            <TextInput
              className="rounded-lg border border-[#a09997de] p-3 font-roboto-medium text-xl font-semibold"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          {/* 
          /// Text Area 
          <ScrollView className="flex-1 py-5">
            <TextInput
              className="w-full rounded-lg px-2 py-5 font-roboto text-lg"
              placeholder="Write your diary..."
              placeholderTextColor="#9CA3AF"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={maxLength}
              editable={editable} // locked until toggle
              style={{ height }}
            />

            <View className="h-20" />
          </ScrollView> */}
          <DiaryInputBody />
          {/* Character Count */}
          <Text className="text-gray-500 mt-2 text-right text-sm">
            {content.length} / {maxLength}
          </Text>
        </View>

        {/* Floating Action Bar */}
        <View
          // style={{ paddingBottom: insets.bottom }} // keeps above nav bar
          className=" flex flex-row items-center justify-around bg-white p-2 shadow-md ">
          {/* Image Upload Icon */}
          <TouchableOpacity onPress={openCamera}>
            <Ionicons name="camera-outline" size={30} color="#D97706" />
          </TouchableOpacity>

          {/* Voice Record Icon */}
          <TouchableOpacity onPress={() => alert('Voice recording...')}>
            <MaterialIcons name="keyboard-voice" size={32} color="#D97706" />
          </TouchableOpacity>

          {/* Toggle Keyboard / Edit Mode */}
          <TouchableOpacity onPress={() => setEditable((prev) => !prev)}>
            <Ionicons
              name={editable ? 'close-circle' : 'create'}
              size={30}
              color={editable ? '#EF4444' : '#3B82F6'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
