import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5; // must be odd
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  icon?: string;
  /** Current time in "HH:mm" 24-hour format */
  value: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
}

function parseTime(timeStr: string): { hourIdx: number; minIdx: number; ampm: 'AM' | 'PM' } {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  const hourIdx = hour12 - 1;
  const minIdx = Math.round(m / 5) % 12;
  return { hourIdx, minIdx, ampm };
}

function formatTime(hourIdx: number, minIdx: number, ampm: 'AM' | 'PM'): string {
  let h = hourIdx + 1;
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  const m = minIdx * 5;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface WheelProps {
  data: string[];
  selectedIndex: number;
  accentColor: string;
  textColor: string;
  surfaceColor: string;
  onChange: (index: number) => void;
}

function Wheel({ data, selectedIndex, accentColor, textColor, surfaceColor, onChange }: WheelProps) {
  const listRef = useRef<FlatList>(null);
  const pad = Math.floor(VISIBLE_ITEMS / 2);
  const padded = [...Array(pad).fill(''), ...data, ...Array(pad).fill('')];

  useEffect(() => {
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
      listRef.current?.scrollToIndex({
        index: dataIdx + pad,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [data.length, onChange, pad]
  );

  return (
    <View style={[styles.wheel, { position: 'relative' }]}>
      {/* Top fade */}
      <View
        pointerEvents="none"
        style={[styles.fadeMask, styles.fadeMaskTop, { backgroundColor: surfaceColor }]}
      />
      {/* Bottom fade */}
      <View
        pointerEvents="none"
        style={[styles.fadeMask, styles.fadeMaskBottom, { backgroundColor: surfaceColor }]}
      />
      {/* Selection highlight */}
      <View
        pointerEvents="none"
        style={[
          styles.selectionHighlight,
          { borderColor: accentColor + '60', backgroundColor: accentColor + '18' },
        ]}
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
          const opacity = item === '' ? 0 : dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2;
          const scale = isSelected ? 1 : dist === 1 ? 0.92 : 0.84;
          return (
            <View style={styles.wheelItem}>
              <Text
                style={[
                  styles.wheelText,
                  { color: isSelected ? accentColor : textColor, opacity, transform: [{ scale }] },
                  isSelected && styles.wheelTextSelected,
                ]}>
                {item}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

export default function TimePickerModal({
  visible,
  title,
  icon,
  value,
  accentColor,
  backgroundColor,
  surfaceColor,
  textColor,
  onConfirm,
  onCancel,
}: TimePickerModalProps) {
  const parsed = parseTime(value);
  const [hourIdx, setHourIdx] = React.useState(parsed.hourIdx);
  const [minIdx, setMinIdx] = React.useState(parsed.minIdx);
  const [ampm, setAmpm] = React.useState<'AM' | 'PM'>(parsed.ampm);

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

  const previewH = hourIdx + 1;
  const previewM = minIdx * 5;
  const previewLabel = `${previewH}:${String(previewM).padStart(2, '0')} ${ampm}`;

  const subTextColor = textColor + '70';
  const handleColor = textColor + '30';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />

      <View style={[styles.sheet, { backgroundColor: surfaceColor }]}>
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: handleColor }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: textColor + '15' }]}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: subTextColor }]}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            {icon && (
              <View style={[styles.titleIcon, { backgroundColor: accentColor + '20' }]}>
                <Ionicons name={icon as any} size={18} color={accentColor} />
              </View>
            )}
            <Text style={[styles.sheetTitle, { color: textColor }]}>{title}</Text>
            <Text style={[styles.previewTime, { color: accentColor }]}>{previewLabel}</Text>
          </View>

          <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn} activeOpacity={0.7}>
            <View style={[styles.setBtn, { backgroundColor: accentColor }]}>
              <Text style={styles.setBtnText}>Set</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Column labels */}
        <View style={styles.labelsRow}>
          <Text style={[styles.colLabel, { color: subTextColor, flex: 1, textAlign: 'center' }]}>
            HOUR
          </Text>
          <View style={{ width: 24 }} />
          <Text style={[styles.colLabel, { color: subTextColor, flex: 1, textAlign: 'center' }]}>
            MIN
          </Text>
          <View style={{ width: 76 }} />
        </View>

        {/* Wheels row */}
        <View style={styles.wheelsRow}>
          {/* Hour */}
          <View style={{ flex: 1 }}>
            <Wheel
              data={HOURS}
              selectedIndex={hourIdx}
              accentColor={accentColor}
              textColor={textColor}
              surfaceColor={surfaceColor}
              onChange={setHourIdx}
            />
          </View>

          {/* Colon */}
          <View style={styles.colonWrap}>
            <Text style={[styles.colonText, { color: accentColor }]}>:</Text>
          </View>

          {/* Minute */}
          <View style={{ flex: 1 }}>
            <Wheel
              data={MINUTES}
              selectedIndex={minIdx}
              accentColor={accentColor}
              textColor={textColor}
              surfaceColor={surfaceColor}
              onChange={setMinIdx}
            />
          </View>

          {/* AM / PM segmented */}
          <View style={styles.ampmWrap}>
            <View
              style={[
                styles.ampmTrack,
                { backgroundColor: backgroundColor, borderColor: accentColor + '35' },
              ]}>
              {(['AM', 'PM'] as const).map((p) => {
                const active = ampm === p;
                return (
                  <TouchableOpacity
                    key={p}
                    activeOpacity={0.7}
                    onPress={() => setAmpm(p)}
                    style={[
                      styles.ampmSegment,
                      active && { backgroundColor: accentColor, shadowColor: accentColor },
                    ]}>
                    <Text
                      style={[
                        styles.ampmText,
                        active
                          ? { color: '#fff', fontFamily: 'PoppinsBold' }
                          : { color: subTextColor, fontFamily: 'RobotoMedium' },
                      ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Hint */}
        <View style={styles.hintRow}>
          <Ionicons name="swap-vertical-outline" size={12} color={subTextColor} />
          <Text style={[styles.hintText, { color: subTextColor }]}>
            Scroll wheels to pick the time
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 24 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  headerBtn: { minWidth: 64, alignItems: 'center' },
  cancelText: { fontFamily: 'RobotoMedium', fontSize: 14 },
  setBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  setBtnText: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
    color: '#fff',
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 15,
  },
  previewTime: {
    fontFamily: 'RobotoMedium',
    fontSize: 13,
    marginTop: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  colLabel: {
    fontFamily: 'RobotoMedium',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 6,
    right: 6,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    borderWidth: 1.5,
    zIndex: 1,
  },
  fadeMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.4,
    zIndex: 2,
  },
  fadeMaskTop: { top: 0, opacity: 0.72 },
  fadeMaskBottom: { bottom: 0, opacity: 0.72 },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 24,
  },
  wheelTextSelected: {
    fontFamily: 'PoppinsBold',
    fontSize: 28,
  },
  colonWrap: {
    height: PICKER_HEIGHT,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  colonText: {
    fontFamily: 'PoppinsBold',
    fontSize: 30,
  },
  ampmWrap: {
    width: 64,
    height: PICKER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  ampmTrack: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    width: '100%',
  },
  ampmSegment: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  ampmText: {
    fontSize: 14,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 5,
  },
  hintText: {
    fontFamily: 'RobotoRegular',
    fontSize: 11,
  },
});
