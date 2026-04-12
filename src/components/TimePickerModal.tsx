import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5; // must be odd
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  /** Current time in "HH:mm" 24-hour format */
  value: string;
  accentColor: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

/** Parse a 24-hour "HH:mm" string into wheel indices */
function parseTime(timeStr: string): { hourIdx: number; minIdx: number; ampm: 'AM' | 'PM' } {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  const hourIdx = hour12 - 1; // HOURS array is 1-12, index 0-11
  const minIdx = Math.round(m / 5) % 12;
  return { hourIdx, minIdx, ampm };
}

/** Convert wheel selection back to 24-hour "HH:mm" string */
function formatTime(hourIdx: number, minIdx: number, ampm: 'AM' | 'PM'): string {
  let h = hourIdx + 1; // 1-12
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  const m = minIdx * 5;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface WheelProps {
  data: string[];
  selectedIndex: number;
  accentColor: string;
  onChange: (index: number) => void;
}

function Wheel({ data, selectedIndex, accentColor, onChange }: WheelProps) {
  const listRef = useRef<FlatList>(null);
  // Pad data so first and last items can center
  const pad = Math.floor(VISIBLE_ITEMS / 2);
  const padded = [...Array(pad).fill(''), ...data, ...Array(pad).fill('')];

  useEffect(() => {
    // Scroll to selected item without animation on mount
    listRef.current?.scrollToIndex({
      index: selectedIndex + pad,
      animated: false,
      viewPosition: 0.5,
    });
  }, []);

  const onScrollEnd = useCallback(
    (e: any) => {
      const rawIdx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
      const dataIdx = Math.max(0, Math.min(rawIdx, data.length - 1));
      onChange(dataIdx);
      // Snap to exact position
      listRef.current?.scrollToIndex({
        index: dataIdx + pad,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [data.length, onChange, pad]
  );

  return (
    <View style={styles.wheel}>
      {/* Highlight band */}
      <View
        pointerEvents="none"
        style={[styles.wheelHighlight, { borderColor: accentColor + '50', backgroundColor: accentColor + '10' }]}
      />
      <FlatList
        ref={listRef}
        data={padded}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        renderItem={({ item, index }) => {
          const dataIdx = index - pad;
          const isSelected = dataIdx === selectedIndex;
          const dist = Math.abs(dataIdx - selectedIndex);
          const opacity = item === '' ? 0 : dist === 0 ? 1 : dist === 1 ? 0.5 : 0.25;
          return (
            <View style={styles.wheelItem}>
              <Text
                style={[
                  styles.wheelText,
                  isSelected && [styles.wheelTextSelected, { color: accentColor }],
                  { opacity },
                ]}>
                {item}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingVertical: 0 }}
      />
    </View>
  );
}

export default function TimePickerModal({
  visible,
  title,
  value,
  accentColor,
  onConfirm,
  onCancel,
}: TimePickerModalProps) {
  const parsed = parseTime(value);
  const [hourIdx, setHourIdx] = React.useState(parsed.hourIdx);
  const [minIdx, setMinIdx] = React.useState(parsed.minIdx);
  const [ampm, setAmpm] = React.useState<'AM' | 'PM'>(parsed.ampm);

  // Re-sync when modal reopens with a new value
  useEffect(() => {
    if (visible) {
      const p = parseTime(value);
      setHourIdx(p.hourIdx);
      setMinIdx(p.minIdx);
      setAmpm(p.ampm);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onConfirm(formatTime(hourIdx, minIdx, ampm));
  };

  const previewLabel = () => {
    const h = hourIdx + 1;
    const m = minIdx * 5;
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: '#9CA3AF' }]}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Text style={[styles.previewTime, { color: accentColor }]}>{previewLabel()}</Text>
          </View>

          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: accentColor }]}>Set</Text>
          </TouchableOpacity>
        </View>

        {/* Wheels */}
        <View style={styles.wheelsRow}>
          {/* Hour wheel */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.wheelLabel}>Hour</Text>
            <Wheel
              data={HOURS}
              selectedIndex={hourIdx}
              accentColor={accentColor}
              onChange={setHourIdx}
            />
          </View>

          {/* Colon separator */}
          <View style={styles.colon}>
            <Text style={[styles.colonText, { color: accentColor }]}>:</Text>
          </View>

          {/* Minute wheel */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.wheelLabel}>Min</Text>
            <Wheel
              data={MINUTES}
              selectedIndex={minIdx}
              accentColor={accentColor}
              onChange={setMinIdx}
            />
          </View>

          {/* AM / PM */}
          <View style={styles.ampmCol}>
            <Text style={styles.wheelLabel}>  </Text>
            <View style={[styles.ampmWrap, { borderColor: accentColor + '30' }]}>
              {(['AM', 'PM'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  activeOpacity={0.7}
                  onPress={() => setAmpm(period)}
                  style={[
                    styles.ampmBtn,
                    ampm === period && { backgroundColor: accentColor },
                  ]}>
                  <Text
                    style={[
                      styles.ampmText,
                      ampm === period ? { color: '#fff', fontFamily: 'PoppinsBold' } : { color: '#6B7280' },
                    ]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Info hint */}
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={13} color="#9CA3AF" />
          <Text style={styles.hintText}>Scroll to select hour &amp; minute</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  headerBtn: { paddingHorizontal: 4, minWidth: 60 },
  headerBtnText: { fontFamily: 'PoppinsBold', fontSize: 15 },
  sheetTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 16,
    color: '#1F2937',
  },
  previewTime: {
    fontFamily: 'RobotoMedium',
    fontSize: 13,
    marginTop: 2,
  },
  // Wheels
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  wheelLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },
  wheel: {
    height: PICKER_HEIGHT,
    width: 72,
    overflow: 'hidden',
  },
  wheelHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 1,
    pointerEvents: 'none',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 22,
    color: '#374151',
  },
  wheelTextSelected: {
    fontFamily: 'PoppinsBold',
    fontSize: 26,
  },
  colon: {
    height: PICKER_HEIGHT,
    justifyContent: 'center',
    paddingTop: 28,
    paddingHorizontal: 4,
  },
  colonText: {
    fontFamily: 'PoppinsBold',
    fontSize: 28,
  },
  // AM/PM
  ampmCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 12,
  },
  ampmWrap: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 0,
  },
  ampmBtn: {
    width: 56,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
  },
  // Hint
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 4,
  },
  hintText: {
    fontFamily: 'RobotoRegular',
    fontSize: 11,
    color: '#9CA3AF',
  },
});
