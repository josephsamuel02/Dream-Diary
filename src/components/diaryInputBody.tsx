// app/components/DiaryInputBody.tsx
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';

import {
  View,
  TextInput,
  Image,
  Platform,
  Keyboard,
  Animated,
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDialog } from '~/hooks/useAppDialog';
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
  removeBlockFromEntry,
  selectEntryById,
} from '~/store/slices/diarySlice';
import { selectThemeColors } from '~/store/slices/themeSlice';
import type { DiaryFontKey } from '~/store/slices/settingsSlice';

type Block = { id: string; type: 'text' | 'image' | 'audio'; content: string };

const TOOLBAR_HEIGHT = 56;
const BASE_BOTTOM_PADDING = 0;
const MEDIA_DIR = `${FileSystem.documentDirectory}diary_media/`;

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function DiaryInputBody({
  entryId,
  diaryFont,
  diaryFontSize = 16,
}: {
  entryId: string;
  diaryFont?: DiaryFontKey;
  diaryFontSize?: number;
}) {
  // Keep line-height proportional so larger sizes don't look cramped.
  const bodyLineHeight = Math.round(diaryFontSize * 1.55);
  const dispatch = useAppDispatch();
  const themeColors = useAppSelector(selectThemeColors);
  const { showDialog, dialogElement } = useAppDialog();
  // pull the entry from store
  const entry = useAppSelector((s) => selectEntryById(s, entryId));
  const blocks = useMemo(() => entry?.blocks ?? [], [entry?.blocks]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const animatedBottom = useRef(new Animated.Value(0)).current;
  const recordingPulse = useRef(new Animated.Value(1)).current;
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const listRef = useRef<FlatList<Block> | null>(null);

  // Toolbar expanded state
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  
  const toggleToolbarExpand = useCallback(() => {
    setToolbarExpanded((prev) => !prev);
  }, []);
  const closeToolbarIfNotRecording = useCallback(() => {
    if (!recorderState.isRecording && toolbarExpanded) {
      setToolbarExpanded(false);
    }
  }, [recorderState.isRecording, toolbarExpanded]);

  // Image modal handlers
  const openImageModal = useCallback((imageUri: string) => {
    setSelectedImageUri(imageUri);
    setImageModalVisible(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalVisible(false);
    setSelectedImageUri(null);
  }, []);

  // Recording pulse animation
  useEffect(() => {
    if (recorderState.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingPulse.setValue(1);
    }
  }, [recorderState.isRecording, recordingPulse]);

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
          showDialog({
            title: 'Microphone Access Required',
            message: 'Enable mic access in your device settings to record audio notes.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
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
    const onShow = (e: { endCoordinates: { height: number } }) => {
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

  // When a text block loses focus, drop it if it's empty AND it isn't
  // the last block in the entry. The trailing block is always kept so
  // the user has somewhere to type next; intermediate empties (left
  // behind after the user clears a paragraph between media items) get
  // pruned automatically.
  const pruneIfEmptyOnBlur = useCallback(
    (blockId: string) => {
      const current = blocks;
      const idx = current.findIndex((b) => b.id === blockId);
      if (idx === -1) return;
      const isLast = idx === current.length - 1;
      if (isLast) return;
      const blk = current[idx];
      if (blk.type !== 'text') return;
      if (blk.content.trim() !== '') return;
      dispatch(removeBlockFromEntry({ entryId, blockId }));
    },
    [blocks, dispatch, entryId]
  );

  const pickImageFromLibrary = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Disabled cropping as requested
        quality: 0.8,
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
        showDialog({
          title: 'Camera Access Required',
          message: 'Enable camera access in your device settings to take photos.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Disabled cropping as requested
        quality: 0.8,
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
      showDialog({
        title: 'Recording Failed',
        message: 'Could not start recording. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      await recorder.stop();
      // Reset audio mode for playback after recording stops
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
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
          ref={(r: TextInput | null) => {
            inputRefs.current[item.id] = r;
          }}
          multiline
          value={item.content}
          onChangeText={(t) => updateTextAtIndex(index, t)}
          placeholder="Write here..."
          placeholderTextColor={themeColors.text + '35'}
          style={{
            backgroundColor: 'transparent',
            color: themeColors.text,
            fontSize: diaryFontSize,
            lineHeight: bodyLineHeight,
            marginVertical: 6,
            paddingHorizontal: 4,
            paddingVertical: 2,
            fontFamily: diaryFont ?? 'RobotoRegular',
          }}
          onFocus={() =>
            setTimeout(() => {
              try {
                listRef.current?.scrollToIndex({ index, animated: true });
              } catch (e: any) {
                console.warn('Scroll to index error:', e);
              }
            }, 80)
          }
          onBlur={() => pruneIfEmptyOnBlur(item.id)}
        />
      );
    }
    if (item.type === 'image')
      return (
        <View style={{ marginVertical: 8 }}>
          <Pressable
            onPress={() => openImageModal(item.content)}
            onLongPress={() =>
              showDialog({
                title: 'Delete Image',
                message: 'Remove this image from the entry?',
                buttons: [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => dispatch(removeBlockFromEntry({ entryId, blockId: item.id })),
                  },
                ],
              })
            }
            style={styles.imageContainer}
          >
            <Image 
              source={{ uri: item.content }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="expand-outline" size={20} color="#fff" />
              <Text style={styles.imageOverlayText}>Tap to view full size</Text>
            </View>
          </Pressable>
        </View>
      );
    if (item.type === 'audio')
      return (
        <Pressable
          onLongPress={() =>
            showDialog({
              title: 'Delete Audio',
              message: 'Remove this audio clip from the entry?',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => dispatch(removeBlockFromEntry({ entryId, blockId: item.id })),
                },
              ],
            })
          }>
          <AudioPlayer uri={item.content} />
        </Pressable>
      );
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Recording lockdown overlay - blocks all interactions during recording */}
      {recorderState.isRecording && (
        <Pressable 
          style={styles.recordingLockdownOverlay}
          onPress={() => recorderState.isRecording ? stopRecording() : startRecording()}
        >
          <View style={styles.recordingIndicator}>
            <Animated.View style={[styles.recordingIcon, { transform: [{ scale: recordingPulse }] }]}>
              <Ionicons name="mic" size={32} color="#fff" />
            </Animated.View>
            <Text style={styles.recordingText}>Recording in progress...</Text>
            <Text style={styles.recordingSubtext}>Tap anywhere to stop recording</Text>
          </View>
        </Pressable>
      )}

      {/* Backdrop overlay to close toolbar when tapping outside */}
      {toolbarExpanded && !recorderState.isRecording && (
        <Pressable style={styles.backdrop} onPress={closeToolbarIfNotRecording} />
      )}

      <Animated.View
        style={[
          styles.inner,
          {
            paddingBottom: Animated.add(
              animatedBottom,
              new Animated.Value(BASE_BOTTOM_PADDING + 80)
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
        <DiaryToolbar
          pickImageFromLibrary={pickImageFromLibrary}
          takePhoto={takePhoto}
          recorderIsRecording={recorderState.isRecording}
          toggleRecording={() => (recorderState.isRecording ? stopRecording() : startRecording())}
          expanded={toolbarExpanded}
          onToggleExpand={toggleToolbarExpand}
        />
      </Animated.View>
      {dialogElement}
      
      {/* Full-size Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <SafeAreaView style={styles.imageModalContainer}>
          <Pressable style={styles.imageModalBackdrop} onPress={closeImageModal}>
            <View style={styles.imageModalContent}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                {selectedImageUri && (
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={styles.fullSizeImage}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
              
              {/* Close button */}
              <Pressable style={styles.imageModalCloseButton} onPress={closeImageModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recordingLockdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  recordingIndicator: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  recordingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  recordingSubtext: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'RobotoRegular',
    opacity: 0.8,
    textAlign: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
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
    right: 20,
    bottom: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'RobotoRegular',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullSizeImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
