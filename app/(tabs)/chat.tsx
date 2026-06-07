import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { GlassCard } from '@/src/components/ui/GlassCard';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { sendChatMessage, ChatMessage } from '@/src/services/chatbot';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const QUICK_PROMPTS = [
  "I feel stressed and mentally exhausted.",
  "I cannot sleep properly.",
  "I have had headaches for several days.",
  "What are some healthy habits?"
];

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.displayName || 'there'}. I am your MindTrace AI assistant. I passively observe wellness signals to help support your mental wellbeing. How can I help you today?`,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isThinking]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const replyText = await sendChatMessage(textToSend, messages);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      Alert.alert('Error', 'Failed to communicate with wellness assistant.');
    } finally {
      setIsThinking(false);
    }
  };

  const getProfileInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return 'OL';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenContainer contentStyle={styles.container}>
        {/* Header Banner */}
        <LinearGradient
          colors={isDark ? ['#1a1030', '#0a0b10'] : ['#a2cbfd', '#f7bee9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBanner, { borderBottomColor: colors.outline }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCol}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                <Text style={[styles.avatarText, { color: isDark ? colors.primary : '#0f172a' }]}>{getProfileInitials()}</Text>
              </View>
              <View>
                <Text style={[styles.eyebrow, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.55)' }]}>
                  Mental Wellness Assistant
                </Text>
                <Text style={[styles.headerTitle, { color: isDark ? colors.onSurface : '#0f172a' }]}>
                  MindTrace Chat
                </Text>
              </View>
            </View>
            <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
              <Feather name="cpu" size={18} color={colors.primary} />
            </View>
          </View>
        </LinearGradient>

        {/* Emergency Disclaimer Banner */}
        <View style={[styles.disclaimerCard, { backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }]}>
          <Feather name="alert-triangle" size={14} color="#ef4444" style={{ marginTop: 2 }} />
          <Text style={[styles.disclaimerText, { color: colors.onSurfaceVariant }]}>
            <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>Disclaimer:</Text> MindTrace AI estimates wellness indicators passively. We do not provide clinical diagnoses. If in emergency, please consult professionals or dial 988.
          </Text>
        </View>

        {/* Messages Scroll View */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesScroll}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.userWrapper : styles.aiWrapper,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.primaryAccent }]
                      : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.outline }],
                  ]}
                >
                  <Text style={[styles.messageText, { color: isUser ? '#ffffff' : colors.onSurface }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {isThinking && (
            <View style={[styles.messageWrapper, styles.aiWrapper]}>
              <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.outline, flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.thinkingText, { color: colors.onSurfaceVariant }]}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts Suggestions */}
        <View style={styles.promptsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsRow}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSend(prompt)}
                style={[styles.promptChip, { backgroundColor: colors.surface, borderColor: colors.outline }]}
              >
                <Text style={[styles.promptText, { color: colors.onSurfaceVariant }]}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.outline }]}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tell me how you're feeling today..."
            placeholderTextColor={colors.onSurfaceVariant}
            style={[styles.inputField, { color: colors.onSurface }]}
            onSubmitEditing={() => handleSend(inputText)}
          />
          <Pressable
            onPress={() => handleSend(inputText)}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primaryAccent : colors.outline }]}
            disabled={!inputText.trim()}
          >
            <Feather name="send" size={16} color="#ffffff" />
          </Pressable>
        </View>
        
        {/* visual buffer for floating tab bar */}
        <View style={{ height: 90 }} />
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
  },
  headerBanner: {
    paddingTop: 54,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderBottomWidth: 1,
  },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarCol: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  eyebrow: { ...typography.labelCaps, textTransform: 'none', fontSize: 11 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  iconBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  
  disclaimerCard: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  messagesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  thinkingText: {
    fontSize: 13,
  },
  promptsSection: {
    paddingVertical: 8,
  },
  promptsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 14.5,
    height: 40,
    paddingHorizontal: 12,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
