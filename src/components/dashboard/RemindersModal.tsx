import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/src/hooks/useTheme';
import { PrimaryButton } from '@/src/components/ui/PrimaryButton';
import { radius, spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { NotificationService, STORAGE_KEYS } from '@/src/services/notificationService';

interface RemindersModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RemindersModal({ visible, onClose }: RemindersModalProps) {
  const { colors } = useTheme();

  const [breaksEnabled, setBreaksEnabled] = useState(true);
  const [hydrationEnabled, setHydrationEnabled] = useState(true);
  const [breakInterval, setBreakInterval] = useState(45); // minutes
  const [hydrationTarget, setHydrationTarget] = useState(2500); // ml

  // Load saved preferences
  useEffect(() => {
    async function loadPrefs() {
      try {
        const be = await AsyncStorage.getItem(STORAGE_KEYS.BREAKS_ENABLED);
        const he = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_ENABLED);
        const bi = await AsyncStorage.getItem(STORAGE_KEYS.BREAK_INTERVAL);
        const ht = await AsyncStorage.getItem(STORAGE_KEYS.HYDRATION_TARGET);

        if (be !== null) setBreaksEnabled(be === 'true');
        if (he !== null) setHydrationEnabled(he === 'true');
        if (bi !== null) setBreakInterval(parseInt(bi, 10));
        if (ht !== null) setHydrationTarget(parseInt(ht, 10));
      } catch (e) {
        console.warn('Failed to load reminder settings:', e);
      }
    }
    if (visible) {
      loadPrefs();
    }
  }, [visible]);

  const handleSave = async () => {
    const res = await NotificationService.saveAndSchedule(
      breaksEnabled,
      hydrationEnabled,
      breakInterval,
      hydrationTarget
    );

    // Close the modal immediately so the user doesn't see it hanging
    onClose();

    if (Platform.OS === 'web') {
      // Delay alert slightly on web to let the modal transition close smoothly
      setTimeout(() => {
        window.alert(res.text);
      }, 100);
    } else {
      Alert.alert(
        res.success ? 'Settings Saved' : 'Error',
        res.text
      );
    }
  };

  const handleSendTest = async () => {
    const res = await NotificationService.sendTestNotification();
    if (res.success) {
      if (Platform.OS === 'web') {
        window.alert(res.text);
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert(res.text);
      } else {
        Alert.alert('Notification Error', res.text);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Feather name="bell" size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.onSurface }]}>Reminders & Alerts</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.content}>
            {/* Break Reminders Toggle */}
            <View style={styles.settingBlock}>
              <View style={styles.row}>
                <View style={styles.textCol}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Screen Break Reminders</Text>
                  <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                    Get notified to rest your eyes and stretch after prolonged screen activity.
                  </Text>
                </View>
                <Switch
                  value={breaksEnabled}
                  onValueChange={setBreaksEnabled}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={breaksEnabled ? colors.primaryAccent : '#f4f3f4'}
                />
              </View>

              {breaksEnabled && (
                <View style={styles.subSetting}>
                  <Text style={[styles.subLabel, { color: colors.onSurfaceVariant }]}>Interval Time</Text>
                  <View style={styles.optionsRow}>
                    {[30, 45, 60, 90].map((mins) => (
                      <Pressable
                        key={mins}
                        onPress={() => setBreakInterval(mins)}
                        style={[
                          styles.optBtn,
                          { borderColor: colors.outline },
                          breakInterval === mins && { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
                        ]}
                      >
                        <Text style={[styles.optText, { color: breakInterval === mins ? '#fff' : colors.onSurface }]}>
                          {mins}m
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Hydration Reminders Toggle */}
            <View style={styles.settingBlock}>
              <View style={styles.row}>
                <View style={styles.textCol}>
                  <Text style={[styles.settingTitle, { color: colors.onSurface }]}>Hydration Reminders</Text>
                  <Text style={[styles.settingDesc, { color: colors.onSurfaceVariant }]}>
                    Ensure optimal cognitive function with gentle drinking notifications.
                  </Text>
                </View>
                <Switch
                  value={hydrationEnabled}
                  onValueChange={setHydrationEnabled}
                  trackColor={{ false: '#767577', true: colors.primary }}
                  thumbColor={hydrationEnabled ? colors.primaryAccent : '#f4f3f4'}
                />
              </View>

              {hydrationEnabled && (
                <View style={styles.subSetting}>
                  <Text style={[styles.subLabel, { color: colors.onSurfaceVariant }]}>Daily Target Goal</Text>
                  <View style={styles.optionsRow}>
                    {[1500, 2000, 2500, 3000].map((ml) => (
                      <Pressable
                        key={ml}
                        onPress={() => setHydrationTarget(ml)}
                        style={[
                          styles.optBtn,
                          { borderColor: colors.outline },
                          hydrationTarget === ml && { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
                        ]}
                      >
                        <Text style={[styles.optText, { color: hydrationTarget === ml ? '#fff' : colors.onSurface }]}>
                          {(ml / 1000).toFixed(1)}L
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Save Button */}
            <View style={{ marginTop: 12, gap: 10 }}>
              <PrimaryButton label="Save Reminder Settings" onPress={handleSave} />
              
              <Pressable
                onPress={handleSendTest}
                style={({ pressed }) => [
                  styles.testBtn,
                  { borderColor: colors.outline, backgroundColor: pressed ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }
                ]}
              >
                <Feather name="bell" size={14} color={colors.onSurface} style={{ marginRight: 6 }} />
                <Text style={[styles.testBtnText, { color: colors.onSurface }]}>Send Test Notification</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    gap: 20,
    paddingVertical: 10,
  },
  settingBlock: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  subSetting: {
    gap: 6,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  subLabel: {
    ...typography.labelCaps,
    fontSize: 9.5,
    letterSpacing: 0.4,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  optText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testBtn: {
    flexDirection: 'row',
    borderWidth: 1.2,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  testBtnText: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
});
