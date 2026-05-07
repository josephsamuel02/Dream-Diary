import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DiarySlice from './slices/diarySlice';
import ThemeSlice from './slices/themeSlice';
import SettingsSlice from './slices/settingsSlice';
import NotificationSlice from './slices/notificationSlice';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['diary', 'theme', 'settings', 'notifications'], // persist the diary, theme, settings and notifications slices
};

const rootReducer = combineReducers({
  diary: DiarySlice,
  theme: ThemeSlice,
  settings: SettingsSlice,
  notifications: NotificationSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: false,
  enhancers: (getDefaultEnhancers) => getDefaultEnhancers().concat(devToolsEnhancer()),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // required for redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// RootState & AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
