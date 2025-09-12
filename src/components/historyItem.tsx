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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

// redux
import { useAppDispatch } from '~/store/hooks';
import { replaceBlocksForEntry, removeEntry } from '~/store/slices/diarySlice';

type Block = { id: string; type: 'text' | 'image' | 'audio'; content: string };
type Entry = { id: string; date?: string; blocks: Block[]; title?: string };

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const POPOVER_WIDTH = 160;

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

  const firstText = entry.blocks.find((b) => b.type === 'text' && b.content?.trim());
  const preview = firstText ? firstText.content : (entry.blocks[0]?.type ?? 'Empty');

  // compute popover position given anchor; returns {left, top}
  const computePopoverPos = () => {
    const popW = POPOVER_WIDTH;
    const popH = confirmDelete ? 120 : 110; // rough heights for layout, fine-tune if needed
    if (!anchor) {
      // center fallback
      const left = Math.max(8, Math.min((SCREEN_W - popW) / 2, SCREEN_W - popW - 8));
      const top = Math.max(8, Math.min((SCREEN_H - popH) / 2, SCREEN_H - popH - 8));
      return { left, top };
    }
    // try place to the right of icon aligning top slightly above icon
    let left = anchor.x + anchor.w - popW;
    // clamp horizontally
    if (left < 8) left = Math.min(anchor.x, SCREEN_W - popW - 8);
    if (left + popW > SCREEN_W - 8) left = SCREEN_W - popW - 8;
    // place below icon if enough space, else above
    let top = anchor.y + anchor.h + 6;
    if (top + popH > SCREEN_H - 8) {
      // place above
      top = Math.max(8, anchor.y - popH - 6);
    }
    return { left, top };
  };

  const { left: popLeft, top: popTop } = computePopoverPos();
  return (
    <View
      style={[styles.row, isFirst ? styles.firstRow : undefined]}
      className="mb-4 flex h-auto w-full flex-1 flex-row items-center rounded-md bg-white p-3  shadow">
      {/* Date Block */}
      <View className="mr-3 flex flex-row items-center border-r-2 border-[silver] pr-2">
        <Text
          style={isFirst ? styles.firstDateText : undefined}
          className="pr-1 font-roboto text-[40px] font-bold text-black">
          {day || '—'}
        </Text>
        <View className="flex flex-col justify-center">
          <Text className="text-left font-roboto text-base font-bold text-cozy_text">
            {month || '—'}
          </Text>
          <Text className="text-left font-roboto text-base font-bold text-cozy_text">
            {year || '—'}
          </Text>
        </View>
      </View>

      {/* Pressing the preview opens the editor */}
      <TouchableOpacity
        onPress={() => onOpen(entry.id)}
        style={{ flex: 1 }}
        activeOpacity={0.85}
        className="mr-2">
        <Text
          className="flex-1 font-roboto text-[14px] text-cozy_text"
          numberOfLines={3}
          ellipsizeMode="tail"
          style={{ lineHeight: 18 }}>
          {preview}
        </Text>
      </TouchableOpacity>

      {/* three-dots icon (we measure this) */}
      <TouchableOpacity
        ref={iconRef}
        onPress={openOptions}
        style={styles.iconBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="ellipsis-vertical" size={22} color="#374151" />
      </TouchableOpacity>

      {/* Modal overlay with popover when menuOpen */}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={closeMenu}>
        {/* backdrop */}
        <Pressable style={styles.modalOverlay} onPress={closeMenu} />

        {/* popover placed absolutely on screen */}
        <View style={[styles.popoverAbsolute, { left: popLeft, top: popTop }]}>
          {!confirmDelete ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  clearEntry();
                  closeMenu();
                }}
                style={styles.popItem}
                activeOpacity={0.85}>
                <Text style={styles.popText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmDelete(true)}
                style={[styles.popItem, styles.destructive]}
                activeOpacity={0.85}>
                <Text style={[styles.popText, styles.destructiveText]}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.confirmText}>Delete this entry?</Text>
              <View style={styles.confirmRow}>
                <TouchableOpacity
                  onPress={() => {
                    setConfirmDelete(false);
                  }}
                  style={[styles.confirmBtn, styles.cancelBtn]}
                  activeOpacity={0.85}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={performDelete}
                  style={[styles.confirmBtn, styles.deleteBtn]}
                  activeOpacity={0.85}
                  disabled={busy}>
                  <Text style={styles.deleteText}>{busy ? 'Deleting...' : 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    overflow: 'visible',
  },
  // NEW: larger/taller first item styling
  firstRow: {
    paddingVertical: 18, // increases vertical space for first item
    minHeight: 120, // make sure it's visually taller even with short content
  },
  // NEW: slightly larger date number for first item
  firstDateText: {
    fontSize: 48,
    lineHeight: 52,
  },
  iconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.0)', // transparent but captures taps
  },
  popoverAbsolute: {
    position: 'absolute',
    width: POPOVER_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 6,
    zIndex: 9999,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  popItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  popText: {
    fontSize: 14,
    color: '#111827',
  },
  destructive: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  destructiveText: {
    color: '#DC2626',
  },
  confirmText: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 13,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
  },
});
