import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TierPrivilegeBanner } from '../../components/TierPrivilegeBanner';
import { CHAT_THREADS } from '../../data/connectFeed';
import { useTier } from '../../context/TierContext';
import * as bridge from '../../services/connectBridge';
import { trackInteraction } from '../../services/engagementEngine';
import { paletteFor } from '../../theme/tokens';

type MsgFrom = 'me' | 'them' | 'system';
type ThreadMessage = {
  id: string;
  from: MsgFrom;
  text: string;
  time: string;
  read?: boolean;
};

type VenueRow = { name: string; area: string; slot: string };

const FALLBACK_VENUES: VenueRow[] = [
  { name: 'The Ned', area: 'Members lounge · geohash gcpvj0···', slot: 'Thu 8:30 PM' },
  { name: 'Aman', area: 'Private dining · geohash gcpvj3···', slot: 'Fri 7:00 PM' },
  { name: 'Private members club', area: 'Invite-only · geohash gcpvj7···', slot: 'Sat 9:15 PM' },
];

const AUTO_REPLIES = [
  'That tracks — send the details when you have them.',
  'Noted. I’m free after 7 if that works.',
  'Love it. Keep it high-signal.',
  'Perfect — looping in my calendar now.',
  'Sounds sharp. Let’s lock it.',
];

function resolveVenues(threadId: string): VenueRow[] {
  try {
    const fn = (bridge as { scheduleVenue?: (id: string) => unknown }).scheduleVenue;
    if (!fn) return FALLBACK_VENUES;
    const raw = fn(threadId);
    if (Array.isArray(raw)) {
      return raw.map((v: any) => ({
        name: String(v.name ?? 'Venue'),
        area: String(v.area ?? v.detail ?? v.geohash ?? ''),
        slot: String(v.slot ?? ''),
      }));
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as { venues?: unknown }).venues)) {
      return ((raw as { venues: any[] }).venues).map((v) => ({
        name: String(v.name ?? 'Venue'),
        area: String(v.area ?? v.detail ?? ''),
        slot: String(v.slot ?? ''),
      }));
    }
  } catch {
    /* local fallback */
  }
  return FALLBACK_VENUES;
}

function resolveInvoice(threadId: string, amount: number) {
  try {
    const fn = (bridge as { generateInvoice?: (id: string, amt?: number) => any }).generateInvoice;
    if (fn) {
      const result = fn(threadId, amount);
      return {
        id: String(result.invoiceId ?? result.id ?? `INV-${Date.now()}`),
        amount: Number(result.amount ?? amount),
        currency: String(result.currency ?? 'USD'),
      };
    }
  } catch {
    /* local mock */
  }
  return {
    id: `INV-${Date.now().toString(36).toUpperCase()}`,
    amount,
    currency: 'USD',
  };
}

function Bubble({
  item,
  styles,
  isElite,
}: {
  item: ThreadMessage;
  styles: ReturnType<typeof makeStyles>;
  isElite: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  if (item.from === 'system') {
    return (
      <Animated.View style={[styles.systemBubble, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.systemText}>{item.text}</Text>
      </Animated.View>
    );
  }

  const isMe = item.from === 'me';
  return (
    <Animated.View
      style={[styles.bubble, isMe ? styles.me : styles.them, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={[styles.bubbleText, isMe && styles.meText]}>{item.text}</Text>
      <Text style={[styles.time, isMe && (isElite ? styles.timeMeElite : styles.timeMe)]}>
        {item.time}
        {isMe ? (item.read ? ' ✔✔' : ' ✔') : ''}
      </Text>
    </Animated.View>
  );
}

function TypingDots({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0.35)).current;
  const b = useRef(new Animated.Value(0.35)).current;
  const c = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.35, duration: 320, useNativeDriver: true }),
        ])
      );
    const loops = [pulse(a, 0), pulse(b, 140), pulse(c, 280)];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a, b, c]);

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 2 }}>
      {[a, b, c].map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            opacity: v,
          }}
        />
      ))}
    </View>
  );
}

