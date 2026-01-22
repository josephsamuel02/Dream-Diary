// app/components/DiaryInputBody.tsx
import { useEffect, useCallback, useRef, useMemo } from 'react';

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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

import DiaryToolbar, { AudioPlayer } from './diaryToolbar';

// redux
import { useAppDispatch, useAppSelector } from '~/store/hooks';

import {
  addBlockToEntry,
  updateTextInEntry,
  replaceBlocksForEntry,
  selectEntryById,
} from '~/store/slices/diarySlice';

type Block = { id: string; type: 'text' | 'image' | 'audio'; content: string };

const TOOLBAR_HEIGHT = 56;
const BASE_BOTTOM_PADDING = 0;
const MEDIA_DIR = `${FileSystem.documentDirectory}diary_media/`;

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function DiaryInputBody({ entryId }: { entryId: string }) {
  const dispatch = useAppDispatch();
  // pull the entry from store
  const entry = useAppSelector((s) => selectEntryById(s, entryId));
  const blocks = useMemo(() => entry?.blocks ?? [], [entry?.blocks]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const animatedBottom = useRef(new Animated.Value(0)).current;
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const listRef = useRef<FlatList<Block> | null>(null);

  // ensure media dir (same as before)
  const ensureMediaDir = useCallback(async () => {
    try {
      const info = await FileSystem.getInfoAsync(MEDIA_DIR);
      if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    } catch (e) {
      console.warn('Failed to ensure media dir', e);
    }
  }, []);

  const copyFileToAppAsync = useCallback(
    async (uri: string, fallbackExt = 'jpg') => {
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
        console.warn('Failed to copy file to app dir, using original uri', e);
        return uri;
      }
    },
    [ensureMediaDir]
  );

  // initial: permissions etc (same as before)
  useEffect(() => {
    (async () => {
      try {
        await ensureMediaDir();
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
  }, [ensureMediaDir]);

  // keyboard animation (same)
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
    const onHide = () =>
      Animated.timing(animatedBottom, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [animatedBottom]);

  // ---------- actions that dispatch to entry-specific reducers ----------
  const addTextBlockOptimistic = useCallback(() => {
    // optimistic replace blocks: append a text block with generated id
    const newId = genId();
    const next: Block[] = [...blocks, { id: newId, type: 'text', content: '' }];
    dispatch(replaceBlocksForEntry({ entryId, blocks: next }));
    setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index: next.length - 1, animated: true });
      } catch (e: any) {
        console.warn('Scroll to index error:', e);
      }
      setTimeout(() => inputRefs.current[newId]?.focus?.(), 120);
    }, 80);
  }, [blocks, dispatch, entryId]);

  const addBlockViaReducer = useCallback(
    (type: Block['type'], content = '') => {
      dispatch(addBlockToEntry({ entryId, type, content }));
      setTimeout(() => {
        try {
          listRef.current?.scrollToEnd({ animated: true });
        } catch (e: any) {
          console.warn('Scroll to end error:', e);
        }
      }, 80);
    },
    [dispatch, entryId]
  );

  const updateTextAtIndex = useCallback(
    (index: number, text: string) => {
      dispatch(updateTextInEntry({ entryId, index, content: text }));
    },
    [dispatch, entryId]
  );

  const pickImageFromLibrary = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
      });
      if (!result.canceled && (result as any).assets?.length) {
        const src = (result as any).assets[0].uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlockViaReducer('image', dest);
      } else if (!result.canceled && (result as any).uri) {
        const src = (result as any).uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlockViaReducer('image', dest);
      }
    } catch (e) {
      console.error('Image pick error:', e);
    }
  }, [addBlockViaReducer, copyFileToAppAsync]);

  const takePhoto = useCallback(async () => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Camera permission required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
      });
      if (!result.canceled && (result as any).assets?.length) {
        const src = (result as any).assets[0].uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlockViaReducer('image', dest);
      } else if (!result.canceled && (result as any).uri) {
        const src = (result as any).uri;
        const dest = await copyFileToAppAsync(src, 'jpg');
        addBlockViaReducer('image', dest);
      }
    } catch (e) {
      console.error('Take photo error:', e);
    }
  }, [addBlockViaReducer, copyFileToAppAsync]);

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
        addBlockViaReducer('audio', dest);
      } else console.warn('No recording uri after stop');
    } catch (e) {
      console.error('Stop recording error:', e);
    }
  }, [recorder, addBlockViaReducer, copyFileToAppAsync]);

  // Focus helper
  const focusLastTextInput = useCallback(() => {
    const lastText = [...blocks].reverse().find((b) => b.type === 'text');
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
        } catch (e: any) {
          console.warn('Scroll to index error:', e);
        }
        setTimeout(() => inputRefs.current[lastText.id]?.focus?.(), 90);
        return;
      }
    }
    addTextBlockOptimistic();
  }, [blocks, addTextBlockOptimistic]);

  // render item
  const renderItem = ({ item, index }: { item: Block; index: number }) => {
    if (item.type === 'text') {
      return (
        <TextInput
          ref={(r: any) => (inputRefs.current[item.id] = r)}
          className="bg-transparent text-gray-900 my-2 rounded-md p-1 text-lg"
          multiline
          value={item.content}
          onChangeText={(t) => updateTextAtIndex(index, t)}
          placeholder="Write here..."
          placeholderTextColor="#9CA3AF"
          onFocus={() =>
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({ index, animated: true });
              } catch (e: any) {
                console.warn('Scroll to index error:', e);
              }
            }, 80)
          }
        />
      );
    }
    if (item.type === 'image')
      return <Image source={{ uri: item.content }} className="my-2 h-72 w-full rounded-lg" />;
    if (item.type === 'audio') return <AudioPlayer uri={item.content} />;
    return null;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inner,
          {
            paddingBottom: Animated.add(
              animatedBottom,
              new Animated.Value(TOOLBAR_HEIGHT + BASE_BOTTOM_PADDING)
            ),
          },
        ]}>
        <Pressable style={{ flex: 1 }} onPress={focusLastTextInput}>
          <FlatList
            ref={listRef}
            data={blocks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            initialNumToRender={6}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
        </Pressable>
      </Animated.View>

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
  container: { 
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: { 
    flex: 1, 
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  toolbarWrapper: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    backgroundColor: 'transparent',
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    marginHorizontal: 0,
    borderRadius: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
