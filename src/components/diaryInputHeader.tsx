import { View, Text, TouchableOpacity, Platform, StatusBar, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import HeaderMenu from './HeaderMenu';

const DiaryInputHeader = ({ navigation }: { navigation: { goBack: () => void } }) => {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const insets = useSafeAreaInsets();
  const themeColors = useAppSelector(selectThemeColors);
  const [menuOpen, setMenuOpen] = useState(false);

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topPadding = Math.max(insets.top, statusBarHeight);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format date → e.g., Sep 2, 2025
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      const formattedDate = now.toLocaleDateString('en-US', dateOptions);

      // Format time → e.g., 7:55 PM
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      setCurrentDate(formattedDate);
      setCurrentTime(formattedTime);
    };

    updateDateTime(); // run once immediately
    const timer = setInterval(updateDateTime, 1000); // update every second

    return () => clearInterval(timer); // cleanup
  }, []);

  return (
    <LinearGradient
      colors={themeColors.headerGradient}
      locations={[0, 0.4, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.3, y: 1 }}
      style={{
        paddingTop: topPadding + 8,
        paddingBottom: 16,
        paddingHorizontal: 20,
      }}>
      {/* Decorative circles */}
      <View
        style={{
          position: 'absolute',
          right: -32,
          top: -32,
          width: 128,
          height: 128,
          borderRadius: 64,
          backgroundColor: 'rgba(255,255,255,0.1)',
          transform: [{ scale: 1.2 }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 80,
          top: 48,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />

      <View style={styles.headerContent}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Date + Time */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{currentDate}</Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        {/* 3 dots menu button */}
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={styles.menuButton}
          activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
        </TouchableOpacity>

        <HeaderMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
  },
  dateTimeContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontFamily: 'PoppinsBold',
    fontSize: 18,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontFamily: 'RobotoMedium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
});

export default DiaryInputHeader;
