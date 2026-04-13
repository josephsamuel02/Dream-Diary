// components/MainTab.tsx
import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

// redux
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { addEntry, selectEntries, addBlockToEntry } from '~/store/slices/diarySlice';
import { selectThemeColors } from '~/store/slices/themeSlice';

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getLocalYYYYMMDD = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const MEDIA_DIR = `${FileSystem.documentDirectory}diary_media/`;
const ensureMediaDir = async () => {
  try {
    const info = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  } catch (e) {
    console.warn('ensureMediaDir error', e);
  }
};

const copyFileToAppAsync = async (uri: string, fallbackExt = 'jpg') => {
  try {
    await ensureMediaDir();
    const parts = uri.split('.');
    let ext = parts.length > 1 ? parts[parts.length - 1].split('?')[0] : fallbackExt;
    if (ext.length > 5 || ext.includes('/')) ext = fallbackExt;
    const filename = `${genId()}.${ext}`;
    const dest = `${MEDIA_DIR}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch (e) {
    console.warn('copyFileToAppAsync failed, using original uri', e);
    return uri;
  }
};

const MainTab: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectEntries);
  const themeColors = useAppSelector(selectThemeColors);

  // modal for camera options
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Animations
  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // audio recorder
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const isRecording = recorderState?.isRecording ?? false;
  const [busy, setBusy] = useState(false);

  const todayIso = getLocalYYYYMMDD();
  const hasTodayEntry = (entries ?? []).some((e) => e.date === todayIso);

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setExpanded(!expanded);
  };

  // ensure today's entry exists and return id (create deterministically if needed)
  const createOrGetTodayEntry = useCallback(() => {
    const entry = (entries ?? []).find((e) => e.date === todayIso);
    if (entry) return entry.id;
    const id = genId();
    dispatch(
      addEntry({
        id,
        date: todayIso,
        title: '',
      })
    );
    return id;
  }, [dispatch, entries, todayIso]);

  // Navigate to DiaryInput with the given entryId
  const openEntry = useCallback(
    (entryId: string) => {
      router.push(`/DiaryInput?entryId=${encodeURIComponent(entryId)}`);
    },
    [router]
  );

  // Start/Stop recording
  const onMicPress = useCallback(async () => {
    try {
      if (isRecording) {
        await recorder.stop();
        // Reset audio mode for playback after recording stops
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const uri = recorder.uri;
        if (uri) {
          setBusy(true);
          const dest = await copyFileToAppAsync(uri, 'm4a');
          const entryId = createOrGetTodayEntry();
          dispatch(addBlockToEntry({ entryId, type: 'audio', content: dest }));
          openEntry(entryId);
          setBusy(false);
        } else {
          console.warn('No recording uri after stop');
        }
        return;
      }

      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        console.warn('Microphone permission not granted');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      console.error('mic press error', e);
    }
  }, [isRecording, recorder, createOrGetTodayEntry, dispatch, openEntry]);

  // Camera options:
  const takePhoto = useCallback(async () => {
    try {
      setCameraModalOpen(false);
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        console.warn('camera permission denied');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      });
      if (!res.canceled && (res as any).assets?.length) {
        const uri = (res as any).assets[0].uri;
        const dest = await copyFileToAppAsync(uri, 'jpg');
        const entryId = createOrGetTodayEntry();
        dispatch(addBlockToEntry({ entryId, type: 'image', content: dest }));
        openEntry(entryId);
      } else if (!res.canceled && (res as any).uri) {
        const uri = (res as any).uri;
        const dest = await copyFileToAppAsync(uri, 'jpg');
        const entryId = createOrGetTodayEntry();
        dispatch(addBlockToEntry({ entryId, type: 'image', content: dest }));
        openEntry(entryId);
      }
    } catch (e) {
      console.error('takePhoto error', e);
    }
  }, [createOrGetTodayEntry, dispatch, openEntry]);

  const chooseFromGallery = useCallback(async () => {
    try {
      setCameraModalOpen(false);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        console.warn('gallery permission denied');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
      });
      if (!res.canceled && (res as any).assets?.length) {
        const uri = (res as any).assets[0].uri;
        const dest = await copyFileToAppAsync(uri, 'jpg');
        const entryId = createOrGetTodayEntry();
        dispatch(addBlockToEntry({ entryId, type: 'image', content: dest }));
        openEntry(entryId);
      } else if (!res.canceled && (res as any).uri) {
        const uri = (res as any).uri;
        const dest = await copyFileToAppAsync(uri, 'jpg');
        const entryId = createOrGetTodayEntry();
        dispatch(addBlockToEntry({ entryId, type: 'image', content: dest }));
        openEntry(entryId);
      }
    } catch (e) {
      console.error('chooseFromGallery error', e);
    }
  }, [createOrGetTodayEntry, dispatch, openEntry]);

  // Generic file picker (file browser)
  const pickFile = useCallback(async () => {
    try {
      setCameraModalOpen(false);
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0].uri;
        const dest = await copyFileToAppAsync(uri, uri.split('.').pop() ?? 'bin');
        const entryId = createOrGetTodayEntry();
        dispatch(addBlockToEntry({ entryId, type: 'image', content: dest }));
        openEntry(entryId);
      }
    } catch (e) {
      console.error('pickFile error', e);
    }
  }, [createOrGetTodayEntry, dispatch, openEntry]);

  const createNewEntry = () => {
    const id = genId();
    dispatch(
      addEntry({
        id,
        date: todayIso,
        title: '',
      })
    );
    router.push(`/DiaryInput?entryId=${encodeURIComponent(id)}`);
  };

  // Animation interpolations
  const cameraTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  const cameraOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const micTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });
  const micOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {/* Expanded action buttons */}
      <Animated.View
        style={[
          styles.actionButton,
          {
            transform: [{ translateY: micTranslateY }],
            opacity: micOpacity,
          },
        ]}>
        <TouchableOpacity onPress={onMicPress} activeOpacity={0.8} style={styles.secondaryButton}>
          <Animated.View
            style={[
              styles.secondaryButtonInner,
              { backgroundColor: themeColors.surface },
              isRecording && styles.recordingButton,
              { transform: [{ scale: isRecording ? pulseAnim : 1 }] },
            ]}>
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={18}
              color={isRecording ? '#fff' : themeColors.accent}
            />
          </Animated.View>
          <Text style={[styles.buttonLabel, { color: themeColors.text }]}>
            {isRecording ? 'Stop' : 'Record'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.actionButton,
          {
            transform: [{ translateY: cameraTranslateY }],
            opacity: cameraOpacity,
          },
        ]}>
        <TouchableOpacity
          onPress={() => setCameraModalOpen(true)}
          activeOpacity={0.8}
          style={styles.secondaryButton}>
          <View style={[styles.secondaryButtonInner, { backgroundColor: themeColors.surface }]}>
            <Feather name="camera" size={18} color={themeColors.accent} />
          </View>
          <Text style={[styles.buttonLabel, { color: themeColors.text }]}>Photo</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity
        onPress={hasTodayEntry ? toggleExpand : createNewEntry}
        activeOpacity={0.9}
        style={styles.fabContainer}>
        <LinearGradient
          colors={[themeColors.headerGradient[1], themeColors.headerGradient[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fab, { shadowColor: themeColors.accent }]}>
          <Animated.View style={{ transform: [{ rotate: hasTodayEntry ? rotation : '0deg' }] }}>
            <Ionicons name={hasTodayEntry ? 'add' : 'create-outline'} size={26} color="#fff" />
          </Animated.View>
        </LinearGradient>
        {!hasTodayEntry && (
          <View style={[styles.fabBadge, { backgroundColor: themeColors.accent }]}>
            <Text style={styles.fabBadgeText}>New</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Camera options modal */}
      <Modal
        transparent
        visible={cameraModalOpen}
        animationType="fade"
        onRequestClose={() => setCameraModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCameraModalOpen(false)} />

        <View style={styles.centered}>
          <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
            <View style={[styles.cardHeader, { borderBottomColor: themeColors.text + '10' }]}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>Add Photo</Text>
              <TouchableOpacity onPress={() => setCameraModalOpen(false)}>
                <Ionicons name="close" size={22} color={themeColors.text + '50'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.option} onPress={takePhoto} activeOpacity={0.7}>
              <View style={[styles.optionIcon, { backgroundColor: themeColors.accent + '15' }]}>
                <Ionicons name="camera-outline" size={20} color={themeColors.accent} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: themeColors.text }]}>Take Photo</Text>
                <Text style={[styles.optionSubtext, { color: themeColors.text + '60' }]}>
                  Use your camera
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.text + '30'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={chooseFromGallery} activeOpacity={0.7}>
              <View style={[styles.optionIcon, { backgroundColor: '#D1FAE520' }]}>
                <Ionicons name="images-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: themeColors.text }]}>
                  Choose from Gallery
                </Text>
                <Text style={[styles.optionSubtext, { color: themeColors.text + '60' }]}>
                  Select existing photo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.text + '30'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={pickFile} activeOpacity={0.7}>
              <View style={[styles.optionIcon, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="folder-outline" size={20} color="#6366F1" />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, { color: themeColors.text }]}>Browse Files</Text>
                <Text style={[styles.optionSubtext, { color: themeColors.text + '60' }]}>
                  Pick from file manager
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.text + '30'} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* busy indicator when copying/deleting etc */}
      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
  },
  secondaryButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  buttonLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
  },
  fabContainer: {
    position: 'relative',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'RobotoMedium',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
  },
  optionSubtext: {
    fontSize: 11,
    marginTop: 1,
    fontFamily: 'RobotoRegular',
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
});

export default MainTab;
