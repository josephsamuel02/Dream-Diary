// components/MainTab.tsx
import React, { useCallback, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Modal,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

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

  // modal for camera options
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  // audio recorder
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const isRecording = recorderState?.isRecording ?? false;
  const [busy, setBusy] = useState(false);

  const todayIso = getLocalYYYYMMDD();

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
      // If already recording -> stop
      if (isRecording) {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          setBusy(true);
          const dest = await copyFileToAppAsync(uri, 'm4a');
          const entryId = createOrGetTodayEntry();
          // dispatch audio block
          dispatch(addBlockToEntry({ entryId, type: 'audio', content: dest }));
          // open entry so user can see recording immediately
          openEntry(entryId);
          setBusy(false);
        } else {
          console.warn('No recording uri after stop');
        }
        return;
      }

      // request permissions & init
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        // optionally show an alert or toast
        console.warn('Microphone permission not granted');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: false });

      // prepare & start
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
        // attempt to treat as image; if not an image, still copy and add
        const dest = await copyFileToAppAsync(uri, uri.split('.').pop() ?? 'bin');
        const entryId = createOrGetTodayEntry();
        dispatch(addBlockToEntry({ entryId, type: 'image', content: dest }));
        openEntry(entryId);
      }
    } catch (e) {
      console.error('pickFile error', e);
    }
  }, [createOrGetTodayEntry, dispatch, openEntry]);

  // UI - mic icon shows recording state
  return (
    <View className=" absolute bottom-10 right-0 z-20 ml-auto w-28 flex-col items-center justify-around  gap-y-3 ">
      {/* Camera (open modal with options) */}
      <TouchableOpacity className="items-center" onPress={() => setCameraModalOpen(true)}>
        <Feather
          name="camera"
          size={24}
          className="items-center rounded-full bg-white p-3 text-cozy_accent shadow-md"
        />
      </TouchableOpacity>

      {/* Mic: toggle record */}
      <TouchableOpacity className="items-center" onPress={onMicPress}>
        <Ionicons
          name={isRecording ? 'mic' : 'mic-outline'}
          size={30}
          style={{
            color: isRecording ? '#ffffff' : '#252525',
            padding: 6,
            borderRadius: 999,
            backgroundColor: isRecording ? '#f72f2f' : '#ffffff',
            overflow: 'hidden',
          }}
        />
      </TouchableOpacity>

      {/* Add button shown only if no entry today (keeps behavior you had) */}
      {!(entries ?? []).some((e) => e.date === todayIso) && (
        <TouchableOpacity
          onPress={() => {
            const id = genId();
            dispatch(
              addEntry({
                id,
                date: todayIso,
                title: '',
              })
            );
            router.push(`/DiaryInput?entryId=${encodeURIComponent(id)}`);
          }}
          className="mb-5 items-center justify-center rounded-full bg-[#ffffff] p-3  shadow-md "
          style={{ width: 'auto', height: 'auto' }}>
          <Ionicons
            name="add-outline"
            size={55}
            color="#252525"
            className="items-center rounded-full shadow-lg"
          />
        </TouchableOpacity>
      )}

      {/* Camera options modal */}
      <Modal
        transparent
        visible={cameraModalOpen}
        animationType="fade"
        onRequestClose={() => setCameraModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCameraModalOpen(false)} />

        <View style={styles.centered}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.option} onPress={takePhoto}>
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={chooseFromGallery}>
              <Text style={styles.optionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option} onPress={pickFile}>
              <Text style={styles.optionText}>Pick File (browser)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, styles.cancel]}
              onPress={() => setCameraModalOpen(false)}>
              <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* busy indicator when copying/deleting etc */}
      {busy && (
        <View style={{ marginTop: 6 }}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  centered: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 110, // sit above the bottom tab area
  },
  card: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionText: {
    fontSize: 15,
    color: '#111827',
    textAlign: 'center',
  },
  cancel: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  cancelText: {
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default MainTab;
