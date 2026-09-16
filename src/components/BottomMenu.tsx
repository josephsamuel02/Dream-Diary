import React from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomMenuProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomMenu = ({ visible, onClose }: BottomMenuProps) => {
  const router = useRouter();
  const themeColors = useAppSelector(selectThemeColors);
  const insets = useSafeAreaInsets();

  const menuItems = [
    {
      icon: 'color-palette-outline' as const,
      label: 'Appearance',
      sublabel: 'Colors & background',
      onPress: () => {
        onClose();
        router.push('/Themes');
      },
    },
    {
      icon: 'trophy-outline' as const,
      label: 'Achievements',
      sublabel: 'Badges & milestones',
      onPress: () => {
        onClose();
        router.push('/Achievements');
      },
    },
    {
      icon: 'stats-chart-outline' as const,
      label: 'Insights',
      sublabel: 'Mood & writing trends',
      onPress: () => {
        onClose();
        router.push('/Insights');
      },
    },
    {
      icon: 'book-outline' as const,
      label: 'Personality test',
      sublabel: 'Coming soon',
      onPress: () => {
        onClose();
        // Show coming soon alert
        Alert.alert('Coming Soon', 'The personality test feature is coming soon! Stay tuned for this exciting addition to your journaling experience.');
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />

      <View style={[styles.menuContainer, { backgroundColor: themeColors.surface, paddingBottom: insets.bottom + 20 }]}>
        {/* Handle bar */}
        <View style={[styles.handle, { backgroundColor: themeColors.text + '20' }]} />

        <View style={styles.menuHeader}>
          <Text style={[styles.menuTitle, { color: themeColors.text }]}>Explore</Text>
          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: themeColors.text + '10' }]}>
            <Ionicons name="close" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, { backgroundColor: themeColors.background + '50', borderColor: themeColors.accent + '10' }]}
              onPress={item.onPress}
              activeOpacity={0.7}>
              <View style={[styles.menuIconCircle, { backgroundColor: themeColors.accent + '15' }]}>
                <Ionicons name={item.icon} size={24} color={themeColors.accent} />
              </View>
              <Text style={[styles.menuItemLabel, { color: themeColors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.menuItemSublabel, { color: themeColors.text, opacity: 0.5 }]}>
                {item.sublabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  menuItem: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  menuIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
    textAlign: 'center',
  },
  menuItemSublabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'RobotoRegular',
    textAlign: 'center',
  },
});

export default BottomMenu;
