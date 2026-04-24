import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export type DialogButton = {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void;
};

export type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: DialogButton[];
  onDismiss?: () => void;
};

export default function AppDialog({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
}: AppDialogProps) {
  const themeColors = useAppSelector(selectThemeColors);
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const getButtonBg = (style?: DialogButtonStyle) => {
    if (style === 'destructive') return themeColors.error;
    if (style === 'cancel') return themeColors.surface;
    return themeColors.accent;
  };

  const getButtonTextColor = (style?: DialogButtonStyle) => {
    if (style === 'cancel') return themeColors.text + 'CC';
    return '#fff';
  };

  const primaryButtons = buttons.filter((b) => b.style !== 'cancel');
  const cancelButton = buttons.find((b) => b.style === 'cancel');
  const orderedButtons = cancelButton ? [...primaryButtons, cancelButton] : primaryButtons;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.text + '12',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}>
          {/* Icon strip — accent line at top */}
          <View style={[styles.accentBar, { backgroundColor: themeColors.accent }]} />

          <Pressable style={styles.body}>
            <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
            {!!message && (
              <Text style={[styles.message, { color: themeColors.text + 'B0' }]}>{message}</Text>
            )}
          </Pressable>

          <View style={[styles.divider, { backgroundColor: themeColors.text + '12' }]} />

          <View style={styles.buttonRow}>
            {orderedButtons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.onPress}
                activeOpacity={0.75}
                style={[
                  styles.button,
                  { backgroundColor: getButtonBg(btn.style) },
                  orderedButtons.length === 1 && styles.buttonFull,
                  i === 0 && orderedButtons.length > 1 && styles.buttonLeft,
                  i === orderedButtons.length - 1 && orderedButtons.length > 1 && styles.buttonRight,
                ]}>
                <Text
                  style={[
                    styles.buttonText,
                    { color: getButtonTextColor(btn.style) },
                    btn.style === 'destructive' && styles.buttonTextDestructive,
                    btn.style === 'cancel' && styles.buttonTextCancel,
                  ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 20,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'RobotoRegular',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonLeft: {},
  buttonRight: {},
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
  },
  buttonTextDestructive: {
    fontWeight: '700',
  },
  buttonTextCancel: {
    fontWeight: '500',
  },
});
