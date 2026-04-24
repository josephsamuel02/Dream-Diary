import React from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderMenuProps {
  visible: boolean;
  onClose: () => void;
}

const HeaderMenu = ({ visible, onClose }: HeaderMenuProps) => {
  const router = useRouter();
  const themeColors = useAppSelector(selectThemeColors);
  const insets = useSafeAreaInsets();
  
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topPadding = Math.max(insets.top, statusBarHeight);

  const menuItems = [
    {
      icon: 'color-palette-outline' as const,
      label: 'Appearance',
      sublabel: 'Customize colors & background',
      onPress: () => {
        onClose();
        router.push('/Themes');
      },
    },
    {
      icon: 'settings-outline' as const,
      label: 'Settings',
      sublabel: 'App preferences',
      onPress: () => {
        onClose();
        router.push('/Settings');
      },
    },
    {
      icon: 'person-outline' as const,
      label: 'Account',
      sublabel: 'Profile & data',
      onPress: () => {
        onClose();
        router.push('/Account');
      },
    },
    {
      icon: 'information-circle-outline' as const,
      label: 'About us',
      sublabel: 'App info & contact',
      onPress: () => {
        onClose();
        router.push('/About');
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} />

      <View style={[styles.menuContainer, { top: topPadding + 60 }]}>
        <View style={[styles.menuCard, { backgroundColor: themeColors.surface }]}>
          {/* Menu Header */}
          <View style={styles.menuHeader}>
            <Text style={[styles.menuTitle, { color: themeColors.text }]}>Menu</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={themeColors.text} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}>
              <View style={[styles.menuIconCircle, { backgroundColor: themeColors.accent + '15' }]}>
                <Ionicons name={item.icon} size={20} color={themeColors.accent} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemLabel, { color: themeColors.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.menuItemSublabel, { color: themeColors.text, opacity: 0.5 }]}>
                  {item.sublabel}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.text} style={{ opacity: 0.3 }} />
            </TouchableOpacity>
          ))}

          {/* App Version */}
          <View style={styles.menuFooter}>
            <Text style={[styles.versionText, { color: themeColors.text, opacity: 0.3 }]}>
              Dream Diary v1.0.0
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
  },
  menuCard: {
    width: 260,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
  },
  menuItemSublabel: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'RobotoRegular',
  },
  menuFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  versionText: {
    fontSize: 11,
    fontFamily: 'RobotoRegular',
  },
});

export default HeaderMenu;
