import { Stack, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] ?? '(tabs)';

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220' }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" options={{ title: 'Chasses' }} />
        <Stack.Screen name="explore" options={{ title: 'Accomplissements' }} />
        <Stack.Screen name="profile" options={{ title: 'Profil' }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Classement' }} />
      </Stack>

      <View style={styles.footer}>
        <FooterNavItem
          icon="🏠"
          label="ACCUEIL"
          active={currentRoute === 'home'}
          onPress={() => router.replace('/home')}
        />
        <FooterNavItem
          icon="🗺️"
          label="CHASSES"
          active={currentRoute === '(tabs)'}
          onPress={() => router.replace('/(tabs)')}
        />
        <FooterNavItem
          icon="⭐"
          label="SUCCÈS"
          active={currentRoute === 'explore'}
          onPress={() => router.replace('/(tabs)/explore')}
        />
        <FooterNavItem
          icon="🏆"
          label="CLASSEMENT"
          active={currentRoute === 'leaderboard'}
          onPress={() => router.replace('/(tabs)/leaderboard')}
        />
        <FooterNavItem
          icon="👤"
          label="PROFIL"
          active={currentRoute === 'profile'}
          onPress={() => router.replace('/(tabs)/profile')}
        />
      </View>
    </View>
  );
}

function FooterNavItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.footerItem, pressed && styles.footerItemPressed, active && styles.footerItemActive]}>
      <Text style={styles.footerIcon}>{icon}</Text>
      <Text style={[styles.footerLabel, active && styles.footerLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  footer: {
    height: 72,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 18,
    backgroundColor: '#140f0a',
    borderWidth: 2,
    borderColor: '#5f3b16',
    flexDirection: 'row' as const,
    overflow: 'hidden' as const,
  },
  footerItem: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRightWidth: 1,
    borderRightColor: '#3f2a13',
  },
  footerItemActive: {
    backgroundColor: '#2d1b08',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  footerItemPressed: {
    opacity: 0.85,
  },
  footerIcon: {
    fontSize: 22,
  },
  footerLabel: {
    marginTop: 3,
    color: '#c9b58b',
    fontSize: 9,
    fontWeight: '900' as const,
  },
  footerLabelActive: {
    color: '#facc15',
  },
};
