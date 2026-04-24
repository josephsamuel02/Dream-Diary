import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
} from 'react-native';
import { useAppDialog } from '~/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '~/lib/supabase';
import type { UserProfile } from '~/lib/database.types';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { selectThemeColors } from '~/store/slices/themeSlice';
import {
  selectSettings,
  updateAccountProfile,
  updateProfilePhoto,
  setCloudSync,
  setLastSyncedAt,
} from '~/store/slices/settingsSlice';
import { selectEntries } from '~/store/slices/diarySlice';
import { syncAllEntries } from '~/util/diarySync';

// ── InputField must live OUTSIDE Account so it has a stable
// component identity across re-renders. Defining it inside the
// component causes React to unmount/remount the TextInput on every
// keystroke (new function type = new component), which closes the
// keyboard immediately.
interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightIconPress,
}: InputFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          style={styles.input}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.inputRight}>
            <Ionicons name={rightIcon} size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

type AuthTab = 'signin' | 'signup';

export default function Account() {
  const dispatch = useAppDispatch();
  const themeColors = useAppSelector(selectThemeColors);
  const settings = useAppSelector(selectSettings);
  const entries = useAppSelector(selectEntries);

  // ── Auth state ──────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // ── Auth form state ─────────────────────────────────────────
  const [tab, setTab] = useState<AuthTab>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // ── Profile edit state ──────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // ── Sync state ──────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const { showDialog, dialogElement } = useAppDialog();

  // ── Photo upload state ──────────────────────────────────────
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ── Bootstrap: get session & listen for changes ─────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch profile whenever session changes ──────────────────
  const fetchProfile = useCallback(async (userId: string, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
        dispatch(updateAccountProfile({ username: data.username, email: data.email }));
        return;
      }

      // Row may not exist yet (race with sign-up insert); wait and retry
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    } else {
      setProfile(null);
    }
  }, [session, fetchProfile]);

  // ── Sign Up ─────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!authUsername.trim()) {
      showDialog({ title: 'Missing Field', message: 'Please enter a username.', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }
    if (!authEmail.trim()) {
      showDialog({ title: 'Missing Field', message: 'Please enter your email.', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }
    if (authPassword.length < 6) {
      showDialog({ title: 'Weak Password', message: 'Password must be at least 6 characters.', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }
    if (authPassword !== confirmPassword) {
      showDialog({ title: 'Mismatch', message: 'Passwords do not match.', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }

    setAuthLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail.trim().toLowerCase(),
        password: authPassword,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('Sign up failed. Please try again.');

      // Insert into public.user and return the created row
      const { data: profileData, error: profileError } = await supabase
        .from('user')
        .insert({
          id: data.user.id,
          email: authEmail.trim().toLowerCase(),
          username: authUsername.trim(),
          about: '',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // If Supabase issued a session immediately (no email confirmation required),
      // set the profile directly so it shows without waiting for the auth listener.
      if (data.session && profileData) {
        setProfile(profileData as UserProfile);
        dispatch(updateAccountProfile({
          username: (profileData as UserProfile).username,
          email: (profileData as UserProfile).email,
        }));
      }

      showDialog({
        title: 'Account Created!',
        message: 'Welcome to Dream Diary. Check your email to confirm your account if required.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      resetAuthForm();
    } catch (err: any) {
      showDialog({ title: 'Sign Up Failed', message: err.message ?? 'Something went wrong.', buttons: [{ text: 'OK', style: 'default' }] });
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Sign In ─────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!authEmail.trim() || !authPassword) {
      showDialog({ title: 'Missing Fields', message: 'Please enter your email and password.', buttons: [{ text: 'OK', style: 'default' }] });
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim().toLowerCase(),
        password: authPassword,
      });
      if (error) throw error;
      resetAuthForm();
    } catch (err: any) {
      showDialog({ title: 'Sign In Failed', message: err.message ?? 'Invalid credentials.', buttons: [{ text: 'OK', style: 'default' }] });
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Sign Out ────────────────────────────────────────────────
  const handleSignOut = () => {
    showDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            setProfile(null);
          },
        },
      ],
    });
  };

  // ── Delete Account ──────────────────────────────────────────
  const handleDeleteAccount = () => {
    showDialog({
      title: 'Delete Account?',
      message: 'This will permanently delete your account and all your diary data. This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: () => {
            showDialog({
              title: 'Are You Absolutely Sure?',
              message: 'Your account and all diary entries will be erased forever. There is no way to recover this data.',
              buttons: [
                { text: 'Go Back', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const userId = session?.user?.id;
                      if (!userId) return;
                      await supabase.from('user').delete().eq('id', userId);
                      await supabase.auth.admin?.deleteUser?.(userId);
                      await supabase.auth.signOut();
                      setProfile(null);
                    } catch (err: any) {
                      showDialog({
                        title: 'Error',
                        message: err.message ?? 'Could not delete account. Please contact support.',
                        buttons: [{ text: 'OK', style: 'default' }],
                      });
                    }
                  },
                },
              ],
            });
          },
        },
      ],
    });
  };

  // ── Save profile edits ──────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    setSaveLoading(true);
    try {
      const { data, error } = await supabase
        .from('user')
        .update({ username: editUsername.trim(), about: editAbout.trim() })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
      dispatch(updateAccountProfile({ username: data.username, email: data.email }));
      setIsEditing(false);
    } catch (err: any) {
      showDialog({ title: 'Save Failed', message: err.message ?? 'Could not update profile.', buttons: [{ text: 'OK', style: 'default' }] });
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Photo picker + Supabase Storage upload ──────────────────
  const handlePickImage = async () => {
    if (!session?.user?.id) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    } as any);

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      // Build a unique storage path: avatars/<user_id>/avatar.<ext>
      const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const filePath = `avatars/${session.user.id}/avatar.${ext}`;
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      // Read the local file as base64, then decode to bytes for upload
      // (fetch() cannot read local file:// URIs in React Native)
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      // Upload to Supabase Storage bucket "Dream Diary"
      const { error: uploadError } = await supabase.storage
        .from('Dream Diary')
        .upload(filePath, bytes, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('Dream Diary')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Save URL to user table
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user')
        .update({ profile_image: publicUrl })
        .eq('id', session.user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setProfile(updatedProfile as UserProfile);
      dispatch(updateProfilePhoto(publicUrl));
    } catch (err: any) {
      showDialog({ title: 'Upload Failed', message: err.message ?? 'Could not upload profile image.', buttons: [{ text: 'OK', style: 'default' }] });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Sync helpers ────────────────────────────────────────────
  const runManualSync = async () => {
    if (!session?.user?.id || !entries?.length) return;
    setSyncing(true);
    try {
      const { synced, failed } = await syncAllEntries(entries, session.user.id);
      dispatch(setLastSyncedAt(new Date().toISOString()));
      showDialog({
        title: 'Sync Complete',
        message: failed > 0
          ? `${synced} entries synced, ${failed} failed. They will retry next time.`
          : `${synced} entries synced successfully.`,
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } catch {
      showDialog({
        title: 'Sync Failed',
        message: 'Could not reach the server. Your entries are saved locally and will sync when you are back online.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleCloudSync = async (val: boolean) => {
    if (val) {
      // Turning ON: run a full sync immediately
      dispatch(setCloudSync(true));
      if (session?.user?.id && entries?.length) {
        setSyncing(true);
        try {
          const { synced, failed } = await syncAllEntries(entries, session.user.id);
          dispatch(setLastSyncedAt(new Date().toISOString()));
          if (failed > 0) {
            showDialog({
              title: 'Partial Sync',
              message: `${synced} entries synced. ${failed} entries will retry automatically when online.`,
              buttons: [{ text: 'OK', style: 'default' }],
            });
          }
        } catch {
          showDialog({
            title: 'Offline',
            message: 'Cloud sync enabled. Your entries will upload automatically when you are back online.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } finally {
          setSyncing(false);
        }
      }
    } else {
      showDialog({
        title: 'Disable Cloud Sync?',
        message: 'Your diary entries will only be stored on this device. Existing cloud data is not deleted.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: () => dispatch(setCloudSync(false)) },
        ],
      });
    }
  };

  const formatLastSynced = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const resetAuthForm = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthUsername('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const startEditing = () => {
    setEditUsername(profile?.username ?? '');
    setEditAbout(profile?.about ?? '');
    setIsEditing(true);
  };

  // ── Loading state ───────────────────────────────────────────
  if (loadingSession) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // NOT signed in → show auth form
  // ══════════════════════════════════════════════════════════════
  if (!session) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={styles.authHero}>
            <View style={[styles.authIconBg, { backgroundColor: themeColors.accent + '15' }]}>
              <Ionicons name="journal" size={40} color={themeColors.accent} />
            </View>
            <Text style={[styles.authTitle, { color: themeColors.text }]}>Dream Diary</Text>
            <Text style={[styles.authSubtitle, { color: themeColors.text }]}>
              {tab === 'signin' ? 'Welcome back, dreamer' : 'Start your journey today'}
            </Text>
          </View>

          {/* Card */}
          <View style={styles.authCard}>
            {/* Tab switcher */}
            <View style={[styles.tabRow, { backgroundColor: themeColors.background }]}>
              {(['signin', 'signup'] as AuthTab[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setTab(t); resetAuthForm(); }}
                  style={[styles.tabBtn, tab === t && { backgroundColor: '#fff' }]}>
                  <Text style={[styles.tabText, tab === t && { color: themeColors.accent, fontFamily: 'PoppinsBold' }]}>
                    {t === 'signin' ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.authForm}>
              {tab === 'signup' && (
                <InputField
                  label="Username"
                  value={authUsername}
                  onChangeText={setAuthUsername}
                  placeholder="e.g. dreamwalker"
                />
              )}

              <InputField
                label="Email Address"
                value={authEmail}
                onChangeText={setAuthEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputField
                label="Password"
                value={authPassword}
                onChangeText={setAuthPassword}
                placeholder="Min. 6 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword((v) => !v)}
              />

              {tab === 'signup' && (
                <InputField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              )}

              <TouchableOpacity
                onPress={tab === 'signin' ? handleSignIn : handleSignUp}
                disabled={authLoading}
                style={[styles.authBtn, { backgroundColor: themeColors.accent }, authLoading && { opacity: 0.7 }]}>
                {authLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.authBtnText}>
                    {tab === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); resetAuthForm(); }}
                style={styles.switchTabBtn}>
                <Text style={[styles.switchTabText, { color: themeColors.text }]}>
                  {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <Text style={{ color: themeColors.accent, fontFamily: 'PoppinsBold' }}>
                    {tab === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // Signed in → show profile
  // ══════════════════════════════════════════════════════════════
  return (
    <>
    <ScrollView
      style={{ backgroundColor: themeColors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 }}>

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: themeColors.surface }]}>

        {/* Avatar row */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.8}
            style={styles.avatarWrap}
            disabled={uploadingPhoto}>
            <View style={[styles.avatar, { borderColor: themeColors.accent + '30', backgroundColor: themeColors.surface }]}>
              {uploadingPhoto ? (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.accent + '15' }]}>
                  <ActivityIndicator size="large" color={themeColors.accent} />
                </View>
              ) : profile?.profile_image ? (
                <Image source={{ uri: profile.profile_image }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.accent + '15' }]}>
                  <Ionicons name="person" size={44} color={themeColors.accent} />
                </View>
              )}
            </View>
            <View style={[styles.cameraBtn, { backgroundColor: themeColors.accent }]}>
              <Ionicons name={uploadingPhoto ? 'hourglass-outline' : 'camera'} size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Cloud synced badge — only shown when sync is active */}
          {settings.cloudSyncEnabled && (
            <View style={[styles.syncBadge, { backgroundColor: themeColors.accent + '20' }]}>
              <Ionicons name="cloud-done" size={12} color={themeColors.accent} />
              <Text style={[styles.syncBadgeText, { color: themeColors.accent }]}>Cloud synced</Text>
            </View>
          )}
        </View>

        {!isEditing ? (
          <>
            <Text style={[styles.profileName, { color: themeColors.text }]}>{profile?.username ?? settings.username}</Text>
            <Text style={[styles.profileEmail, { color: themeColors.text }]}>{profile?.email ?? settings.email}</Text>
            {!!profile?.about && (
              <Text style={[styles.profileAbout, { color: themeColors.text }]}>{profile.about}</Text>
            )}

            <TouchableOpacity
              onPress={startEditing}
              style={[styles.editBtn, { backgroundColor: themeColors.accent + '15' }]}>
              <Ionicons name="pencil" size={15} color={themeColors.accent} />
              <Text style={[styles.editBtnText, { color: themeColors.accent }]}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editForm}>
            <Text style={[styles.inputLabel, { color: themeColors.text + '80' }]}>Username</Text>
            <View style={[styles.inputWrap, { backgroundColor: themeColors.background, borderColor: themeColors.accent + '30' }]}>
              <TextInput
                value={editUsername}
                onChangeText={setEditUsername}
                style={[styles.input, { color: themeColors.text }]}
                placeholderTextColor={themeColors.text + '40'}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12, color: themeColors.text + '80' }]}>About me</Text>
            <View style={[styles.inputWrap, { height: 80, alignItems: 'flex-start', paddingTop: 10, backgroundColor: themeColors.background, borderColor: themeColors.accent + '30' }]}>
              <TextInput
                value={editAbout}
                onChangeText={setEditAbout}
                multiline
                placeholder="A little about yourself…"
                placeholderTextColor={themeColors.text + '40'}
                style={[styles.input, { height: 60, color: themeColors.text }]}
              />
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                style={[styles.cancelBtn, { backgroundColor: themeColors.background }]}>
                <Text style={[styles.cancelBtnText, { color: themeColors.text + '80' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={saveLoading}
                style={[styles.saveBtn, { backgroundColor: themeColors.accent }]}>
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Data management */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.surface }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: themeColors.accent + '20' }]}>
            <Ionicons name="cloud" size={20} color={themeColors.accent} />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Cloud Backup</Text>
            <Text style={[styles.sectionSubtitle, { color: themeColors.text + '60' }]}>Keep your diary safe in the cloud</Text>
          </View>
        </View>

        {/* Cloud sync toggle */}
        <View style={styles.sectionRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionRowLabel, { color: themeColors.text }]}>Enable Cloud Sync</Text>
            <Text style={[styles.sectionRowSub, { color: themeColors.text + '60' }]}>
              {settings.cloudSyncEnabled
                ? `Last synced: ${formatLastSynced(settings.lastSyncedAt)}`
                : 'Diary stays on this device only'}
            </Text>
          </View>
          <Switch
            value={settings.cloudSyncEnabled}
            onValueChange={handleToggleCloudSync}
            trackColor={{ true: themeColors.accent, false: themeColors.text + '20' }}
            thumbColor={settings.cloudSyncEnabled ? '#fff' : themeColors.text + '60'}
            disabled={syncing}
          />
        </View>

        {/* Active sync status / controls */}
        {settings.cloudSyncEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: themeColors.text + '10' }]} />

            {/* Info banner */}
            <View style={[styles.syncInfoBanner, { backgroundColor: themeColors.accent + '15', borderColor: themeColors.accent + '30' }]}>
              <Ionicons name="information-circle" size={14} color={themeColors.accent} />
              <Text style={[styles.syncInfoText, { color: themeColors.text + 'CC' }]}>
                Entries are automatically synced when you open the app or come back online after being offline.
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.text + '10' }]} />

            {/* Manual sync button */}
            <TouchableOpacity
              onPress={runManualSync}
              disabled={syncing}
              style={[styles.sectionRow, syncing && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionRowLabel, { color: themeColors.text }]}>Sync Now</Text>
                <Text style={[styles.sectionRowSub, { color: themeColors.text + '60' }]}>
                  {entries?.length ?? 0} local {(entries?.length ?? 0) === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
              {syncing ? (
                <ActivityIndicator size="small" color={themeColors.accent} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={20} color={themeColors.accent} />
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Offline-only notice when sync is off */}
        {!settings.cloudSyncEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: themeColors.text + '10' }]} />
            <View style={[styles.syncInfoBanner, { backgroundColor: themeColors.text + '08', borderColor: themeColors.text + '15' }]}>
              <Ionicons name="phone-portrait-outline" size={14} color={themeColors.text + '80'} />
              <Text style={[styles.syncInfoText, { color: themeColors.text + '80' }]}>
                Cloud sync is off. Your diary is stored locally on this device only. Enable it above to back up to the cloud.
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity onPress={handleSignOut} style={[styles.signOutBtn, { backgroundColor: themeColors.error + '18', borderColor: themeColors.error + '40' }]}>
        <Ionicons name="log-out-outline" size={18} color={themeColors.error} />
        <Text style={[styles.signOutText, { color: themeColors.error }]}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete account — small, subtle, at the very bottom */}
      <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountBtn}>
        <Ionicons name="trash-outline" size={13} color={themeColors.error + 'AA'} />
        <Text style={[styles.deleteAccountText, { color: themeColors.error + 'AA' }]}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
    {dialogElement}
  </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Auth ─────────────────────────────────────────────────────
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  authHero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  authIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  authTitle: {
    fontFamily: 'GreatVibes',
    fontSize: 42,
    marginBottom: 4,
  },
  authSubtitle: {
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    opacity: 0.6,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    margin: 6,
    borderRadius: 20,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#9CA3AF',
  },
  authForm: {
    padding: 20,
    paddingTop: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: 'RobotoRegular',
    fontSize: 15,
    color: '#1F2937',
  },
  inputRight: {
    paddingLeft: 8,
  },
  authBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  authBtnText: {
    fontFamily: 'PoppinsBold',
    fontSize: 16,
    color: '#fff',
  },
  switchTabBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 4,
  },
  switchTabText: {
    fontFamily: 'RobotoRegular',
    fontSize: 14,
  },
  // ── Profile ───────────────────────────────────────────────────
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  syncBadgeText: {
    fontFamily: 'RobotoMedium',
    fontSize: 11,
    color: '#16A34A',
  },
  profileName: {
    fontFamily: 'PoppinsBold',
    fontSize: 22,
    marginBottom: 2,
    textAlign: 'center',
  },
  profileEmail: {
    fontFamily: 'RobotoRegular',
    fontSize: 14,
    opacity: 0.55,
    marginBottom: 8,
    textAlign: 'center',
  },
  profileAbout: {
    fontFamily: 'RobotoRegular',
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  editBtnText: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
  },
  editForm: {
    width: '100%',
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
    color: '#6B7280',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
    color: '#fff',
  },
  // ── Section card ──────────────────────────────────────────────
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 16,
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sectionRowLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 15,
    color: '#1F2937',
  },
  sectionRowSub: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  // ── Sign out ──────────────────────────────────────────────────
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signOutText: {
    fontFamily: 'PoppinsBold',
    fontSize: 15,
    color: '#EF4444',
  },
  // ── Delete account ────────────────────────────────────────────
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    marginBottom: 8,
    opacity: 0.75,
  },
  deleteAccountText: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
  },
  // ── Sync ──────────────────────────────────────────────────────
  syncInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginVertical: 6,
  },
  syncInfoText: {
    fontFamily: 'RobotoRegular',
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
  },
});
