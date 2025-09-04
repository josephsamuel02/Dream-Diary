// DiaryInputBody.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Button,
  Image,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

type Block =
  | { type: 'text'; content: string }
  | { type: 'image'; content: string }
  | { type: 'audio'; content: string };

function formatTime(seconds = 0) {
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

/** Small audio player component that uses expo-audio hooks at top level */
function AudioPlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const playing = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;

  const onTogglePlay = useCallback(() => {
    try {
      if (playing) player.pause();
      else {
        if (duration && currentTime >= duration - 0.3) player.seekTo(0);
        player.play();
      }
    } catch (e) {
      console.warn('Playback error:', e);
    }
  }, [playing, player, currentTime, duration]);

  const onReplay = useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('Replay error:', e);
    }
  }, [player]);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <View style={styles.audioContainer}>
      <View style={styles.audioRow}>
        <TouchableOpacity onPress={onTogglePlay} style={styles.playButton}>
          <Text style={styles.playButtonText}>{playing ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>

        <View style={styles.audioInfo}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onReplay} style={styles.replayButton}>
          <Text style={styles.replayText}>⟲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DiaryInputBody() {
  const [blocks, setBlocks] = useState<Block[]>([{ type: 'text', content: '' }]);

  // recorder hook
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => {
    (async () => {
      try {
        // request recording permissions (expo-audio helper)
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Microphone permission required', 'Enable mic access to record audio notes.');
        }

        // set audio mode to allow recording if you need specific behaviour
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: false });

        const imgPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!imgPerm.granted) console.warn('Media library permission denied');
      } catch (e) {
        console.warn('Permission or audio init error:', e);
      }
    })();
  }, []);

  const addBlock = useCallback((type: Block['type'], content = '') => {
    setBlocks((prev) => [...prev, { type, content }, { type: 'text', content: '' }]);
  }, []);

  const updateText = useCallback((index: number, text: string) => {
    setBlocks((prev) => {
      const copy = [...prev];
      copy[index] = { type: 'text', content: text };
      return copy;
    });
  }, []);

  const pickImageFromLibrary = useCallback(async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.length) addBlock('image', result.assets[0].uri);
    } catch (e) {
      console.error('Image pick error:', e);
    }
  }, [addBlock]);

  const takePhoto = useCallback(async () => {
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPerm.granted) {
        Alert.alert('Camera permission required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.length) addBlock('image', result.assets[0].uri);
    } catch (e) {
      console.error('Take photo error:', e);
    }
  }, [addBlock]);

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
      if (uri) addBlock('audio', uri);
      else console.warn('No recording uri after stop');
    } catch (e) {
      console.error('Stop recording error:', e);
    }
  }, [recorder, addBlock]);

  const renderItem = ({ item, index }: { item: Block; index: number }) => {
    if (item.type === 'text') {
      return (
        <TextInput
          style={styles.textInput}
          multiline
          value={item.content}
          onChangeText={(t) => updateText(index, t)}
          placeholder="Write here..."
        />
      );
    }
    if (item.type === 'image') return <Image source={{ uri: item.content }} style={styles.image} />;
    if (item.type === 'audio') return <AudioPlayer uri={item.content} />;
    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={blocks}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        initialNumToRender={10}
      />

      <View style={styles.controls}>
        <View style={styles.row}>
          <Button title="Pick Image" onPress={pickImageFromLibrary} />
          <View style={styles.spacer} />
          <Button title="Take Photo" onPress={takePhoto} />
        </View>

        <View style={[styles.row, { marginTop: 10 }]}>
          <Button
            title={recorderState.isRecording ? 'Stop Recording' : 'Record Voice'}
            color={recorderState.isRecording ? '#e53935' : undefined}
            onPress={() => (recorderState.isRecording ? stopRecording() : startRecording())}
          />
          <View style={styles.spacer} />
          <Button title="Insert Text Block" onPress={() => addBlock('text', '')} />
        </View>
      </View>
    </View>
  );
}

/* styles (same as before) */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  textInput: {
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginVertical: 10,
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginVertical: 10,
    resizeMode: 'cover',
  },
  controls: { paddingVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spacer: { width: 12 },
  audioContainer: { marginVertical: 8, backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8 },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 46 / 2,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playButtonText: { color: '#fff', fontSize: 18 },
  audioInfo: { flex: 1 },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#111827' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeText: { fontSize: 12, color: '#374151' },
  replayButton: { marginLeft: 10, padding: 6, borderRadius: 6, backgroundColor: '#fff' },
  replayText: { fontSize: 16, color: '#111827' },
});
