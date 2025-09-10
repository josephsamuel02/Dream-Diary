import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Image,
  Alert,
  Platform,
  Keyboard,
  Animated,
  StyleSheet,
  FlatList,
  Pressable,
  AppState,
  AppStateStatus,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

import DiaryToolbar, { AudioPlayer } from './diaryToolbar';

type TextBlock = { id: string; type: 'text'; content: string };
type ImageBlock = { id: string; type: 'image'; content: string };
type AudioBlock = { id: string; type: 'audio'; content: string };
type Block = TextBlock | ImageBlock | AudioBlock;

const TOOLBAR_HEIGHT = 68; // used for padding and layout
const BASE_BOTTOM_PADDING = 10;

const STORAGE_KEY = 'DiaryInput:draft:v1';
const MEDIA_DIR = `${FileSystem.documentDirectory}diary_media/`;

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatTime = (seconds = 0) => {
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

export default function DiaryInputBody() {
  const [blocks, setBlocks] = useState<Block[]>([{ id: genId(), type: 'text', content: '' }]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  // keyboard state
  const animatedBottom = useRef(new Animated.Value(0)).current;

  // ref map for text inputs so we can focus them
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const listRef = useRef<FlatList<Block> | null>(null);

  // persistence helpers
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ensure media dir exists
  const ensureMediaDir = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(MEDIA_DIR);
      if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    } catch (e) {
      console.warn('Failed to ensure media dir', e);
    }
  }, []);

  // copy file into app media dir and return destination path
  const copyFileToAppAsync = useCallback(
    async (uri: string, fallbackExt = 'jpg') => {
      try {
        await ensureMediaDir();

        // try to extract extension from uri
        const parts = uri.split('.');
        let ext = parts.length > 1 ? parts[parts.length - 1].split('?')[0] : fallbackExt;
        // sanitize extension
        if (ext.length > 5 || ext.includes('/')) ext = fallbackExt;

        const filename = `${genId()}.${ext}`;
        const dest = `${MEDIA_DIR}${filename}`;
        await FileSystem.copyAsync({ from: uri, to: dest });
        return dest;
      } catch (e) {
        console.warn('Failed to copy file to app dir, using original uri', e);
        // fall back to original uri if copy fails
        return uri;
      }
    },
    [ensureMediaDir]
  );

  const saveDraftImmediate = useCallback(async (items: Block[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save draft', e);
    }
  }, []);

  const scheduleSaveDraft = useCallback(
    (items: Block[]) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveDraftImmediate(items);
        saveTimerRef.current = null;
      }, 800);
    },
    [saveDraftImmediate]
  );

  const loadDraft = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Block[] | null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setBlocks(parsed);
        setTimeout(() => {
          try {
            listRef.current?.scrollToEnd({ animated: false });
          } catch (e) {
            /* ignore */
          }
        }, 80);
      }
    } catch (e) {
      console.warn('Failed to load draft', e);
    }
  }, []);

  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear draft', e);
    }
  }, []);

  // ---------- initial load & appState listeners ----------
  useEffect(() => {
    loadDraft();
    ensureMediaDir();

    const sub = AppState.addEventListener?.('change', (next) => {
      if (appStateRef.current.match(/active/) && next.match(/inactive|background/)) {
        // app is going to background: save immediately
        saveDraftImmediate(blocks);
      }
      appStateRef.current = next;
    });

    return () => {
      sub?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // autosave when blocks change
  useEffect(() => {
    scheduleSaveDraft(blocks);
  }, [blocks, scheduleSaveDraft]);

  // save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveDraftImmediate(blocks);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- existing permission & audio init ----------
  useEffect(() => {
    (async () => {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Microphone permission required', 'Enable mic access to record audio notes.');
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: false });

        const imgPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!imgPerm.granted) console.warn('Media library permission denied');
      } catch (e) {
        console.warn('Permission or audio init error:', e);
      }
    })();
  }, []);

  // animate toolbar up/down when keyboard appears/disappears
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height ?? 0;
      Animated.timing(animatedBottom, {
        toValue: height,
        duration: 220,
        useNativeDriver: false,
      }).start();
    };

    const onHide = () => {
      Animated.timing(animatedBottom, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [animatedBottom]);

  // ---------- add/update blocks ----------
  const addBlock = useCallback((type: Block['type'], content = '') => {
    setBlocks((prev) => {
      // When adding image/audio: remove all empty text inputs first
      if (type === 'image' || type === 'audio') {
        const cleaned = prev.filter((b) => !(b.type === 'text' && b.content.trim() === ''));
        cleaned.push({ id: genId(), type, content } as ImageBlock | AudioBlock);
        // Ensure a single trailing empty text input for the user to continue typing
        cleaned.push({ id: genId(), type: 'text', content: '' });
        // scroll to bottom after adding (allow render)
        setTimeout(() => {
          try {
            const lastIndex = cleaned.length - 1;
            if (lastIndex >= 0)
              listRef.current?.scrollToIndex({ index: lastIndex, animated: true });
          } catch (e) {
            /* ignore */
          }
        }, 60);
        return cleaned;
      }

      // For text additions: just append the new text block
      const appended = [...prev, { id: genId(), type: 'text', content } as TextBlock];
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({ index: appended.length - 1, animated: true });
        } catch (e) {
          /* ignore */
        }
      }, 60);
      return appended;
    });
  }, []);

  const updateText = useCallback((index: number, text: string) => {
    setBlocks((prev) => {
      const copy = [...prev];
      // guard: if index out of range, just return prev
      if (index < 0 || index >= copy.length) return prev;
      copy[index] = { ...(copy[index] as TextBlock), content: text };
      return copy;
    });
  }, []);

  // ---------- image / camera pick with copy to app dir ----------
  const pickImageFromLibrary = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images ?? 'Images',
        allowsEditing: true,
      });

      // new expo returns { canceled: boolean, assets: [...] }
      if (!result.canceled && (result as any).assets?.length) {
        const src = (result as any).assets[0].uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlock('image', dest);
      } else if (!result.canceled && (result as any).uri) {
        const src = (result as any).uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlock('image', dest);
      }
    } catch (e) {
      console.error('Image pick error:', e);
    }
  }, [addBlock, copyFileToAppAsync]);

  const takePhoto = useCallback(async () => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Camera permission required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images ?? 'Images',
        allowsEditing: true,
      });

      if (!result.canceled && (result as any).assets?.length) {
        const src = (result as any).assets[0].uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlock('image', dest);
      } else if (!result.canceled && (result as any).uri) {
        const src = (result as any).uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlock('image', dest);
      }
    } catch (e) {
      console.error('Take photo error:', e);
    }
  }, [addBlock, copyFileToAppAsync]);

  // ---------- audio record stop: copy to app dir and add block ----------
  const startRecording = useCallback(async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      console.error('Start recording error:', e);
      Alert.alert('Recording failed', 'Could not start recording.');
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const dest = await copyFileToAppAsync(uri, 'm4a');
        addBlock('audio', dest);
      } else console.warn('No recording uri after stop');
    } catch (e) {
      console.error('Stop recording error:', e);
    }
  }, [recorder, addBlock, copyFileToAppAsync]);

  // Focus helper: focus last text input (create one if none)
  const focusLastTextInput = useCallback(() => {
    const lastText = [...blocks].reverse().find((b) => b.type === 'text') as TextBlock | undefined;

    if (lastText) {
      const ref = inputRefs.current[lastText.id];
      if (ref && typeof ref.focus === 'function') {
        ref.focus();
        return;
      }

      const idx = blocks.findIndex((b) => b.id === lastText.id);
      if (idx >= 0) {
        try {
          listRef.current?.scrollToIndex({ index: idx, animated: true });
        } catch (e) {
          // ignore if virtualization mismatch
        }
        setTimeout(() => inputRefs.current[lastText.id]?.focus?.(), 90);
        return;
      }
    }

    const newId = genId();
    setBlocks((prev: any) => {
      const next = [...prev, { id: newId, type: 'text', content: '' }];
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({ index: next.length - 1, animated: true });
        } catch (e) {
          /* ignore */
        }
      }, 80);
      return next;
    });
    setTimeout(() => inputRefs.current[newId]?.focus?.(), 140);
  }, [blocks]);

  const renderItem = ({ item, index }: { item: Block; index: number }) => {
    if (item.type === 'text') {
      return (
        <TextInput
          ref={(r: any) => (inputRefs.current[item.id] = r)}
          className="bg-transparent my-2 rounded-md p-1 text-base"
          multiline
          value={item.content}
          onChangeText={(t) => updateText(index, t)}
          placeholder="Write here..."
          placeholderTextColor="#9CA3AF"
          onFocus={() => {
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({ index, animated: true });
              } catch (e) {
                /* ignore */
              }
            }, 80);
          }}
        />
      );
    }
    if (item.type === 'image')
      return <Image source={{ uri: item.content }} className="my-2 h-56 w-full rounded-lg" />;
    if (item.type === 'audio') return <AudioPlayer uri={item.content} />;
    return null;
  };

  return (
    <View style={styles.container} className="bg-white">
      <View style={styles.inner}>
        <Pressable style={{ flex: 1 }} onPress={focusLastTextInput}>
          <FlatList
            ref={listRef}
            data={blocks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            initialNumToRender={6}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: TOOLBAR_HEIGHT + BASE_BOTTOM_PADDING + 24 }}
          />
        </Pressable>
      </View>

      {/* Animated floating toolbar */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.toolbarWrapper,
          {
            bottom: Animated.add(animatedBottom, new Animated.Value(BASE_BOTTOM_PADDING)),
          },
        ]}>
        <View style={styles.toolbar}>
          <DiaryToolbar
            pickImageFromLibrary={pickImageFromLibrary}
            takePhoto={takePhoto}
            recorderIsRecording={recorderState.isRecording}
            toggleRecording={() => (recorderState.isRecording ? stopRecording() : startRecording())}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 12 },
  toolbarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginBottom: -60,
    backgroundColor: 'transparent',
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    marginHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
});
