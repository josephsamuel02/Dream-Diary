import { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '~/store/hooks';
import { selectEntries } from '~/store/slices/diarySlice';
import { selectThemeColors, selectBackgroundImage, selectBackgroundOpacity } from '~/store/slices/themeSlice';
import HistoryItem from '~/components/historyItem';
import AdBanner from '~/components/AdBanner';

export default function AllEntries() {
  const router = useRouter();
  const entriesRaw = useAppSelector(selectEntries);
  const themeColors = useAppSelector(selectThemeColors);
  const backgroundImage = useAppSelector(selectBackgroundImage);
  const backgroundOpacity = useAppSelector(selectBackgroundOpacity);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Sorted and filtered entries
  const entries = useMemo(() => {
    let filtered = [...(entriesRaw ?? [])];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const textContent = entry.blocks
          .filter((b) => b.type === 'text')
          .map((b) => b.content)
          .join(' ')
          .toLowerCase();
        const dateMatch = entry.date?.toLowerCase().includes(query);
        return textContent.includes(query) || dateMatch;
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : 0;
      const tb = b?.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });

    return filtered;
  }, [entriesRaw, searchQuery, sortOrder]);

  const openEntryForEditing = useCallback(
    (entryId: string) => {
      router.push(`/DiaryInput?entryId=${encodeURIComponent(entryId)}`);
    },
    [router]
  );

  // Group entries by month
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: typeof entries } = {};
    entries.forEach((entry) => {
      if (entry.date) {
        const date = new Date(entry.date);
        const monthYear = date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        groups[monthYear].push(entry);
      }
    });
    return Object.entries(groups);
  }, [entries]);

  const totalEntries = entriesRaw?.length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Background Image */}
      {backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={[styles.backgroundImage, { opacity: backgroundOpacity }]}
          resizeMode="cover"
        />
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.surface }]}>
          <Ionicons name="search" size={18} color={themeColors.text + '60'} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search entries..."
            placeholderTextColor={themeColors.text + '50'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={themeColors.text + '50'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Toggle */}
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: themeColors.accent + '20' }]}
          onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}>
          <Ionicons
            name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={themeColors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={[styles.resultsText, { color: themeColors.text, opacity: 0.6 }]}>
          {searchQuery
            ? `${entries.length} result${entries.length !== 1 ? 's' : ''} found`
            : `${totalEntries} total entries`}
        </Text>
        <Text style={[styles.sortText, { color: themeColors.accent }]}>
          {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
        </Text>
      </View>

      {/* Non-intrusive placement while users browse saved entries. */}
      <AdBanner />

      {/* Entries List */}
      <FlatList
        data={groupedEntries}
        keyExtractor={([monthYear]) => monthYear}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: [monthYear, monthEntries] }) => (
          <View style={styles.monthGroup}>
            {/* Month Header */}
            <View style={[styles.monthHeader, { borderBottomColor: themeColors.text + '15' }]}>
              <Ionicons name="calendar-outline" size={14} color={themeColors.accent} />
              <Text style={[styles.monthTitle, { color: themeColors.text }]}>{monthYear}</Text>
              <View style={[styles.monthBadge, { backgroundColor: themeColors.accent + '20' }]}>
                <Text style={[styles.monthBadgeText, { color: themeColors.accent }]}>{monthEntries.length}</Text>
              </View>
            </View>

            {/* Month Entries */}
            {monthEntries.map((entry, index) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                onOpen={openEntryForEditing}
                isFirst={false}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: themeColors.accent + '20' }]}>
              <Ionicons name="search-outline" size={32} color={themeColors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {searchQuery ? 'No entries found' : 'No entries yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.text, opacity: 0.5 }]}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start writing to see your entries here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'RobotoRegular',
    padding: 0,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'RobotoRegular',
  },
  sortText: {
    fontSize: 11,
    color: '#D97706',
    fontFamily: 'RobotoMedium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  monthGroup: {
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'PoppinsBold',
  },
  monthBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'PoppinsBold',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'RobotoRegular',
  },
});
