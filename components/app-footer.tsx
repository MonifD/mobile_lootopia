import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function BottomNav() {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <BottomNavItem icon="🏠" label="ACCUEIL" active onPress={() => router.replace('/home')} />
      <BottomNavItem icon="🗺️" label="CHASSES" onPress={() => router.replace('/(tabs)')} />
      <BottomNavItem icon="⭐" label="SUCCÈS" onPress={() => router.replace('/(tabs)/explore')} />
      <BottomNavItem icon="🏆" label="CLASSEMENT" onPress={() => router.replace('/(tabs)/leaderboard')} />
      <BottomNavItem icon="👤" label="PROFIL" onPress={() => router.replace('/(tabs)/profile')} />
    </View>
  );
}

function BottomNavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.bottomItem, pressed && styles.bottomItemPressed, active && styles.bottomItemActive]}>
      <Text style={styles.bottomIcon}>{icon}</Text>
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 72,
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 18,
    backgroundColor: '#140f0a',
    borderWidth: 2,
    borderColor: '#5f3b16',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#3f2a13' },
  bottomItemPressed: { opacity: 0.85 },
  bottomItemActive: { backgroundColor: '#2d1b08', borderWidth: 2, borderColor: '#f59e0b' },
  bottomIcon: { fontSize: 22 },
  bottomLabel: { marginTop: 3, color: '#c9b58b', fontSize: 9, fontWeight: '900' },
  bottomLabelActive: { color: '#facc15' },
});
