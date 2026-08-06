import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import {
  selectNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
} from '~/store/slices/notificationSlice';
import { formatMoodTime } from '~/util/moods';

const NotificationItem = ({
  notification,
  onPress,
  themeColors,
}: {
  notification: Notification;
  onPress: (n: Notification) => void;
  themeColors: {
    accent: string;
    text: string;
    surface: string;
    background: string;
  };
}) => {
  const isAchievement = notification.type === 'achievement';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(notification)}
      style={[
        styles.notificationCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: notification.read ? themeColors.text + '05' : themeColors.accent + '30',
        },
      ]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isAchievement ? '#F5B54420' : themeColors.accent + '15' },
        ]}>
        <Ionicons
          name={isAchievement ? 'trophy' : 'notifications'}
          size={22}
          color={isAchievement ? '#F5B544' : themeColors.accent}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: themeColors.text }]}>{notification.title}</Text>
          {!notification.read && <View style={[styles.unreadDot, { backgroundColor: '#EF4444' }]} />}
        </View>
        <Text style={[styles.message, { color: themeColors.text, opacity: 0.7 }]}>
          {notification.message}
        </Text>
        <Text style={[styles.time, { color: themeColors.text, opacity: 0.4 }]}>
          {new Date(notification.timestamp).toLocaleDateString()} at {formatMoodTime(notification.timestamp)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={themeColors.text + '30'} />
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const themeColors = useAppSelector(selectThemeColors);
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    // Mark all as read when leaving the screen
    return () => {
      dispatch(markAllAsRead());
    };
  }, [dispatch]);

  const handleNotificationPress = (n: Notification) => {
    dispatch(markAsRead(n.id));
    if (n.type === 'achievement') {
      router.push('/Achievements');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: themeColors.surface }]}>
              <Ionicons name="notifications-off-outline" size={40} color={themeColors.text + '20'} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No notifications yet</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.text, opacity: 0.5 }]}>
              We'll let you know when something important happens!
            </Text>
          </View>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onPress={handleNotificationPress}
              themeColors={themeColors}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 13,
    fontFamily: 'RobotoRegular',
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    fontFamily: 'RobotoRegular',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'RobotoRegular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default NotificationsScreen;
