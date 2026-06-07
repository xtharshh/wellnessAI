import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/stores/authStore';
import { sendChatMessage, ChatMessage } from '@/src/services/chatbot';
import { radius, spacing } from '@/src/theme/spacing';

const QUICK_PROMPTS = [
  "I feel stressed and mentally exhausted.",
  "I cannot sleep properly.",
  "I have had headaches for several days.",
  "What are some healthy habits?"
];

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const scrollViewRef = useRef<ScrollView>(null);

  const getActionButton = (messageText: string) => {
    if (messageText.includes('Music') && messageText.includes('youtube.com')) {
      return { label: 'Go to Music', action: () => router.push('/(tabs)/recommendations?tab=lifestyle&category=Music') };
    }
    if (messageText.includes('Cold Reset') || messageText.includes('exercise')) {
      return { label: 'View Exercises', action: () => router.push('/(tabs)/exercises') };
    }
    return null;
  };

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
      const replyText = await sendChatMessage(textToSend, messages, user?.id);
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

  // Color theme mapping
  const bgThemeColor = isDark ? '#0c0b16' : '#f6f5fb';
  const headerBgColor = isDark ? '#0f0d22' : '#ffffff';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.08)';
  const textColor = isDark ? '#ffffff' : '#0f0d1e';
  const textMutedColor = isDark ? '#9ca3af' : '#6b7280';
  const accentPurple = '#8b5cf6';
  
  // Disclaimer Styling
  const disclaimerBg = isDark ? '#2d1414' : '#fef2f2';
  const disclaimerBorder = 'rgba(239, 68, 68, 0.2)';
  const disclaimerText = '#ef4444';

  // AI Message bubble color
  const aiBubbleBg = isDark ? '#1e1b4b' : '#f1f5f9';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: bgThemeColor }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenContainer contentStyle={styles.container}>
        {/* Header Banner */}
        <View style={[styles.headerBanner, { backgroundColor: headerBgColor, borderBottomColor: cardBorderColor }]}>
          <View style={styles.headerLeft}>
            {/* Glowing Avatar */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarGlow, { borderColor: accentPurple }]} />
              <View style={[styles.avatarCircle, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#ebe6f6' }]}>
                <Feather name="cpu" size={20} color={accentPurple} />
              </View>
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={[styles.headerSubtitle, { color: textMutedColor }]}>
                MENTAL WELLNESS ASSISTANT
              </Text>
              <Text style={[styles.headerTitle, { color: textColor }]}>
                MindTrace Chat
              </Text>
            </View>
          </View>
          
          <Pressable style={[styles.calendarBtn, { borderColor: cardBorderColor, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff' }]}>
            <Feather name="calendar" size={16} color={textColor} />
          </Pressable>
        </View>

        {/* Disclaimer Banner */}
        <View style={[styles.disclaimer, { backgroundColor: disclaimerBg, borderColor: disclaimerBorder }]}>
          <Feather name="alert-triangle" size={14} color={disclaimerText} style={styles.disclaimerIcon} />
          <Text style={[styles.disclaimerText, { color: disclaimerText }]}>
            Disclaimer: MindTrace AI estimates wellness indicators passively. Not a clinical diagnosis. If in emergency, dial <Text style={styles.disclaimerBold}>988</Text>.
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
                      ? [styles.userBubble, { backgroundColor: accentPurple }]
                      : [styles.aiBubble, { backgroundColor: aiBubbleBg }],
                  ]}
                >
                  <Text style={[styles.messageText, { color: isUser ? '#ffffff' : textColor }]}>
                    {msg.text}
                  </Text>
                  {!isUser && getActionButton(msg.text) && (
                    <Pressable
                      onPress={getActionButton(msg.text)?.action}
                      style={[styles.actionButton, { marginTop: 12, backgroundColor: accentPurple, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 }]}
                    >
                      <Text style={[styles.actionButtonText, { color: '#ffffff', fontSize: 13, fontWeight: '600' }]}>
                        {getActionButton(msg.text)?.label}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {isThinking && (
            <View style={[styles.messageWrapper, styles.aiWrapper]}>
              <View style={[styles.bubble, styles.aiBubble, { backgroundColor: aiBubbleBg, flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={accentPurple} />
                <Text style={[styles.thinkingText, { color: textMutedColor }]}>Thinking...</Text>
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
                style={[styles.promptChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: cardBorderColor }]}
              >
                <Text style={[styles.promptText, { color: textColor }]}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar (Capsule Style) */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputCapsule, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', borderColor: cardBorderColor }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Tell me how you're feeling today..."
              placeholderTextColor={textMutedColor}
              style={[styles.inputField, { color: textColor }]}
              onSubmitEditing={() => handleSend(inputText)}
            />
            
            <View style={styles.inputActions}>
              <Pressable style={styles.micBtn}>
                <Feather name="mic" size={16} color={textMutedColor} />
              </Pressable>
              
              <Pressable
                onPress={() => handleSend(inputText)}
                style={[styles.sendBtn, { backgroundColor: inputText.trim() ? accentPurple : 'rgba(124, 58, 237, 0.4)' }]}
                disabled={!inputText.trim()}
              >
                <Feather name="arrow-up" size={16} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </View>
        
        {/* visual buffer for floating tab bar */}
        <View style={{ height: 100 }} />
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
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    opacity: 0.6,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 1,
  },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  disclaimerBold: {
    fontWeight: 'bold',
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
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
  },
  inputField: {
    flex: 1,
    fontSize: 13.5,
    height: '100%',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  micBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
