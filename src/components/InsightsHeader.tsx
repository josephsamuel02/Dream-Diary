import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

const InsightsHeader = () => {
  const router = useRouter();
  const themeColors = useAppSelector(selectThemeColors);

  return (
    <View style={[styles.header, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { backgroundColor: themeColors.surface }]}>
        <Ionicons name="chevron-back" size={20} color={themeColors.text} />
      </TouchableOpacity>
      
      <Text style={[styles.title, { color: themeColors.text }]}>Insights</Text>
      
      <View style={{ width: 36 }} />
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
});

export default InsightsHeader;
