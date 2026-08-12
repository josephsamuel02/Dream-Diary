/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons, Feather, Entypo } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppDialog } from '~/hooks/useAppDialog';
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { replaceBlocksForEntry, removeEntry } from '~/store/slices/diarySlice';
import type { Mood, MoodEntry } from '~/store/slices/diarySlice';
import { selectCurrentTheme, selectThemeColors } from '~/store/slices/themeSlice';
import { selectSettings } from '~/store/slices/settingsSlice';
import { useToday } from '~/util/useToday';
import { getMoodMeta, getLatestMoodFromEntry, formatMoodTime } from '~/util/moods';
import { supabase } from '~/lib/supabase';
import { deleteRemoteEntry } from '~/util/diarySync';

type Block = { id: string; type: 'text' | 'image' | 'audio'; content: string };
type Entry = {
  id: string;
  date?: string;
  blocks: Block[];
  title?: string;
  mood?: Mood;
  moods?: MoodEntry[];
  tag?: string;
  updatedAt?: string;
  createdAt?: string;
};

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const POPOVER_WIDTH = 140;

export default function HistoryItem({
  entry,
  onOpen,
  isFirst,
}: {
  entry: Entry;
  onOpen: (entryId: string) => void;
  isFirst?: boolean;
}) {
  const dispatch = useAppDispatch();
  const themeColors = useAppSelector(selectThemeColors);
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'midnight';
  const { cloudSyncEnabled } = useAppSelector(selectSettings);
  const { showDialog, dialogElement } = useAppDialog();

  // menu states
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // coords for icon -> used to position popover
  const [anchor, setAnchor] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const iconRef = useRef<any>(null);

  const clearEntry = useCallback(() => {
    const empty: Block[] = [{ id: genId(), type: 'text', content: '' }];
    dispatch(replaceBlocksForEntry({ entryId: entry.id, blocks: empty }));
    setMenuOpen(false);
  }, [dispatch, entry.id]);

  const performDelete = useCallback(async () => {
    setBusy(true);
    try {
      // Delete local media files (images, audio)
      await Promise.all(
        (entry.blocks ?? [])
          .filter((b) => b.type === 'image' || b.type === 'audio')
          .map(async (b) => {
            try {
              if (b.content) {
                await FileSystem.deleteAsync(b.content, { idempotent: true });
              }
            } catch (e: any) {
              // ignore per-file errors
            }
          })
      );

      // Delete from remote database if sync is enabled
      if (cloudSyncEnabled) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (userId) {
            await deleteRemoteEntry(entry.id, userId);
          }
        } catch (e: any) {
          // Log but don't block local deletion if remote fails
          console.warn('Failed to delete remote entry:', e?.message);
        }
      }
    } catch (e: any) {
      // ignore
    } finally {
      // Always delete locally
      dispatch(removeEntry(entry.id));
      setBusy(false);
      setMenuOpen(false);
    }
  }, [dispatch, entry, cloudSyncEnabled]);

  // measure the icon position and open the modal popover
  const openOptions = useCallback(() => {
    try {
      (iconRef.current as any)?.measureInWindow((x: number, y: number, w: number, h: number) => {
        setAnchor({ x, y, w, h });
        setMenuOpen(true);
      });
    } catch (e) {
      // fallback: open without anchor (center)
      setAnchor(null);
      setMenuOpen(true);
    }
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const dateParts = (entry.date ?? '').split('-');
  const day = dateParts[2] ?? '';
  const month = entry.date
    ? new Date(entry.date).toLocaleString(undefined, { month: 'short' })
    : '';
  const year = dateParts[0] ?? '';
  const weekday = entry.date
    ? new Date(entry.date).toLocaleString(undefined, { weekday: 'short' })
    : '';

  const firstText = entry.blocks.find((b) => b.type === 'text' && b.content?.trim());
  const preview = firstText ? firstText.content : '';
  const hasImage = entry.blocks.some((b) => b.type === 'image');
  const hasAudio = entry.blocks.some((b) => b.type === 'audio');
  const firstImage = entry.blocks.find((b) => b.type === 'image');

  // Get latest mood (handles both legacy single mood and new moods array)
  const latestMoodMeta = getLatestMoodFromEntry(entry);
  const moodCount = entry.moods?.length ?? (entry.mood ? 1 : 0);

  // Title is shown above the preview when set; otherwise the first
  // line of the preview doubles as the title.
  const titleLine = entry.title?.trim() || (preview ? preview.split('\n')[0]?.slice(0, 40) : '');
  const previewBody = entry.title?.trim()
    ? preview
    : preview.split('\n').slice(1).join(' ').trim() || preview;

  // compute popover position given anchor; returns {left, top}
  const computePopoverPos = () => {
    const popW = POPOVER_WIDTH;
    const popH = 120;
    if (!anchor) {
      const left = Math.max(8, Math.min((SCREEN_W - popW) / 2, SCREEN_W - popW - 8));
      const top = Math.max(8, Math.min((SCREEN_H - popH) / 2, SCREEN_H - popH - 8));
      return { left, top };
    }
    let left = anchor.x + anchor.w - popW;
    if (left < 8) left = Math.min(anchor.x, SCREEN_W - popW - 8);
    if (left + popW > SCREEN_W - 8) left = SCREEN_W - popW - 8;
    let top = anchor.y + anchor.h + 6;
    if (top + popH > SCREEN_H - 8) {
      top = Math.max(8, anchor.y - popH - 6);
    }
    return { left, top };
  };

  const { left: popLeft, top: popTop } = computePopoverPos();

  // Compare against the LOCAL today (toISOString uses UTC and was
  // mis-flagging the badge near midnight). useToday() also re-renders
  // at local midnight so the badge moves to the correct entry the
  // moment a new day begins.
  const today = useToday();
  const isToday = entry.date === today;

  // Friendly timestamp for the row footer ("Today, 9:30 AM" or "Apr 14, 9:30 AM").
  const timestampLabel = (() => {
    const ts = entry.updatedAt ?? entry.createdAt;
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Today, ${time}`;
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${dateStr}, ${time}`;
  })();

  return (
    <TouchableOpacity
      onPress={() => onOpen(entry.id)}
      activeOpacity={0.9}
      style={[
        styles.card,
        { backgroundColor: themeColors.background },
        isToday && {
          backgroundColor: themeColors.background,
          borderWidth: 1.5,
          borderColor: themeColors.accent + '60',
        },
      ]}>
      {/* Accent line on left */}
      <View
        style={[
          styles.accentLine,
          { backgroundColor: isToday ? themeColors.accent : themeColors.accent + '50' },
        ]}
      />

      <View style={[styles.cardInner, { backgroundColor: themeColors.background }]}>
        {/* Left: Date badge */}
        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: isToday
                ? isDarkTheme
                  ? '#FFFFFF'
                  : themeColors.accent
                : themeColors.surface,
            },
            isToday && {
              shadowColor: isDarkTheme ? '#FFFFFF' : themeColors.accent,
              shadowOpacity: 0.3,
            },
          ]}>
          <Text
            style={[
              styles.dayNumber,
              { color: isToday ? (isDarkTheme ? '#000000' : '#fff') : themeColors.text },
            ]}>
            {day || '—'}
          </Text>
          <Text
            style={[
              styles.monthText,
              {
                color: isToday
                  ? isDarkTheme
                    ? 'rgba(0,0,0,0.7)'
                    : 'rgba(255,255,255,0.85)'
                  : themeColors.text + '70',
              },
            ]}>
            {month}
          </Text>
          {isToday && (
            <View style={[styles.todayDot, isDarkTheme && { backgroundColor: '#000000' }]} />
          )}
        </View>

        {/* Middle: Content */}
        <View style={styles.contentBlock}>
          {/* Title (or first line of preview) + preview body */}
          {titleLine ? (
            <Text
              style={[styles.titleText, { color: themeColors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {titleLine}
            </Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="create-outline" size={14} color={themeColors.accent + '80'} />
              <Text style={[styles.emptyText, { color: themeColors.text + '60' }]}>
                Tap to add your thoughts...
              </Text>
            </View>
          )}
          {previewBody ? (
            <Text
              style={[styles.previewText, { color: themeColors.text + 'B0' }]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {previewBody}
            </Text>
          ) : !titleLine ? (
            <Text
              style={[styles.previewText, { color: themeColors.text + '70' }]}
              numberOfLines={1}>
              Capture your day, reflect and grow.
            </Text>
          ) : null}

          {/* Footer: mood + tag + timestamp */}
          <View style={styles.footerRow}>
            <View style={styles.chip}>
              {latestMoodMeta ? (
                <>
                  <Entypo
                    name={latestMoodMeta.icon as any}
                    size={12}
                    color={latestMoodMeta.color}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.chipText, { color: latestMoodMeta.color }]}>
                    {latestMoodMeta.label}
                    {moodCount > 1 && ` +${moodCount - 1}`}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="happy-outline" size={11} color={themeColors.text + '60'} />
                  <Text
                    style={[styles.chipText, { color: themeColors.text + '70', marginLeft: 3 }]}>
                    No mood
                  </Text>
                </>
              )}
            </View>

            <View style={styles.chip}>
              <Ionicons
                name="pricetag-outline"
                size={11}
                color={entry.tag ? themeColors.accent : themeColors.text + '60'}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: entry.tag ? themeColors.accent : themeColors.text + '70',
                    marginLeft: 4,
                  },
                ]}>
                {entry.tag || 'Add tag'}
              </Text>
            </View>

            {(hasImage || hasAudio) && (
              <View style={styles.chip}>
                <Ionicons name={hasImage ? 'image' : 'mic'} size={11} color={themeColors.accent} />
              </View>
            )}

            {!!timestampLabel && (
              <View
                style={[
                  styles.timestampPill,
                  { backgroundColor: themeColors.background, borderColor: themeColors.text + '15' },
                ]}>
                <Text style={[styles.timestampText, { color: themeColors.text + '80' }]}>
                  {timestampLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Thumbnail or arrow */}
        {firstImage ? (
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: firstImage.content }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
            <View style={styles.thumbnailOverlay}>
              <Ionicons name="expand-outline" size={12} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={[styles.arrowContainer, { backgroundColor: themeColors.surface }]}>
            <Ionicons name="chevron-forward" size={16} color={themeColors.accent} />
          </View>
        )}
      </View>

      {/* Options button */}
      <TouchableOpacity
        ref={iconRef}
        onPress={(e) => {
          e.stopPropagation();
          openOptions();
        }}
        style={[styles.optionsBtn, { backgroundColor: themeColors.surface + '90' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-horizontal" size={14} color={themeColors.text + '80'} />
      </TouchableOpacity>

      {/* Modal overlay with popover when menuOpen */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.modalOverlay} onPress={closeMenu} />

        <View
          style={[
            styles.popoverAbsolute,
            { left: popLeft, top: popTop, backgroundColor: themeColors.surface },
          ]}>
          <>
            <TouchableOpacity
              onPress={() => onOpen(entry.id)}
              style={styles.popItem}
              activeOpacity={0.7}>
              <Feather
                name="edit-2"
                size={14}
                color={themeColors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.popText, { color: themeColors.text }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                clearEntry();
                closeMenu();
              }}
              style={styles.popItem}
              activeOpacity={0.7}>
              <Feather
                name="refresh-cw"
                size={14}
                color={themeColors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.popText, { color: themeColors.text }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                closeMenu();
                showDialog({
                  title: 'Delete Entry',
                  message: 'This entry will be permanently removed. This cannot be undone.',
                  buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete },
                  ],
                });
              }}
              style={[styles.popItem, styles.destructive]}
              activeOpacity={0.7}>
              <Feather
                name="trash-2"
                size={14}
                color={themeColors.error}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.popText, { color: themeColors.error }]}>Delete</Text>
            </TouchableOpacity>
          </>
        </View>
      </Modal>
      {dialogElement}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingLeft: 16,
  },
  dateBadge: {
    width: 50,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'PoppinsBold',
    lineHeight: 24,
  },
  monthText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
    textTransform: 'uppercase',
    marginTop: -2,
    letterSpacing: 0.5,
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  contentBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'RobotoMedium',
  },
  yearText: {
    fontSize: 10,
    fontFamily: 'RobotoRegular',
  },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  todayPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'RobotoMedium',
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'PoppinsBold',
    marginBottom: 2,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'RobotoRegular',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'RobotoRegular',
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'RobotoMedium',
  },
  timestampPill: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  timestampText: {
    fontSize: 10,
    fontFamily: 'RobotoRegular',
  },
  mediaRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  mediaIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  mediaLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
  },
  thumbnailContainer: {
    position: 'relative',
    marginLeft: 10,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  optionsBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    borderRadius: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  popoverAbsolute: {
    position: 'absolute',
    width: 140,
    borderRadius: 12,
    paddingVertical: 6,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  popItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  popText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  destructive: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
});
