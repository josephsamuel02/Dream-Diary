import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { clearAll } from '~/store/slices/notificationSlice';

const NotificationsHeader = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const themeColors = useAppSelector(selectThemeColors);

  return (
    <View style={[styles.header, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { backgroundColor: themeColors.surface }]}>
        <Ionicons name="chevron-back" size={20} color={themeColors.text} />
      </TouchableOpacity>
      
      <Text style={[styles.title, { color: themeColors.text }]}>Notifications</Text>
      
      <TouchableOpacity
        onPress={() => dispatch(clearAll())}
        style={[styles.clearButton, { backgroundColor: themeColors.surface }]}>
        <Ionicons name="trash-outline" size={18} color={themeColors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationsHeader;
