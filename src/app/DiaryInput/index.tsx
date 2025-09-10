// app/DiaryInput.tsx
import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DiaryInputBody from '~/components/diaryInputBody';

export default function DiaryInput() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const maxLength = 5000;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1 p-2">
          {/* Title */}
          <View className="relative mb-2">
            {title.length === 0 && (
              <Text className="text-gray-300 absolute left-3 top-3 text-lg ">Title...</Text>
            )}
            <TextInput
              className="rounded-lg border border-[#a09997de] p-3 font-roboto-medium text-xl font-semibold"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <DiaryInputBody />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
