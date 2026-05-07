import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'achievement' | 'system' | 'reminder';
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const newNotification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(newNotification);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearAll: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAll } =
  notificationSlice.actions;

export const selectNotifications = (state: { notifications: NotificationState }) =>
  state.notifications.notifications;

export const selectUnreadCount = (state: { notifications: NotificationState }) =>
  state.notifications.notifications.filter((n) => !n.read).length;

export default notificationSlice.reducer;
