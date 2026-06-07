import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';

export function CrisisDisclaimer() {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
          borderColor: 'rgba(239,68,68,0.2)',
        },
      ]}>
      <Feather name="alert-triangle" size={14} color="#ef4444" style={styles.icon} />
      <Text style={styles.text}>
        If you experience thoughts of self-harm, please call{' '}
        <Text style={styles.highlight}>988</Text> or visit your nearest emergency room. MindTrace is a wellness tool, not a crisis service.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: spacing.gutter,
    marginTop: 14,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#ef4444',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#ef4444',
  },
});