export default function ChatThreadScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { state: tierState, setTier } = useTier();
  const isElite = tierState.isElite;
  const c = paletteFor(isElite);
  const thread = CHAT_THREADS.find((t) => t.id === route.params?.threadId) || CHAT_THREADS[0];
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ThreadMessage[]>(
    thread.messages.map((m) => ({ ...m }))
  );
  const [typing, setTyping] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('250');
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList>(null);
  const styles = useMemo(() => makeStyles(c, isElite), [c, isElite]);
  const venues = useMemo(() => resolveVenues(thread.id), [thread.id]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  const pushSystem = (body: string) => {
    setMessages((m) => [
      ...m,
      {
        id: `sys_${Date.now()}`,
        from: 'system',
        text: body,
        time: 'Now',
      },
    ]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const scheduleAutoReply = (userText: string) => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setTyping(true);
    replyTimer.current = setTimeout(() => {
      setTyping(false);
      const lower = userText.toLowerCase();
      let reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      if (lower.includes('venue') || lower.includes('meet')) {
        reply = 'Happy to meet — propose a venue when you’re ready.';
      } else if (lower.includes('invoice') || lower.includes('$') || lower.includes('£')) {
        reply = 'Got it — generate the invoice when the amount is set.';
      } else if (userText.length < 24) {
        reply = 'Short and clear — I’m in.';
      }
      setMessages((m) => [
        ...m.map((msg) => (msg.from === 'me' && !msg.read ? { ...msg, read: true } : msg)),
        {
          id: `them_${Date.now()}`,
          from: 'them',
          text: reply,
          time: 'Now',
        },
      ]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }, 1200);
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    trackInteraction('send_message', thread.id);
    setMessages((m) => [
      ...m,
      {
        id: `local_${Date.now()}`,
        from: 'me',
        text: trimmed,
        time: 'Now',
        read: false,
      },
    ]);
    setText('');
    scheduleAutoReply(trimmed);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const onPickVenue = (v: VenueRow) => {
    trackInteraction('schedule', thread.id, { venue: v.name });
    setScheduleOpen(false);
    const detail = [v.name, v.area, v.slot].filter(Boolean).join(' · ');
    pushSystem(`📅 Venue proposed: ${detail}`);
  };

  const onGenerateInvoice = () => {
    const amount = parseFloat(invoiceAmount.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Amount required', 'Enter a valid invoice amount.');
      return;
    }
    trackInteraction('invoice', thread.id, { amount });
    const inv = resolveInvoice(thread.id, amount);
    setInvoiceOpen(false);
    pushSystem(
      `🧾 Invoice ${inv.id} · ${inv.currency} ${inv.amount.toFixed(2)} — encrypted draft, no bank rails exchanged.`
    );
  };

  if (thread.locked) {
    const showEliteUpsell = !isElite && thread.tier === 'Elite';
    return (
      <View style={styles.root}>
        <TierPrivilegeBanner
          onUpsellPress={() => setTier('Elite')}
          onHubPress={() =>
            Alert.alert('Global Hub', 'Elite can toggle London / Dubai / New York hubs.')
          }
        />
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.back}>←</Text>
          </Pressable>
          <Image source={{ uri: thread.avatar }} style={[styles.avatar, styles.avatarLocked]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{thread.name}</Text>
            <Text style={styles.headerSub}>
              {thread.tier === 'Elite' ? 'Elite · Locked' : 'Premium · Locked'}
            </Text>
          </View>
        </View>
        <View style={styles.lockedBox}>
          <Text style={styles.lockedTitle}>Thread locked</Text>
          <Text style={styles.lockedBody}>
            Progressive disclosure: respond to a Dating prompt or earn community reputation before
            unconstrained WhatsApp-style chat unlocks with this profile.
          </Text>
          {showEliteUpsell ? (
            <Pressable style={styles.unlockHint} onPress={() => setTier('Elite')}>
              <Text style={styles.unlockText}>Unlock Elite to preview</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.unlockHint} onPress={() => navigation.goBack()}>
              <Text style={styles.unlockText}>Back to Dating prompts</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={8}
    >
      <TierPrivilegeBanner
        onUpsellPress={() => setTier('Elite')}
        onHubPress={() =>
          Alert.alert('Global Hub', 'Elite can toggle London / Dubai / New York hubs.')
        }
      />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Image source={{ uri: thread.avatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{thread.name}</Text>
          <Text style={styles.headerSub}>
            {thread.tier === 'Elite' ? 'Elite Layer Vetted' : 'Premium'}
            {typing ? ' · typing…' : ''}
          </Text>
        </View>
        <Pressable onPress={() => Alert.alert('Call', 'Voice/video via CometChat hook (soon).')}>
          <Text style={styles.call}>Call</Text>
        </Pressable>
      </View>

      {!!thread.icebreaker && (
        <View style={styles.ice}>
          <Text style={styles.iceLabel}>Thread initialized via community overlap</Text>
          <Text style={styles.iceBody}>{thread.icebreaker}</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => <Bubble item={item} styles={styles} isElite={isElite} />}
        ListFooterComponent={
          typing ? (
            <View style={[styles.bubble, styles.them, { paddingVertical: 14 }]}>
              <TypingDots color={c.textMuted} />
            </View>
          ) : undefined
        }
      />

      <View style={styles.utils}>
        <Pressable style={styles.utilBtn} onPress={() => setScheduleOpen(true)}>
          <Text style={styles.utilText}>📅 Schedule High-End Venue</Text>
        </Pressable>
        <Pressable style={styles.utilBtn} onPress={() => setInvoiceOpen(true)}>
          <Text style={styles.utilText}>🧾 Generate Invoice</Text>
        </Pressable>
      </View>

      <View style={styles.composer}>
        <Text style={styles.plus}>+</Text>
        <TextInput
          style={styles.input}
          placeholder="Type clear messaging string here…"
          placeholderTextColor={c.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable onPress={send} style={styles.send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>

      <Modal visible={scheduleOpen} animationType="slide" transparent onRequestClose={() => setScheduleOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setScheduleOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Schedule high-end venue</Text>
            <Text style={styles.sheetSub}>Maps venues in your geohash sector (obscured).</Text>
            {venues.map((v) => (
              <Pressable key={v.name + v.slot} style={styles.venueRow} onPress={() => onPickVenue(v)}>
                <Text style={styles.venueName}>{v.name}</Text>
                <Text style={styles.venueMeta}>{v.area}</Text>
                {!!v.slot && <Text style={styles.venueSlot}>{v.slot}</Text>}
              </Pressable>
            ))}
            <Pressable style={styles.sheetCancel} onPress={() => setScheduleOpen(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={invoiceOpen} animationType="slide" transparent onRequestClose={() => setInvoiceOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setInvoiceOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Generate invoice</Text>
            <Text style={styles.sheetSub}>Encrypted digital invoice — no bank accounts exchanged.</Text>
            <Text style={styles.amountLabel}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="decimal-pad"
              value={invoiceAmount}
              onChangeText={setInvoiceAmount}
              placeholder="250"
              placeholderTextColor={c.textMuted}
            />
            <Pressable style={styles.sheetPrimary} onPress={onGenerateInvoice}>
              <Text style={styles.sheetPrimaryText}>Generate</Text>
            </Pressable>
            <Pressable style={styles.sheetCancel} onPress={() => setInvoiceOpen(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function makeStyles(c: ReturnType<typeof paletteFor>, isElite: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    back: { fontSize: 22, color: c.text, paddingHorizontal: 4 },
    avatar: { width: 36, height: 36, borderRadius: 18 },
    avatarLocked: { opacity: 0.55 },
    headerName: { fontSize: 16, fontWeight: '700', color: c.text },
    headerSub: { fontSize: 11, color: c.textMuted },
    call: { color: c.accent, fontWeight: '700' },
    ice: {
      margin: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
    },
    iceLabel: { fontSize: 11, color: c.textMuted, marginBottom: 4 },
    iceBody: { fontSize: 13, color: c.text, lineHeight: 18 },
    bubble: {
      maxWidth: '78%',
      padding: 12,
      borderRadius: 16,
      marginBottom: 10,
    },
    me: {
      alignSelf: 'flex-end',
      backgroundColor: c.accent,
      borderBottomRightRadius: 4,
    },
    them: {
      alignSelf: 'flex-start',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderBottomLeftRadius: 4,
    },
    systemBubble: {
      alignSelf: 'center',
      maxWidth: '90%',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    systemText: { fontSize: 12, color: c.textMuted, textAlign: 'center', lineHeight: 17 },
    bubbleText: { color: c.text, fontSize: 15, lineHeight: 20 },
    meText: { color: isElite ? '#0B0B0C' : '#FFFFFF' },
    time: { fontSize: 10, color: c.textMuted, marginTop: 4, alignSelf: 'flex-end' },
    timeMe: { color: 'rgba(255,255,255,0.72)' },
    // Elite me-bubble sits on gold accent — white keeps receipts readable on dark Elite chrome
    timeMeElite: { color: 'rgba(255,255,255,0.85)' },
    utils: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
    utilBtn: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    utilText: { fontSize: 11, fontWeight: '600', color: c.text },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    plus: { fontSize: 22, color: c.textMuted, width: 24, textAlign: 'center' },
    input: {
      flex: 1,
      backgroundColor: c.surfaceMuted,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: c.text,
    },
    send: {
      backgroundColor: c.accent,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sendText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '700' },
    lockedBox: { flex: 1, justifyContent: 'center', padding: 28 },
    lockedTitle: { fontSize: 22, fontWeight: '800', color: c.text, marginBottom: 10 },
    lockedBody: { fontSize: 14, color: c.textMuted, lineHeight: 21 },
    unlockHint: {
      marginTop: 20,
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    unlockText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '700' },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    sheetSub: { fontSize: 13, color: c.textMuted, marginTop: 6, marginBottom: 14, lineHeight: 18 },
    venueRow: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    venueName: { fontSize: 15, fontWeight: '700', color: c.text },
    venueMeta: { fontSize: 12, color: c.textMuted, marginTop: 3 },
    venueSlot: { fontSize: 12, color: c.accent, marginTop: 4, fontWeight: '600' },
    amountLabel: { fontSize: 12, color: c.textMuted, fontWeight: '600', marginBottom: 6 },
    amountInput: {
      backgroundColor: c.surfaceMuted,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 14,
    },
    sheetPrimary: {
      backgroundColor: c.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    sheetPrimaryText: { color: isElite ? '#0B0B0C' : '#fff', fontWeight: '800' },
    sheetCancel: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
    sheetCancelText: { color: c.textMuted, fontWeight: '600' },
  });
}
