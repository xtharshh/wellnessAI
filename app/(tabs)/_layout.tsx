import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { useTheme } from '@/src/hooks/useTheme';
import { typography } from '@/src/theme/typography';

function TabIcon({
  name,
  color,
}: {
  name: ComponentProps<typeof Feather>['name'];
  color: ComponentProps<typeof Feather>['color'];
}) {
  return <Feather size={20} name={name} color={color} />;
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: '#0f172a', // Deep slate-black premium background
          borderRadius: 28,
          height: 68,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarActiveTintColor: '#a2cbfd', // Soft Blue active highlight
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarLabelStyle: {
          fontFamily: typography.labelCaps.fontFamily,
          fontSize: 10,
          letterSpacing: 0.4,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabIcon name="activity" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color }) => <TabIcon name="trending-up" color={color} />,
        }}
      />
      <Tabs.Screen
        name="breath"
        options={{
          title: 'Breathe',
          tabBarIcon: ({ color }) => <TabIcon name="wind" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'AI Recs',
          tabBarIcon: ({ color }) => <TabIcon name="zap" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
