import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TierPrivilegeBanner } from '../../components/TierPrivilegeBanner';
import { CHAT_THREADS, ChatThread } from '../../data/connectFeed';
import { useTier } from '../../context/TierContext';
import { getChatThreads } from '../../services/connectBridge';
import { trackInteraction } from '../../services/engagementEngine';
import { paletteFor } from '../../theme/tokens';

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { state: tierState } = useTier();
  const c = paletteFor(tierState.isElite);
  const [threads] = useState<ChatThread[]>(() => {
    try {
      return getChatThreads();
    } catch {
      return CHAT_THREADS;
    }
  });
  const styles = useMemo(() => makeStyles(c, tierState.isElite), [c, tierState.isElite]);

  const sorted = useMemo(() => {
    return threads
      .map((t, index) => ({ t, index }))
      .sort((a, b) => {
        if (b.t.unread !== a.t.unread) return b.t.unread - a.t.unread;
        return a.index - b.index;
      })
      .map(({ t }) => t);
  }, [threads]);

  const openThread = (item: ChatThread) => {
    trackInteraction('open_thread', item.id, { name: item.name, locked: item.locked });
    navigation.navigate('ChatThread', { threadId: item.id });
  };

  const renderItem = ({ item }: { item: ChatThread }) => (
    <Pressable
      style={[styles.row, item.unread > 0 && styles.rowUnread]}
      onPress={() => openThread(item)}
    >
      <View style={styles.avatarWrap}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.tier === 'Elite' && <View style={styles.avatarRing} />}
      </View>
      <View style={styles.mid}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, item.unread > 0 && styles.nameUnread]}>{item.name}</Text>
          {item.tier === 'Elite' && (
            <View style={styles.eliteTag}>
              <Text style={styles.eliteTagText}>Elite</Text>
            </View>
          )}
          {item.locked && (
            <View style={styles.lockTag}>
              <Text style={styles.lockTagText}>Locked</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.preview, item.unread > 0 && styles.previewUnread]}
          numberOfLines={1}
        >
          {item.locked ? 'Respond to a prompt to unlock this thread' : item.preview}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, item.unread > 0 && styles.timeUnread]}>{item.lastAt}</Text>
        {item.unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <TierPrivilegeBanner />
      <Text style={styles.heading}>Messages</Text>
      <Text style={styles.sub}>
        Progressive disclosure · in-chat utilities keep conversations on-platform
      </Text>
      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={sorted.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>◈</Text>
            <Text style={styles.emptyTitle}>No threads yet</Text>
            <Text style={styles.emptyBody}>
              Respond to Dating prompts or Connect Semantically in Explore to open a WhatsApp-style
              thread with progressive disclosure.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof paletteFor>, isElite: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    heading: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
      marginHorizontal: 16,
      marginTop: 12,
    },
    sub: {
      fontSize: 12,
      color: c.textMuted,
      marginHorizontal: 16,
      marginBottom: 10,
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    rowUnread: {
      backgroundColor: isElite ? 'rgba(212,175,55,0.06)' : 'rgba(15,61,46,0.04)',
    },
    avatarWrap: { marginRight: 12, position: 'relative' },
    avatar: { width: 52, height: 52, borderRadius: 26 },
    avatarRing: {
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: isElite ? c.accent : '#B8922E',
    },
    mid: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    name: { fontSize: 16, fontWeight: '700', color: c.text },
    nameUnread: { fontWeight: '800' },
    eliteTag: {
      backgroundColor: isElite ? 'rgba(212,175,55,0.18)' : 'rgba(184,146,46,0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    eliteTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: isElite ? c.accent : '#B8922E',
      letterSpacing: 0.5,
    },
    lockTag: {
      backgroundColor: c.surfaceMuted,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    lockTagText: { fontSize: 10, color: c.textMuted, fontWeight: '700' },
    preview: { marginTop: 4, color: c.textMuted, fontSize: 13 },
    previewUnread: { color: c.text, fontWeight: '600' },
    right: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
    time: { fontSize: 11, color: c.textMuted },
    timeUnread: { color: c.accent, fontWeight: '700' },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: isElite ? '#0B0B0C' : '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
    emptyContainer: { flexGrow: 1, justifyContent: 'center', padding: 32 },
    empty: { alignItems: 'center' },
    emptyGlyph: { fontSize: 36, color: c.accent, marginBottom: 12, opacity: 0.7 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: c.text, marginBottom: 8 },
    emptyBody: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 300,
    },
  });
}
