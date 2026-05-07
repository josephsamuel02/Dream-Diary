import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useAppDialog } from '~/hooks/useAppDialog';
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
import {
  selectSettings,
  setDiaryFont,
  setDiaryFontSize,
  DiaryFontKey,
  DIARY_FONT_SIZE_MIN,
  DIARY_FONT_SIZE_MAX,
  DIARY_FONT_SIZE_DEFAULT,
} from '~/store/slices/settingsSlice';

const THEME_OPTIONS: { key: ThemeKey; name: string; emoji: string }[] = [
  { key: 'cozy', name: 'Cozy', emoji: '🍂' },
  { key: 'night', name: 'Night', emoji: '🌃' },
  { key: 'dreamy', name: 'Dreamy', emoji: '🌙' },
  { key: 'nature', name: 'Nature', emoji: '🌿' },
  { key: 'warm', name: 'Warm', emoji: '☀️' },
  { key: 'dark', name: 'Dark', emoji: '🌑' },
];

type FontOption = {
  key: DiaryFontKey;
  label: string;
  description: string;
  sample: string;
};

const FONT_OPTIONS: FontOption[] = [
  {
    key: 'RobotoRegular',
    label: 'Default',
    description: 'Clean & modern',
    sample: 'The quick brown fox...',
  },
  { key: 'Lora', label: 'Lora', description: 'Classic serif', sample: 'The quick brown fox...' },
  {
    key: 'Merriweather',
    label: 'Merriweather',
    description: 'Literary & warm',
    sample: 'The quick brown fox...',
  },
  {
    key: 'PlayfairDisplay',
    label: 'Playfair',
    description: 'Elegant editorial',
    sample: 'The quick brown fox...',
  },
  {
    key: 'Caveat',
    label: 'Caveat',
    description: 'Casual handwriting',
    sample: 'The quick brown fox...',
  },
  {
    key: 'DancingScript',
    label: 'Dancing Script',
    description: 'Flowing script',
    sample: 'The quick brown fox...',
  },
  {
    key: 'Pacifico',
    label: 'Pacifico',
    description: 'Friendly & round',
    sample: 'The quick brown fox...',
  },
  {
    key: 'NunitoRegular',
    label: 'Nunito',
    description: 'Soft & readable',
    sample: 'The quick brown fox...',
  },
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
  const settings = useAppSelector(selectSettings);
  const currentFont = settings.diaryFont ?? 'RobotoRegular';
  const currentFontSize = settings.diaryFontSize ?? DIARY_FONT_SIZE_DEFAULT;
  const [loading, setLoading] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const { showDialog, dialogElement } = useAppDialog();

  const selectedFontOption = FONT_OPTIONS.find((f) => f.key === currentFont) ?? FONT_OPTIONS[0];

  const isDarkTheme = currentTheme === 'dark';

  const handleThemeSelect = (themeKey: ThemeKey) => {
    dispatch(setTheme(themeKey));
  };

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showDialog({
          title: 'Permission Needed',
          message: 'Please allow access to your photos to set a background image.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
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
      showDialog({
        title: 'Error',
        message: 'Failed to set background image. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleRemoveBackground = () => {
    showDialog({
      title: 'Remove Background',
      message: 'Are you sure you want to remove the background image?',
      buttons: [
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
      ],
    });
  };

  const handleOpacityChange = (value: number) => {
    dispatch(setBackgroundOpacity(value));
  };

  const colors = THEMES[currentTheme];

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkTheme ? '#FFFFFF' : colors.text }]}>Themes</Text>
        <Text style={[styles.subtitle, { color: isDarkTheme ? '#FFFFFF' : colors.text, opacity: 0.6 }]}>
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
          {THEME_OPTIONS.map((theme) => {
            const themeColors = THEMES[theme.key];
            const isSelected = currentTheme === theme.key;
            const isItemDark = theme.key === 'dark';

            return (
              <TouchableOpacity
                key={theme.key}
                style={[
                  styles.themeCard,
                  { backgroundColor: isItemDark ? '#FFFFFF' : themeColors.surface },
                  isSelected && {
                    borderColor: isItemDark ? '#000000' : themeColors.accent,
                    borderWidth: 2,
                    shadowColor: isItemDark ? '#FFFFFF' : themeColors.accent,
                    shadowOpacity: 0.35,
                  },
                ]}
                onPress={() => handleThemeSelect(theme.key)}
                activeOpacity={0.8}>
                {/* Gradient preview strip */}
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
                  <View style={[styles.colorDot, { backgroundColor: isItemDark ? '#000000' : themeColors.text }]} />
                </View>

                <Text style={[styles.themeName, { color: isItemDark ? '#000000' : themeColors.text }]}>{theme.name}</Text>

                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: isItemDark ? '#000000' : themeColors.accent }]}>
                    <Ionicons name="checkmark" size={11} color={isItemDark ? '#FFFFFF' : "#fff"} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Font Selection Section */}
      <View style={[styles.section, { marginTop: 36 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="text-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Diary Font</Text>
        </View>
        <Text style={[styles.fontSectionSubtitle, { color: colors.text }]}>
          Applied to your diary writing area only
        </Text>

        {/* Dropdown trigger */}
        <TouchableOpacity
          onPress={() => setFontDropdownOpen(true)}
          activeOpacity={0.8}
          style={[
            styles.dropdownTrigger,
            {
              backgroundColor: colors.surface,
              borderColor: colors.accent + '40',
            },
          ]}>
          <View style={styles.dropdownTriggerLeft}>
            <Text
              style={[
                styles.dropdownFontName,
                { color: colors.text, fontFamily: selectedFontOption.key },
              ]}>
              {selectedFontOption.label}
            </Text>
            <Text
              style={[
                styles.dropdownSample,
                { color: colors.text, fontFamily: selectedFontOption.key },
              ]}>
              {selectedFontOption.sample}
            </Text>
          </View>
          <View style={[styles.dropdownChevronWrap, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="chevron-down" size={16} color={colors.accent} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Font Size Section */}
      <View style={[styles.section, { marginTop: 28 }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="resize-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Font Size</Text>
        </View>
        <Text style={[styles.fontSectionSubtitle, { color: colors.text }]}>
          Adjust the text size used inside your diary entries
        </Text>

        <View
          style={[
            styles.fontSizeCard,
            { backgroundColor: isDarkTheme ? '#FFFFFF' : colors.surface, borderColor: isDarkTheme ? '#00000020' : colors.accent + '30' },
          ]}>
          <View style={styles.fontSizeHeader}>
            <Text style={[styles.fontSizeLabel, { color: isDarkTheme ? '#000000' : colors.text }]}>Size</Text>
            <Text style={[styles.fontSizeValue, { color: isDarkTheme ? '#000000' : colors.accent }]}>{currentFontSize}pt</Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={DIARY_FONT_SIZE_MIN}
            maximumValue={DIARY_FONT_SIZE_MAX}
            step={1}
            value={currentFontSize}
            onValueChange={(v) => dispatch(setDiaryFontSize(Math.round(v)))}
            minimumTrackTintColor={isDarkTheme ? '#000000' : colors.accent}
            maximumTrackTintColor={isDarkTheme ? '#00000030' : colors.text + '30'}
            thumbTintColor={isDarkTheme ? '#000000' : colors.accent}
          />
          <View style={styles.fontSizeHints}>
            <Text style={[styles.fontSizeHint, { color: isDarkTheme ? '#000000' : colors.text, opacity: 0.45 }]}>A</Text>
            <Text
              style={[styles.fontSizeHint, { color: isDarkTheme ? '#000000' : colors.text, opacity: 0.45, fontSize: 18 }]}>
              A
            </Text>
          </View>

          {/* Live sample so users can see the effect immediately */}
          <View
            style={[styles.fontSizeSampleBox, { borderTopColor: isDarkTheme ? '#00000012' : colors.text + '12' }]}
            pointerEvents="none">
            <Text
              style={[
                styles.fontSizeSample,
                {
                  color: isDarkTheme ? '#000000' : colors.text,
                  fontFamily: currentFont,
                  fontSize: currentFontSize,
                  lineHeight: Math.round(currentFontSize * 1.55),
                },
              ]}
              numberOfLines={2}>
              The quick brown fox jumps over the lazy dog.
            </Text>
          </View>
        </View>
      </View>

      {/* Font dropdown modal */}
      <Modal
        visible={fontDropdownOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFontDropdownOpen(false)}>
        <Pressable style={styles.dropdownOverlay} onPress={() => setFontDropdownOpen(false)} />
        <View
          style={[
            styles.dropdownSheet,
            { backgroundColor: isDarkTheme ? '#FFFFFF' : colors.surface },
          ]}>
          {/* Sheet handle */}
          <View style={[styles.dropdownHandle, { backgroundColor: isDarkTheme ? '#000000' : colors.text + '25' }]} />

          {/* Sheet header */}
          <View style={[styles.dropdownSheetHeader, { borderBottomColor: isDarkTheme ? '#00000020' : colors.text + '12' }]}>
            <Text style={[styles.dropdownSheetTitle, { color: isDarkTheme ? '#000000' : colors.text }]}>Choose a Font</Text>
            <TouchableOpacity
              onPress={() => setFontDropdownOpen(false)}
              style={[styles.dropdownCloseBtn, { backgroundColor: isDarkTheme ? '#00000012' : colors.text + '12' }]}>
              <Ionicons name="close" size={16} color={isDarkTheme ? '#000000' : colors.text} />
            </TouchableOpacity>
          </View>

          {/* Font options */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.dropdownScroll}>
            {FONT_OPTIONS.map((font) => {
              const isSelected = currentFont === font.key;
              return (
                <TouchableOpacity
                  key={font.key}
                  onPress={() => {
                    dispatch(setDiaryFont(font.key));
                    setFontDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: isDarkTheme ? '#00000008' : colors.text + '08' },
                    isSelected && { backgroundColor: isDarkTheme ? '#00000012' : colors.accent + '12' },
                  ]}>
                  <View style={styles.dropdownItemLeft}>
                    <Text
                      style={[
                        styles.dropdownItemName,
                        { color: isDarkTheme ? '#000000' : colors.text, fontFamily: font.key },
                      ]}>
                      {font.label}
                    </Text>
                    <Text style={[styles.dropdownItemDesc, { color: isDarkTheme ? '#000000' : colors.text }]}>
                      {font.description}
                    </Text>
                    <Text
                      style={[
                        styles.dropdownItemSample,
                        { color: isDarkTheme ? '#000000' : colors.text, fontFamily: font.key },
                      ]}
                      numberOfLines={1}>
                      {font.sample}
                    </Text>
                  </View>
                  {isSelected ? (
                    <View style={[styles.dropdownItemCheck, { backgroundColor: isDarkTheme ? '#000000' : colors.accent }]}>
                      <Ionicons name="checkmark" size={14} color={isDarkTheme ? '#FFFFFF' : "#fff"} />
                    </View>
                  ) : (
                    <View
                      style={[styles.dropdownItemCircle, { borderColor: isDarkTheme ? '#00000025' : colors.text + '25' }]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Background Image Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="image-outline" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Background Image</Text>
        </View>

        <View style={[styles.bgCard, { backgroundColor: isDarkTheme ? '#FFFFFF' : colors.surface }]}>
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
                  style={[styles.bgActionBtn, { backgroundColor: isDarkTheme ? '#000000' : colors.accent }]}
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
              <View style={[styles.bgIconCircle, { backgroundColor: isDarkTheme ? '#00000018' : colors.accent + '20' }]}>
                <Ionicons name="add-outline" size={32} color={isDarkTheme ? '#000000' : colors.accent} />
              </View>
              <Text style={[styles.bgPlaceholderText, { color: isDarkTheme ? '#000000' : colors.text }]}>
                Add Background Image
              </Text>
              <Text style={[styles.bgPlaceholderSubtext, { color: isDarkTheme ? '#000000' : colors.text, opacity: 0.5 }]}>
                Choose a photo from your gallery
              </Text>
            </TouchableOpacity>
          )}

          {/* Opacity Slider */}
          {backgroundImage && (
            <View style={[styles.opacitySection, { borderTopColor: isDarkTheme ? '#00000010' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.opacityHeader}>
                <Text style={[styles.opacityLabel, { color: isDarkTheme ? '#000000' : colors.text }]}>Image Opacity</Text>
                <Text style={[styles.opacityValue, { color: isDarkTheme ? '#000000' : colors.accent }]}>
                  {Math.round(backgroundOpacity * 100)}%
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={0.8}
                value={backgroundOpacity}
                onValueChange={handleOpacityChange}
                minimumTrackTintColor={isDarkTheme ? '#000000' : colors.accent}
                maximumTrackTintColor={isDarkTheme ? '#00000030' : colors.text + '30'}
                thumbTintColor={isDarkTheme ? '#000000' : colors.accent}
              />
              <View style={styles.opacityHints}>
                <Text style={[styles.opacityHint, { color: isDarkTheme ? '#000000' : colors.text, opacity: 0.4 }]}>
                  Subtle
                </Text>
                <Text style={[styles.opacityHint, { color: isDarkTheme ? '#000000' : colors.text, opacity: 0.4 }]}>
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

        <View style={[styles.previewCard, { backgroundColor: isDarkTheme ? '#FFFFFF' : colors.background }]}>
          {backgroundImage && (
            <Image
              source={{ uri: backgroundImage }}
              style={[styles.previewBgImage, { opacity: backgroundOpacity }]}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={isDarkTheme ? ['#000000', '#333333', '#666666'] : colors.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewHeader}>
            <Text style={styles.previewHeaderText}>Dream Diary</Text>
          </LinearGradient>
          <View style={styles.previewContent}>
            <View style={[styles.previewEntryCard, { backgroundColor: isDarkTheme ? '#00000010' : colors.surface }]}>
              <View style={[styles.previewDate, { backgroundColor: isDarkTheme ? '#FFFFFF' : colors.accent }]}>
                <Text style={[styles.previewDateText, { color: isDarkTheme ? '#000000' : '#FFFFFF' }]}>22</Text>
              </View>
              <View style={styles.previewEntryContent}>
                <Text style={[styles.previewEntryTitle, { color: isDarkTheme ? '#000000' : colors.text }]}>Sample Entry</Text>
                <Text style={[styles.previewEntryText, { color: isDarkTheme ? '#000000' : colors.text, opacity: 0.6 }]}>
                  This is how your entries will look...
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
    {dialogElement}
  </>
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
    gap: 10,
  },
  themeCard: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  themeEmoji: {
    fontSize: 22,
  },
  colorDots: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  themeName: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'PoppinsBold',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Font section
  fontSectionSubtitle: {
    fontSize: 12,
    fontFamily: 'RobotoRegular',
    opacity: 0.55,
    marginTop: -10,
    marginBottom: 14,
  },
  // Dropdown trigger
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownTriggerLeft: {
    flex: 1,
  },
  dropdownFontName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
  },
  dropdownSample: {
    fontSize: 12,
    opacity: 0.6,
  },
  dropdownChevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // Dropdown modal sheet
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dropdownSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  dropdownHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 8,
  },
  dropdownSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  dropdownSheetTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 17,
  },
  dropdownCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownScroll: {
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 10,
    marginBottom: 2,
  },
  dropdownItemLeft: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dropdownItemDesc: {
    fontSize: 11,
    fontFamily: 'RobotoRegular',
    opacity: 0.5,
    marginBottom: 3,
  },
  dropdownItemSample: {
    fontSize: 13,
    opacity: 0.65,
  },
  dropdownItemCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  dropdownItemCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    marginLeft: 10,
  },
  // Font size section
  fontSizeCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  fontSizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fontSizeLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'RobotoMedium',
  },
  fontSizeValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  fontSizeHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  fontSizeHint: {
    fontSize: 12,
    fontFamily: 'RobotoRegular',
  },
  fontSizeSampleBox: {
    marginTop: 14,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  fontSizeSample: {
    textAlign: 'left',
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
