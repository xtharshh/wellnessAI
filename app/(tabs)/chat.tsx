import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Serif, useCalm } from '@/src/components/calm/kit';
import { useAuthStore } from '@/src/stores/authStore';
import { sendChatMessage, type ChatMessage } from '@/src/services/chatbot';
import { sendDoctorMessage, type DoctorChatMessage } from '@/src/services/doctor';
import { fonts } from '@/src/theme/typography';

const QUICK_PROMPTS = [
  'I feel stressed and mentally exhausted.',
  'I cannot sleep properly.',
  'What are some healthy habits?',
  'Suggest an exercise for today.',
];

const DOCTOR_PROMPTS = [
  'I have a headache and poor sleep — what should I watch for?',
  'My stress is high lately, should I see a doctor?',
  'I feel anxious before work — triage me.',
  'When should I seek urgent care?',
];

export default function ChatScreen() {
  const { c } = useCalm();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isDoctor = params.mode === 'doctor';
  const user = useAuthStore((state) => state.user);
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: isDoctor
        ? `Hello ${user?.displayName || 'there'}. I am your AI Doctor (triage only, not a diagnosis). Describe symptoms and I'll give a safe next step + when to see a live doctor.`
        : `Hello ${user?.displayName || 'there'}. I am your MindTrace companion. Tell me how you're feeling and I'll suggest something kind for right now.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isThinking]);

  const actionFor = (text: string) => {
    if (text.includes('youtube.com')) {
      return { label: 'Open Music', go: () => router.push('/(tabs)/recommendations') };
    }
    if (text.includes('Breathwork') || text.includes('exercise')) {
      return { label: 'Open Exercises', go: () => router.push('/(tabs)/exercises') };
    }
    return null;
  };

  const handleSend = async (raw: string) => {
    const textToSend = raw.trim();
    if (!textToSend) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    try {
      const replyText = isDoctor
        ? await sendDoctorMessage(textToSend, messages as DoctorChatMessage[], user?.id)
        : await sendChatMessage(textToSend, messages, user?.id);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, sender: 'ai', text: replyText, timestamp: new Date().toISOString() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to reach the assistant. Please try again.');
    } finally {
      setIsThinking(false);
    }
  };

  const prompts = isDoctor ? DOCTOR_PROMPTS : QUICK_PROMPTS;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.circle, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <Feather name="arrow-left" size={18} color={c.ink} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: c.muted }]}>
              {isDoctor ? 'AI DOCTOR • TRIAGE ONLY' : 'WELLNESS COMPANION'}
            </Text>
            <Serif style={[styles.title, { color: c.ink }]}>
              {isDoctor ? 'AI Doctor' : 'Chat'}
            </Serif>
          </View>
          <View style={[styles.avatar, { backgroundColor: c.limeSoft }]}>
            <Feather name="cpu" size={18} color={c.limeInk} />
          </View>
        </View>

        <View style={[styles.disclaimer, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Feather name="alert-triangle" size={13} color={c.muted} />
          <Text style={[styles.disclaimerText, { color: c.muted }]}>
            {isDoctor
              ? 'Triage only, not a diagnosis. Emergency? Dial 988 or use SOS in Counsellor.'
              : 'A supportive companion, not a clinician. Emergency? Dial 988.'}
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => {
            const mine = m.sender === 'user';
            const action = !mine ? actionFor(m.text) : null;
            return (
              <View key={m.id} style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: c.ink, borderBottomRightRadius: 6 }
                      : { backgroundColor: c.surface, borderColor: c.line, borderBottomLeftRadius: 6 },
                  ]}
                >
                  <Text style={[styles.msgText, { color: mine ? c.bg : c.ink }]}>{m.text}</Text>
                  {action ? (
                    <Pressable
                      onPress={action.go}
                      accessibilityRole="button"
                      accessibilityLabel={action.label}
                      style={[styles.actionBtn, { backgroundColor: mine ? c.bg : c.ink }]}
                    >
                      <Text style={[styles.actionText, { color: mine ? c.ink : c.bg }]}>
                        {action.label} →
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
          {isThinking ? (
            <View style={[styles.row, styles.rowLeft]}>
              <View style={[styles.bubble, { backgroundColor: c.surface, borderColor: c.line }]}>
                <ActivityIndicator size="small" color={c.muted} />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.prompts}
        >
          {prompts.map((p) => (
            <Pressable
              key={p}
              onPress={() => handleSend(p)}
              accessibilityRole="button"
              accessibilityLabel={`Ask: ${p}`}
              style={[styles.prompt, { backgroundColor: c.surface, borderColor: c.line }]}
            >
              <Text style={[styles.promptText, { color: c.ink }]} numberOfLines={1}>
                {p}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <View style={[styles.inputBox, { backgroundColor: c.surface, borderColor: c.line }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tell me how you're feeling…"
              placeholderTextColor={c.faint}
              style={[styles.input, { color: c.ink }]}
              onSubmitEditing={() => handleSend(inputText)}
              accessibilityLabel="Message input"
            />
            <Pressable
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={[styles.send, { backgroundColor: c.ink, opacity: inputText.trim() ? 1 : 0.4 }]}
            >
              <Feather name="arrow-up" size={16} color={c.bg} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8 },
  circle: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2 },
  title: { fontSize: 24 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  disclaimer: {
    flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 10,
    padding: 10, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start',
  },
  disclaimerText: { flex: 1, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16 },
  messages: { paddingHorizontal: 20, paddingVertical: 14, gap: 10, paddingBottom: 8 },
  row: { flexDirection: 'row', width: '100%' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, borderWidth: 1, borderColor: 'transparent' },
  msgText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  actionBtn: { marginTop: 10, borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  actionText: { fontFamily: fonts.bold, fontSize: 13 },
  prompts: { paddingHorizontal: 20, gap: 8, paddingVertical: 8 },
  prompt: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', maxWidth: 260 },
  promptText: { fontFamily: fonts.medium, fontSize: 12 },
  inputRow: { paddingHorizontal: 20, paddingBottom: 110, paddingTop: 4 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderRadius: 999,
    paddingLeft: 16, paddingRight: 6, minHeight: 54,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, minHeight: 48 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
