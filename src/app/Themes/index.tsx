import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Slider from '@react-native-community/slider';

import { useAppDispatch, useAppSelector } from '~/store/hooks';
import {
  setTheme,
  setBackgroundImage,
  setBackgroundOpacity,
  clearBackgroundImage,
  selectCurrentTheme,
  selectBackgroundImage,
  selectBackgroundOpacity,
  THEMES,
  ThemeKey,
} from '~/store/slices/themeSlice';

const THEME_OPTIONS: { key: ThemeKey; name: string; emoji: string }[] = [
  { key: 'cozy', name: 'Cozy', emoji: '🍂' },
  { key: 'clean', name: 'Clean', emoji: '✨' },
  { key: 'dreamy', name: 'Dreamy', emoji: '🌙' },
  { key: 'nature', name: 'Nature', emoji: '🌿' },
  { key: 'warm', name: 'Warm', emoji: '☀️' },
  { key: 'dark', name: 'Dark', emoji: '🌑' },
];

const MEDIA_DIR = `${FileSystem.documentDirectory}theme_backgrounds/`;

const ensureMediaDir = async () => {
  try {
    const info = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  } catch (e) {
    console.warn('ensureMediaDir error', e);
  }
};

export default function ThemesScreen() {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const backgroundImage = useAppSelector(selectBackgroundImage);
  const backgroundOpacity = useAppSelector(selectBackgroundOpacity);
  const [loading, setLoading] = useState(false);

  const handleThemeSelect = (themeKey: ThemeKey) => {
    dispatch(setTheme(themeKey));
  };

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to set a background image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        setLoading(true);
        await ensureMediaDir();
        
        const uri = result.assets[0].uri;
        const filename = `bg_${Date.now()}.jpg`;
        const dest = `${MEDIA_DIR}${filename}`;
        
        await FileSystem.copyAsync({ from: uri, to: dest });
        dispatch(setBackgroundImage(dest));
        setLoading(false);
      }
    } catch (e) {
      console.error('Pick image error:', e);
      setLoading(false);
      Alert.alert('Error', 'Failed to set background image');
    }
  };

  const handleRemoveBackground = () => {
    Alert.alert(
      'Remove Background',
      'Are you sure you want to remove the background image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (backgroundImage) {
              try {
                await FileSystem.deleteAsync(backgroundImage, { idempotent: true });
              } catch (e) {
                // ignore
              }
            }
            dispatch(clearBackgroundImage());
          },
        },
      ]
    );
  };

  const handleOpacityChange = (value: number) => {
    dispatch(setBackgroundOpacity(value));
  };

  const colors = THEMES[currentTheme];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
        <Text style={[styles.subtitle, { color: colors.text, opacity: 0.6 }]}>
          Customize your diary's look and feel
        </Text>
      </View>

      {/* Theme Colors Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Color Themes</Text>
        </View>

        <View style={styles.themesGrid}>
          {THEME_OPTIONS.map((theme, index) => {
            const themeColors = THEMES[theme.key];
            const isSelected = currentTheme === theme.key;

            return (
              <TouchableOpacity
                key={theme.key}
                style={[
                  styles.themeCard,
                  { backgroundColor: themeColors.surface },
                  isSelected && { 
                    borderColor: themeColors.accent, 
                    borderWidth: 2.5,
                    shadowColor: themeColors.accent,
                    shadowOpacity: 0.3,
                  },
                ]}
                onPress={() => handleThemeSelect(theme.key)}
                activeOpacity={0.8}>
                {/* Theme Preview */}
                <LinearGradient
                  colors={themeColors.headerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.themePreview}>
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                </LinearGradient>

                {/* Color dots */}
                <View style={styles.colorDots}>
                  <View style={[styles.colorDot, { backgroundColor: themeColors.background }]} />
                  <View style={[styles.colorDot, { backgroundColor: themeColors.accent }]} />
                  <View style={[styles.colorDot, { backgroundColor: themeColors.text }]} />
                </View>

                {/* Theme name */}
                <Text style={[styles.themeName, { color: themeColors.text }]}>{theme.name}</Text>

                {/* Selected indicator */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: themeColors.accent }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Background Image Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="image-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Background Image</Text>
        </View>

        <View style={[styles.bgCard, { backgroundColor: colors.surface }]}>
          {backgroundImage ? (
            <View style={styles.bgPreviewContainer}>
              <Image
                source={{ uri: backgroundImage }}
                style={styles.bgPreview}
                resizeMode="cover"
              />
              <View style={styles.bgOverlay} />
              <View style={styles.bgActions}>
                <TouchableOpacity
                  style={[styles.bgActionBtn, { backgroundColor: colors.accent }]}
                  onPress={handlePickImage}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.bgActionText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bgActionBtn, { backgroundColor: '#EF4444' }]}
                  onPress={handleRemoveBackground}>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.bgActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bgPlaceholder}
              onPress={handlePickImage}
              activeOpacity={0.7}>
              <View style={[styles.bgIconCircle, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="add-outline" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.bgPlaceholderText, { color: colors.text }]}>
                Add Background Image
              </Text>
              <Text style={[styles.bgPlaceholderSubtext, { color: colors.text, opacity: 0.5 }]}>
                Choose a photo from your gallery
              </Text>
            </TouchableOpacity>
          )}

          {/* Opacity Slider */}
          {backgroundImage && (
            <View style={styles.opacitySection}>
              <View style={styles.opacityHeader}>
                <Text style={[styles.opacityLabel, { color: colors.text }]}>Image Opacity</Text>
                <Text style={[styles.opacityValue, { color: colors.accent }]}>
                  {Math.round(backgroundOpacity * 100)}%
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={0.8}
                value={backgroundOpacity}
                onValueChange={handleOpacityChange}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.text + '30'}
                thumbTintColor={colors.accent}
              />
              <View style={styles.opacityHints}>
                <Text style={[styles.opacityHint, { color: colors.text, opacity: 0.4 }]}>
                  Subtle
                </Text>
                <Text style={[styles.opacityHint, { color: colors.text, opacity: 0.4 }]}>
                  Visible
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Preview Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="eye-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
        </View>

        <View style={[styles.previewCard, { backgroundColor: colors.background }]}>
          {backgroundImage && (
            <Image
              source={{ uri: backgroundImage }}
              style={[styles.previewBgImage, { opacity: backgroundOpacity }]}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={colors.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewHeader}>
            <Text style={styles.previewHeaderText}>Dream Diary</Text>
          </LinearGradient>
          <View style={styles.previewContent}>
            <View style={[styles.previewEntryCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.previewDate, { backgroundColor: colors.accent }]}>
                <Text style={styles.previewDateText}>22</Text>
              </View>
              <View style={styles.previewEntryContent}>
                <Text style={[styles.previewEntryTitle, { color: colors.text }]}>
                  Sample Entry
                </Text>
                <Text style={[styles.previewEntryText, { color: colors.text, opacity: 0.6 }]}>
                  This is how your entries will look...
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'RobotoRegular',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'PoppinsBold',
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  themeCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  themePreview: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  themeEmoji: {
    fontSize: 28,
  },
  colorDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PoppinsBold',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bgCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bgPreviewContainer: {
    height: 180,
    position: 'relative',
  },
  bgPreview: {
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bgActions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  bgActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  bgActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bgPlaceholder: {
    padding: 40,
    alignItems: 'center',
  },
  bgIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bgPlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'PoppinsBold',
  },
  bgPlaceholderSubtext: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'RobotoRegular',
  },
  opacitySection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  opacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opacityLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'RobotoMedium',
  },
  opacityValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  opacityHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  opacityHint: {
    fontSize: 11,
    fontFamily: 'RobotoRegular',
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
    position: 'relative',
  },
  previewBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewHeader: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  previewHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsBold',
  },
  previewContent: {
    flex: 1,
    padding: 12,
  },
  previewEntryCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  previewDate: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  previewDateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  previewEntryContent: {
    flex: 1,
  },
  previewEntryTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'PoppinsBold',
  },
  previewEntryText: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'RobotoRegular',
  },
});
