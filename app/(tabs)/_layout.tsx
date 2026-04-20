import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#16233a',
          borderTopColor: 'rgba(148,163,184,0.25)',
          height: 66,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#16233a',
        },
        headerTintColor: '#e2e8f0',
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerRight: () => (
          <Pressable
            onPress={() => router.replace('/welcome')}
            style={{
              marginRight: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(52,211,153,0.35)',
              backgroundColor: 'rgba(16,185,129,0.18)',
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}>
            <Text style={{ color: '#d1fae5', fontSize: 12, fontWeight: '700' }}>Accueil</Text>
          </Pressable>
        ),
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chasses',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Accomplissements',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="star.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Classement',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="trophy.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
