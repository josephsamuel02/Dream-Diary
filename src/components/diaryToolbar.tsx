import { useCallback, useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

type Props = {
  pickImageFromLibrary: () => Promise<void>;
  takePhoto: () => Promise<void>;
  recorderIsRecording: boolean;
  toggleRecording: () => void | Promise<void>;
  expanded: boolean;
  onToggleExpand: () => void;
};

export default function DiaryToolbar({
  pickImageFromLibrary,
  takePhoto,
  recorderIsRecording,
  toggleRecording,
  expanded,
  onToggleExpand,
}: Props) {
  const themeColors = useAppSelector(selectThemeColors);

  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for recording
  useEffect(() => {
    if (recorderIsRecording) {
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
  }, [recorderIsRecording, pulseAnim]);

  // Sync animations with expanded prop
  useEffect(() => {
    const toValue = expanded ? 1 : 0;
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
  }, [expanded, expandAnim, rotateAnim]);

  const menu1TranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  const menu1Opacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const menu2TranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });
  const menu2Opacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const menu3TranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -210],
  });
  const menu3Opacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={localStyles.fabContainerWrapper}>
      {/* Voice */}
      <Animated.View
        style={[
          localStyles.actionButton,
          { transform: [{ translateY: menu3TranslateY }], opacity: menu3Opacity },
        ]}>
        <TouchableOpacity
          onPress={() => {
            toggleRecording();
          }}
          activeOpacity={0.8}
          style={localStyles.secondaryButton}>
          <Animated.View
            style={[
              localStyles.secondaryButtonInner,
              { backgroundColor: themeColors.surface },
              recorderIsRecording && { backgroundColor: '#EF4444' },
              { transform: [{ scale: recorderIsRecording ? pulseAnim : 1 }] },
            ]}>
            <MaterialIcons
              name={recorderIsRecording ? 'stop-circle' : 'mic-none'}
              size={18}
              color={recorderIsRecording ? '#fff' : themeColors.accent}
            />
          </Animated.View>
          <Text style={[localStyles.buttonLabel, { color: themeColors.text }]}>
            {recorderIsRecording ? 'Stop' : 'Voice'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Photo */}
      <Animated.View
        style={[
          localStyles.actionButton,
          { transform: [{ translateY: menu2TranslateY }], opacity: menu2Opacity },
        ]}>
        <TouchableOpacity
          onPress={() => {
            onToggleExpand();
            takePhoto();
          }}
          activeOpacity={0.8}
          style={localStyles.secondaryButton}>
          <View
            style={[localStyles.secondaryButtonInner, { backgroundColor: themeColors.surface }]}>
            <Feather name="camera" size={18} color={themeColors.accent} />
          </View>
          <Text style={[localStyles.buttonLabel, { color: themeColors.text }]}>Photo</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Image */}
      <Animated.View
        style={[
          localStyles.actionButton,
          { transform: [{ translateY: menu1TranslateY }], opacity: menu1Opacity },
        ]}>
        <TouchableOpacity
          onPress={() => {
            onToggleExpand();
            pickImageFromLibrary();
          }}
          activeOpacity={0.8}
          style={localStyles.secondaryButton}>
          <View
            style={[localStyles.secondaryButtonInner, { backgroundColor: themeColors.surface }]}>
            <Ionicons name="images-outline" size={18} color={themeColors.accent} />
          </View>
          <Text style={[localStyles.buttonLabel, { color: themeColors.text }]}>Image</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB */}
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.9} style={localStyles.fabContainer}>
        <LinearGradient
          colors={[themeColors.headerGradient[1], themeColors.headerGradient[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[localStyles.fab, { shadowColor: themeColors.accent }]}>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons name="add" size={26} color="#fff" />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

/* Reusable AudioPlayer component used for audio blocks */
export const AudioPlayer = ({ uri }: { uri: string }) => {
  const themeColors = useAppSelector(selectThemeColors);
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const playing = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;

  // Ensure audio mode is set for playback when component mounts
  useEffect(() => {
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch((e) =>
      console.warn('Failed to set audio mode for playback:', e)
    );
  }, []);

  const onTogglePlay = useCallback(async () => {
    try {
      if (playing) {
        player.pause();
      } else {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        if (duration && currentTime >= duration - 0.3) player.seekTo(0);
        player.play();
      }
    } catch (e) {
      console.warn('Playback error:', e);
    }
  }, [playing, player, currentTime, duration]);

  const onReplay = useCallback(async () => {
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.warn('Replay error:', e);
    }
  }, [player]);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <View style={[localStyles.audioCard, { backgroundColor: themeColors.surface }]}>
      <View style={localStyles.audioRow}>
        <TouchableOpacity
          onPress={onTogglePlay}
          style={[localStyles.playBtn, { backgroundColor: themeColors.accent + '20' }]}>
          <Text style={[localStyles.playText, { color: themeColors.accent }]}>
            {playing ? '❚❚' : '▶'}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={[localStyles.progressTrack, { backgroundColor: themeColors.text + '20' }]}>
            <View
              style={[
                localStyles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: themeColors.accent },
              ]}
            />
          </View>
          <View style={localStyles.timeRow}>
            <Text style={[localStyles.timeText, { color: themeColors.text + '80' }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[localStyles.timeText, { color: themeColors.text + '80' }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onReplay}
          style={[localStyles.replayBtn, { backgroundColor: themeColors.accent + '15' }]}>
          <Text style={[localStyles.replayText, { color: themeColors.accent }]}>⟲</Text>
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
  fabContainerWrapper: {
    position: 'relative',
    alignItems: 'center',
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

  audioCard: {
    marginVertical: 8,
    borderRadius: 12,
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
  },
  playText: { fontSize: 18 },

  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3 },

  timeRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 12 },

  replayBtn: { marginLeft: 8, padding: 6, borderRadius: 6 },
  replayText: { fontSize: 16 },
});
