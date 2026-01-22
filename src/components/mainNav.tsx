import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';

const CustomHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const themeColors = useAppSelector(selectThemeColors);

  const [fontsLoaded] = useFonts({
    GreatVibes: GreatVibes_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topPadding = Math.max(insets.top, statusBarHeight);

  const menuItems = [
    {
      icon: 'color-palette-outline' as const,
      label: 'Themes',
      sublabel: 'Customize colors & background',
      onPress: () => {
        setMenuOpen(false);
        router.push('/Themes');
      },
    },
    {
      icon: 'settings-outline' as const,
      label: 'Settings',
      sublabel: 'App preferences',
      onPress: () => {
        setMenuOpen(false);
        // TODO: Navigate to settings
        alert('Settings coming soon!');
      },
    },
    {
      icon: 'person-outline' as const,
      label: 'Account',
      sublabel: 'Profile & data',
      onPress: () => {
        setMenuOpen(false);
        router.push('/About');
      },
    },
  ];

  return (
    <>
      <LinearGradient
        colors={themeColors.headerGradient}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={{
          paddingTop: topPadding + 8,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}>
        {/* Decorative circles */}
        <View
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          style={{ transform: [{ scale: 1.2 }] }}
        />
        <View className="absolute right-20 top-12 h-16 w-16 rounded-full bg-white/5" />

        <View className="flex-row items-center justify-between">
          {/* Logo & Title */}
          <View className="flex-row items-center">
            {/* <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-white/25 shadow-lg">
              <Text className="text-2xl">🌙</Text>
            </View> */}
            <View>
              <Text
                style={{
                  fontFamily: 'GreatVibes',
                  fontSize: 27,
                  color: '#fff',
                  textShadowColor: 'rgba(0,0,0,0.4)',
                  textShadowOffset: { width: 1, height: 2 },
                  textShadowRadius: 4,
                  letterSpacing: 1,
                }}>
                Dream Diary
              </Text>
              <Text className="mt-[-6px] font-roboto text-[7px] uppercase tracking-[3px] text-white/80">
                ✦ Capture your days ✦
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
              activeOpacity={0.7}>
              <Ionicons name="search-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
              activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              {/* Notification badge */}
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuOpen(true)}
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.15)' }]}
              activeOpacity={0.7}>
              <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuOpen(false)} />

        <View style={[styles.menuContainer, { top: topPadding + 60 }]}>
          <View style={[styles.menuCard, { backgroundColor: themeColors.surface }]}>
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: themeColors.text }]}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}>
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
    </>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
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

export default CustomHeader;
