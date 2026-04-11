import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { selectSettings, updateAccountProfile, updateProfilePhoto } from '~/store/slices/settingsSlice';

export default function Account() {
  const dispatch = useAppDispatch();
  const themeColors = useAppSelector(selectThemeColors);
  const settings = useAppSelector(selectSettings);

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(settings.username);
  const [email, setEmail] = useState(settings.email);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    } as any);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      dispatch(updateProfilePhoto(result.assets[0].uri));
    }
  };

  const handleSaveProfile = () => {
    dispatch(updateAccountProfile({ username, email }));
    setIsEditing(false);
  };

  return (
    <ScrollView className="flex-1 px-4 pt-6" style={{ backgroundColor: themeColors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* Profile Card */}
      <View className="mb-6 items-center rounded-3xl bg-white p-6 shadow-sm shadow-gray-200">
        
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} className="relative mb-4">
          <View className="h-28 w-28 overflow-hidden rounded-full border-4" style={{ borderColor: themeColors.accent + '20', backgroundColor: themeColors.surface }}>
            {settings.profilePhoto ? (
               <Image source={{ uri: settings.profilePhoto }} className="h-full w-full" />
            ) : (
               <View className="h-full w-full items-center justify-center bg-gray-100">
                 <Ionicons name="person" size={54} color="#d1d5db" />
               </View>
            )}
          </View>
          <View className="absolute bottom-0 right-0 rounded-full border-2 border-white p-2" style={{ backgroundColor: themeColors.accent }}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {!isEditing ? (
          <>
            <Text className="text-center font-poppins-bold text-2xl text-gray-800">{settings.username}</Text>
            <Text className="text-center font-roboto text-gray-500">{settings.email}</Text>
            
            <TouchableOpacity 
              onPress={() => setIsEditing(true)}
              className="mt-6 w-full flex-row items-center justify-center rounded-2xl py-3"
              style={{ backgroundColor: themeColors.accent + '15' }}
            >
              <Ionicons name="pencil" size={18} color={themeColors.accent} className="mr-2" />
              <Text className="font-poppins-bold" style={{ color: themeColors.accent }}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View className="w-full">
            <Text className="mb-1 font-roboto-medium text-xs text-gray-500">Username</Text>
            <TextInput 
              value={username}
              onChangeText={setUsername}
              className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-roboto text-gray-800"
              placeholderTextColor="#9ca3af"
            />
            
            <Text className="mb-1 font-roboto-medium text-xs text-gray-500">Email Address</Text>
            <TextInput 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-roboto text-gray-800"
              placeholderTextColor="#9ca3af"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => {
                  setUsername(settings.username);
                  setEmail(settings.email);
                  setIsEditing(false);
                }}
                className="flex-1 items-center rounded-2xl bg-gray-100 py-3"
              >
                <Text className="font-poppins-bold text-gray-600">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleSaveProfile}
                className="flex-1 items-center rounded-2xl py-3"
                style={{ backgroundColor: themeColors.accent }}
              >
                <Text className="font-poppins-bold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Data Management Section */}
      <View className="mb-12 rounded-3xl bg-white p-5 shadow-sm shadow-gray-200">
        <View className="mb-4 flex-row items-center">
          <View className="mr-3 rounded-xl bg-blue-50 p-2">
            <Ionicons name="server" size={20} color="#3b82f6" />
          </View>
          <Text className="font-poppins-bold text-lg text-gray-800">Data Management</Text>
        </View>

        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Cloud syncing will be available in a future update.')} activeOpacity={0.7} className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
           <View>
             <Text className="font-roboto-medium text-[15px] text-gray-800">Cloud Sync</Text>
             <Text className="font-roboto text-xs text-gray-500">Backup your entries securely to the cloud</Text>
           </View>
           <Ionicons name="cloud-upload-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Export feature is currently in development.')} activeOpacity={0.7} className="flex-row items-center justify-between">
           <View>
             <Text className="font-roboto-medium text-[15px] text-gray-800">Export Diary</Text>
             <Text className="font-roboto text-xs text-gray-500">Download your personal entries as PDF or CSV</Text>
           </View>
           <Ionicons name="document-text-outline" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      
    </ScrollView>
  );
}
