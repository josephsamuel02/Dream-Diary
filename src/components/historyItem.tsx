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
import { Ionicons, Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';

// redux
import { useAppDispatch, useAppSelector } from '~/store/hooks';
import { replaceBlocksForEntry, removeEntry } from '~/store/slices/diarySlice';
import { selectThemeColors } from '~/store/slices/themeSlice';

type Block = { id: string; type: 'text' | 'image' | 'audio'; content: string };
type Entry = { id: string; date?: string; blocks: Block[]; title?: string };

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

  // menu states
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    } catch (e: any) {
      // ignore
    } finally {
      dispatch(removeEntry(entry.id));
      setBusy(false);
      setConfirmDelete(false);
      setMenuOpen(false);
    }
  }, [dispatch, entry]);

  // measure the icon position and open the modal popover
  const openOptions = useCallback(() => {
    try {
      (iconRef.current as any)?.measureInWindow((x: number, y: number, w: number, h: number) => {
        setAnchor({ x, y, w, h });
        setConfirmDelete(false);
        setMenuOpen(true);
      });
    } catch (e) {
      // fallback: open without anchor (center)
      setAnchor(null);
      setConfirmDelete(false);
      setMenuOpen(true);
    }
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setConfirmDelete(false);
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

  // compute popover position given anchor; returns {left, top}
  const computePopoverPos = () => {
    const popW = POPOVER_WIDTH;
    const popH = confirmDelete ? 130 : 120;
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

  // Check if today
  const isToday = entry.date === new Date().toISOString().split('T')[0];

  return (
    <TouchableOpacity
      onPress={() => onOpen(entry.id)}
      activeOpacity={0.9}
      style={[
        styles.card,
        { backgroundColor: themeColors.surface },
        isToday && { 
          backgroundColor: themeColors.accent + '12', 
          borderWidth: 1.5, 
          borderColor: themeColors.accent + '40',
        },
      ]}>
      {/* Accent line on left */}
      <View 
        style={[
          styles.accentLine, 
          { backgroundColor: isToday ? themeColors.accent : themeColors.accent + '40' }
        ]} 
      />
      
      <View style={styles.cardInner}>
        {/* Left: Date badge */}
        <View
          style={[
            styles.dateBadge,
            { backgroundColor: isToday ? themeColors.accent : themeColors.background },
            isToday && { shadowColor: themeColors.accent, shadowOpacity: 0.3 },
          ]}>
          <Text style={[styles.dayNumber, { color: isToday ? '#fff' : themeColors.text }]}>
            {day || '—'}
          </Text>
          <Text style={[styles.monthText, { color: isToday ? 'rgba(255,255,255,0.85)' : themeColors.text + '70' }]}>
            {month}
          </Text>
          {isToday && (
            <View style={styles.todayDot} />
          )}
        </View>

        {/* Middle: Content */}
        <View style={styles.contentBlock}>
          {/* Date info row */}
          <View style={styles.dateInfoRow}>
            <Text style={[styles.weekdayText, { color: themeColors.text + '80' }]}>{weekday}</Text>
            <Text style={[styles.yearText, { color: themeColors.text + '50' }]}>{year}</Text>
            {isToday && (
              <View style={[styles.todayPill, { backgroundColor: themeColors.accent }]}>
                <Text style={styles.todayPillText}>TODAY</Text>
              </View>
            )}
          </View>

          {/* Preview text */}
          {preview ? (
            <Text style={[styles.previewText, { color: themeColors.text }]} numberOfLines={2} ellipsizeMode="tail">
              {preview}
            </Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="create-outline" size={14} color={themeColors.text + '40'} />
              <Text style={[styles.emptyText, { color: themeColors.text + '50' }]}>Tap to add your thoughts...</Text>
            </View>
          )}

          {/* Media indicators */}
          {(hasImage || hasAudio) && (
            <View style={styles.mediaRow}>
              {hasImage && (
                <View style={[styles.mediaIcon, { backgroundColor: themeColors.accent + '15' }]}>
                  <Ionicons name="image" size={11} color={themeColors.accent} />
                  <Text style={[styles.mediaLabel, { color: themeColors.accent }]}>Photo</Text>
                </View>
              )}
              {hasAudio && (
                <View style={[styles.mediaIcon, { backgroundColor: '#D1FAE520' }]}>
                  <Ionicons name="mic" size={11} color="#10B981" />
                  <Text style={[styles.mediaLabel, { color: '#10B981' }]}>Audio</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Right: Thumbnail or arrow */}
        {firstImage ? (
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: firstImage.content }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.thumbnailOverlay}>
              <Ionicons name="expand-outline" size={12} color="#fff" />
            </View>
          </View>
        ) : (
          <View style={[styles.arrowContainer, { backgroundColor: themeColors.accent + '10' }]}>
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
        style={[styles.optionsBtn, { backgroundColor: themeColors.background + '80' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-horizontal" size={14} color={themeColors.text + '70'} />
      </TouchableOpacity>

      {/* Modal overlay with popover when menuOpen */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.modalOverlay} onPress={closeMenu} />

        <View style={[styles.popoverAbsolute, { left: popLeft, top: popTop, backgroundColor: themeColors.surface }]}>
          {!confirmDelete ? (
            <>
              <TouchableOpacity
                onPress={() => onOpen(entry.id)}
                style={styles.popItem}
                activeOpacity={0.7}>
                <Feather name="edit-2" size={14} color={themeColors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.popText, { color: themeColors.text }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  clearEntry();
                  closeMenu();
                }}
                style={styles.popItem}
                activeOpacity={0.7}>
                <Feather name="refresh-cw" size={14} color={themeColors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.popText, { color: themeColors.text }]}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmDelete(true)}
                style={[styles.popItem, styles.destructive]}
                activeOpacity={0.7}>
                <Feather name="trash-2" size={14} color={themeColors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.popText, { color: themeColors.error }]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.confirmContainer}>
              <Text style={[styles.confirmText, { color: themeColors.text }]}>Delete entry?</Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  onPress={() => setConfirmDelete(false)}
                  style={[styles.confirmBtn, { backgroundColor: themeColors.background }]}
                  activeOpacity={0.7}>
                  <Text style={[styles.cancelText, { color: themeColors.text }]}>No</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={performDelete}
                  style={[styles.confirmBtn, { backgroundColor: themeColors.error }]}
                  activeOpacity={0.7}
                  disabled={busy}>
                  <Text style={styles.deleteText}>{busy ? '...' : 'Yes'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
  previewText: {
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: '#fff',
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
  destructiveText: {
    color: '#DC2626',
  },
  confirmContainer: {
    padding: 12,
  },
  confirmText: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 12,
    marginBottom: 10,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
