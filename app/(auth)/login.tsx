import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/providers/auth-provider';

function Nail({ style }: { style: object }) {
  return (
    <View style={[styles.nail, style]}>
      <LinearGradient
        colors={['#fef3c7', '#d97706', '#3f2307']}
        style={styles.nailInner}
      />
    </View>
  );
}

function WoodLine() {
  return <View style={styles.woodLine} />;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [fontsLoaded] = useFonts({ Orbitron_700Bold });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const orbitron = fontsLoaded ? 'Orbitron_700Bold' : undefined;

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn(email, password);
      router.replace('/home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/illustration-style-dessin-anime-paysage-vert-riviere-montagnes_1213951-52970.jpg')}
      style={styles.screen}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoArea}>
            <Text style={[styles.logo, { fontFamily: orbitron }]}>LOOTOPIA</Text>

            <View style={styles.ribbon}>
              <Text style={[styles.ribbonText, { fontFamily: orbitron }]}>EXPLORER</Text>
            </View>
          </View>

          <LinearGradient
            colors={['#fff3a3', '#f59e0b', '#6b2f08']}
            style={styles.goldBorder}
          >
            <LinearGradient
              colors={['#7a3f12', '#9a561c', '#5a2b0b']}
              style={styles.woodPanel}
            >
              <Nail style={styles.nailTL} />
              <Nail style={styles.nailTR} />
              <Nail style={styles.nailBL} />
              <Nail style={styles.nailBR} />

              <WoodLine />
              <WoodLine />
              <WoodLine />
              <WoodLine />
              <WoodLine />

              <View style={styles.panelContent}>
                <Text style={[styles.title, { fontFamily: orbitron }]}>CONNEXION</Text>

                <Text style={styles.subtitle}>
                  Connecte-toi pour reprendre{'\n'}ta chasse au trésor.
                </Text>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerGem} />
                  <View style={styles.dividerLine} />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { fontFamily: orbitron }]}>EMAIL</Text>

                  <LinearGradient
                    colors={['#120804', '#301706', '#120804']}
                    style={styles.inputFrame}
                  >
                    <View style={styles.inputIconBox}>
                      <Text style={styles.inputIcon}>✉️</Text>
                    </View>

                    <TextInput
                      style={[styles.input, { fontFamily: orbitron }]}
                      placeholder="ton@email.com"
                      placeholderTextColor="rgba(255,220,150,0.38)"
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </LinearGradient>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { fontFamily: orbitron }]}>MOT DE PASSE</Text>

                  <LinearGradient
                    colors={['#120804', '#301706', '#120804']}
                    style={styles.inputFrame}
                  >
                    <View style={styles.inputIconBox}>
                      <Text style={styles.inputIcon}>🔒</Text>
                    </View>

                    <TextInput
                      style={[styles.input, { fontFamily: orbitron }]}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,220,150,0.38)"
                      value={password}
                      onChangeText={setPassword}
                      editable={!isLoading}
                      secureTextEntry={!showPassword}
                    />

                    <Pressable
                      onPress={() => setShowPassword((value) => !value)}
                      style={styles.eyeButton}
                    >
                      <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
                    </Pressable>
                  </LinearGradient>
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.loginButtonWrap,
                    pressed && !isLoading && styles.pressed,
                    isLoading && styles.disabled,
                  ]}
                >
                  <LinearGradient
                    colors={['#fff3a3', '#f59e0b', '#7c2d12']}
                    style={styles.loginButtonBorder}
                  >
                    <LinearGradient
                      colors={['#4ade80', '#16a34a', '#166534']}
                      style={styles.loginButton}
                    >
                      {isLoading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={[styles.loginText, { fontFamily: orbitron }]}>
                            CONNEXION...
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.loginText, { fontFamily: orbitron }]}>
                          SE CONNECTER
                        </Text>
                      )}
                    </LinearGradient>
                  </LinearGradient>
                </Pressable>

                <View style={styles.dividerSmall}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerGemSmall} />
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Pas de compte ?</Text>

                  <Link href="/register" asChild>
                    <Pressable style={({ pressed }) => pressed && styles.pressed}>
                      <Text style={[styles.registerText, { fontFamily: orbitron }]}>
                        CRÉER UN COMPTE
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#06100a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 34,
  },

  logoArea: {
    alignItems: 'center',
    marginBottom: -8,
    zIndex: 10,
  },

  logo: {
    color: '#facc15',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: '#3f2307',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 2,
  },
  ribbon: {
    marginTop: -4,
    backgroundColor: '#d6a75d',
    borderRadius: 999,
    paddingHorizontal: 34,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: '#7c2d12',
  },
  ribbonText: {
    color: '#3f2307',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },

  goldBorder: {
    borderRadius: 26,
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  woodPanel: {
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3f2307',
  },
  woodLine: {
    height: 2,
    backgroundColor: 'rgba(63,35,7,0.38)',
    marginTop: 54,
  },
  panelContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 28,
    marginTop: -270,
  },

  nail: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 999,
    padding: 3,
    backgroundColor: '#2f1703',
    zIndex: 5,
  },
  nailInner: {
    flex: 1,
    borderRadius: 999,
  },
  nailTL: {
    top: 16,
    left: 16,
  },
  nailTR: {
    top: 16,
    right: 16,
  },
  nailBL: {
    bottom: 16,
    left: 16,
  },
  nailBR: {
    bottom: 16,
    right: 16,
  },

  title: {
    color: '#fff7ed',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#3f2307',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#facc15',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dividerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#3f2307',
  },
  dividerGem: {
    width: 15,
    height: 15,
    backgroundColor: '#d97706',
    borderWidth: 2,
    borderColor: '#facc15',
    transform: [{ rotate: '45deg' }],
  },
  dividerGemSmall: {
    width: 11,
    height: 11,
    backgroundColor: '#d97706',
    borderWidth: 2,
    borderColor: '#facc15',
    transform: [{ rotate: '45deg' }],
  },

  errorBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  formGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 7,
    letterSpacing: 0.7,
    textShadowColor: '#3f2307',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  inputFrame: {
    height: 58,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputIconBox: {
    width: 54,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#7c2d12',
  },
  inputIcon: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 14,
  },
  eyeButton: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 19,
  },

  loginButtonWrap: {
    marginTop: 10,
    alignSelf: 'center',
    width: '92%',
  },
  loginButtonBorder: {
    borderRadius: 16,
    padding: 4,
  },
  loginButton: {
    minHeight: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  loginText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '800',
  },
  registerText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '900',
  },

  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.7,
  },
});