import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/src/hooks/useTheme';
import { radius, spacing } from '@/src/theme/spacing';
import { typography, fonts } from '@/src/theme/typography';

interface DashboardHeaderProps {
  avatar?: string;
  greeting: string;
  greetingName: string;
  onNotifications?: () => void;
}

export function DashboardHeader({
  avatar,
  greeting,
  greetingName,
  onNotifications,
}: DashboardHeaderProps) {
  const { colors, isDark } = useTheme();

  const getInitials = () => {
    return greetingName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <LinearGradient
      colors={isDark
        ? ['#1a0e3a', '#110828', '#0a0514']
        : ['#7c3aed', '#8b5cf6', '#a78bfa']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderBottomColor: isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(124, 58, 237, 0.15)' }]}>
      
      {/* Decorative glowing circles behind content */}
      <View style={[styles.decorCircle, {
        width: 200, height: 200, borderRadius: 100,
        top: -70, left: -50,
        backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.12)',
      }]} />
      <View style={[styles.decorCircle, {
        width: 250, height: 250, borderRadius: 125,
        top: -30, right: -60,
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.08)',
      }]} />
      <View style={[styles.decorCircle, {
        width: 130, height: 130, borderRadius: 65,
        bottom: -40, left: 60,
        backgroundColor: isDark ? 'rgba(96, 165, 250, 0.08)' : 'rgba(255, 255, 255, 0.1)',
      }]} />
      {/* Extra sparkle circle for premium depth */}
      <View style={[styles.decorCircle, {
        width: 80, height: 80, borderRadius: 40,
        top: 30, right: 50,
        backgroundColor: isDark ? 'rgba(196, 181, 253, 0.06)' : 'rgba(255, 255, 255, 0.15)',
      }]} />

      {/* Profile Row */}
      <View style={styles.profileRow}>
        <View style={styles.profileLeft}>
          <LinearGradient
            colors={isDark ? ['#7c3aed', '#6d28d9'] : ['#ffffff', '#f3e8ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.avatar, { borderColor: isDark ? 'rgba(196, 181, 253, 0.3)' : 'rgba(255, 255, 255, 0.6)' }]}
          >
            <Text style={[styles.avatarText, { color: isDark ? '#ffffff' : '#7c3aed' }]}>
              {getInitials()}
            </Text>
          </LinearGradient>
          <View style={styles.greetingCol}>
            <Text style={[styles.eyebrow, { color: isDark ? 'rgba(196, 181, 253, 0.7)' : 'rgba(255, 255, 255, 0.75)' }]}>
              {greeting.toUpperCase()}
            </Text>
            <Text style={[styles.name, { color: '#ffffff' }]}>
              Hi, {greetingName} 👋
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onNotifications}
          style={[styles.bellButton, {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.2)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
          }]}
        >
          <Feather name="bell" size={18} color="#ffffff" />
          {/* Active notification indicator dot */}
          <View style={[styles.activeDot, { backgroundColor: '#f97316' }]} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.2)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.3)',
      }]}>
        <Feather name="search" size={16} color={isDark ? 'rgba(196, 181, 253, 0.6)' : 'rgba(255, 255, 255, 0.7)'} style={{ marginRight: 2 }} />
        <TextInput
          placeholder="Passive cognitive telemetry active..."
          placeholderTextColor={isDark ? 'rgba(196, 181, 253, 0.5)' : 'rgba(255, 255, 255, 0.65)'}
          style={[styles.searchInput, { color: '#ffffff' }]}
          editable={false}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: spacing.gutter,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    borderBottomWidth: 1,
    gap: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  greetingCol: {
    gap: 3,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.8,
  },
  name: {
    fontSize: 22,
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  activeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
  searchBar: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
});
