import React, { useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

type Props = {
  pickImageFromLibrary: () => Promise<void>;
  takePhoto: () => Promise<void>;
  recorderIsRecording: boolean;
  toggleRecording: () => void | Promise<void>;
};

export default function DiaryToolbar({
  pickImageFromLibrary,
  takePhoto,
  recorderIsRecording,
  toggleRecording,
}: Props) {
  return (
    <View style={localStyles.row}>
      <TouchableOpacity onPress={pickImageFromLibrary} hitSlop={8} style={localStyles.iconBtn}>
        <Ionicons name="images-outline" size={28} color="#333" />
        <Text style={localStyles.iconLabel}>Image</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={takePhoto} hitSlop={8} style={localStyles.iconBtn}>
        <Ionicons name="camera-outline" size={28} color="#333" />
        <Text style={localStyles.iconLabel}>Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => toggleRecording()} hitSlop={8} style={localStyles.iconBtn}>
        <MaterialIcons
          name={recorderIsRecording ? 'stop-circle' : 'keyboard-voice'}
          size={32}
          color={recorderIsRecording ? '#e53935' : '#333'}
        />
        <Text style={localStyles.iconLabel}>{recorderIsRecording ? 'Stop' : 'Voice'}</Text>
      </TouchableOpacity>
    </View>
  );
}

/* Reusable AudioPlayer component used for audio blocks */
export const AudioPlayer = ({ uri }: { uri: string }) => {
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
    <View style={localStyles.audioCard}>
      <View style={localStyles.audioRow}>
        <TouchableOpacity onPress={onTogglePlay} style={localStyles.playBtn}>
          <Text style={localStyles.playText}>{playing ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={localStyles.progressTrack}>
            <View style={[localStyles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={localStyles.timeRow}>
            <Text style={localStyles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={localStyles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onReplay} style={localStyles.replayBtn}>
          <Text style={localStyles.replayText}>⟲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// local helper used above
const formatTime = (seconds = 0) => {
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
    marginVertical: 8,
  },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  iconLabel: { marginTop: 4, fontSize: 11, color: '#374151' },

  audioCard: {
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    elevation: 2,
  },
  audioRow: { flexDirection: 'row', alignItems: 'center' },
  playBtn: {
    marginRight: 10,
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7ede5',
  },
  playText: { fontSize: 18, color: '#111' },

  progressTrack: { height: 3, backgroundColor: 'silver', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, backgroundColor: '#000' },

  timeRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 12, color: '#4B5563' },

  replayBtn: { marginLeft: 8, padding: 6, borderRadius: 6, backgroundColor: '#fff' },
  replayText: { fontSize: 16, color: '#111' },
});
