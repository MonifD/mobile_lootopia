import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';

interface ChromaButtonProps extends PressableProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  emoji?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ChromaButton({
  text,
  onPress,
  variant = 'primary',
  emoji,
  size = 'md',
  style,
  ...pressableProps
}: ChromaButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getGradientColors = (): readonly [string, string] => {
    switch (variant) {
      case 'primary':
        return ['#00d9ff', '#0099ff'] as const;
      case 'secondary':
        return ['#ff006e', '#8338ec'] as const;
      default:
        return ['#3a86ff', '#06ffa5'] as const;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 10, paddingHorizontal: 14 };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 18 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 18;
      default:
        return 15;
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        {...pressableProps}
      >
        {variant === 'minimal' ? (
          <View style={[styles.minimalButton, getSizeStyles()]}>
            <View style={styles.content}>
              {emoji && <ThemedText style={styles.emoji}>{emoji}</ThemedText>}
              <ThemedText style={[styles.buttonText, { fontSize: getTextSize() }, styles.minimalText]}>
                {text}
              </ThemedText>
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientButton, getSizeStyles()]}
          >
            {/* Inner border glow effect */}
            <View style={styles.glowBorder} />
            
            {/* Content */}
            <View style={styles.content}>
              {emoji && <ThemedText style={styles.emoji}>{emoji}</ThemedText>}
              <ThemedText style={[styles.buttonText, { fontSize: getTextSize() }, styles.gradientText]}>
                {text}
              </ThemedText>
            </View>
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#00d9ff',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  minimalButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(160,174,192,0.3)',
    backgroundColor: 'rgba(30,41,59,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBorder: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  emoji: {
    fontSize: 18,
  },
  buttonText: {
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  gradientText: {
    color: '#000000',
  },
  minimalText: {
    color: '#a0aeb8',
  },
});
