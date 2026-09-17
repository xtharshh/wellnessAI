import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { useCalm } from '@/src/components/calm/kit';
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
  const { c } = useCalm();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: c.surface,
          borderColor: c.line,
          borderWidth: 1,
          borderRadius: 28,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          shadowColor: c.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 18,
          elevation: 8,
        },
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.faint,
        tabBarLabelStyle: {
          fontFamily: typography.labelCaps.fontFamily,
          fontSize: 10,
          letterSpacing: 0.4,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="counsellor"
        options={{
          title: 'Counsellor',
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Self-care',
          tabBarIcon: () => (
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: c.ink,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -20,
              }}
            >
              <Feather size={20} name="award" color={c.lime} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color }) => <TabIcon name="book-open" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
      {/* Hidden but reachable */}
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen
        name="breath"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen name="recommendations" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
