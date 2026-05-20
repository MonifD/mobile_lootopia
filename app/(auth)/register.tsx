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

import { SUPPORTED_CITIES } from '@/constants/cities';
import { useAuth } from '@/providers/auth-provider';

function Nail({ style }: { style: object }) {
  return (
    <View style={[styles.nail, style]}>
      <LinearGradient colors={['#fef3c7', '#d97706', '#3f2307']} style={styles.nailInner} />
    </View>
  );
}

function WoodLine() {
  return <View style={styles.woodLine} />;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fontsLoaded] = useFonts({ Orbitron_700Bold });

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState<string>(SUPPORTED_CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const orbitron = fontsLoaded ? 'Orbitron_700Bold' : undefined;

  const handleRegister = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signUp(email, username, password, city);
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>

            <Text style={[styles.logo, { fontFamily: orbitron }]}>LOOTOPIA</Text>

            <View style={styles.ribbon}>
              <Text style={[styles.ribbonText, { fontFamily: orbitron }]}>NOUVEL EXPLORATEUR</Text>
            </View>
          </View>

          <LinearGradient colors={['#fff3a3', '#f59e0b', '#6b2f08']} style={styles.goldBorder}>
            <LinearGradient colors={['#7a3f12', '#9a561c', '#5a2b0b']} style={styles.woodPanel}>
              <Nail style={styles.nailTL} />
              <Nail style={styles.nailTR} />
              <Nail style={styles.nailBL} />
              <Nail style={styles.nailBR} />

              <WoodLine />
              <WoodLine />
              <WoodLine />
              <WoodLine />
              <WoodLine />
              <WoodLine />

              <View style={styles.panelContent}>
                <Text style={[styles.title, { fontFamily: orbitron }]}>INSCRIPTION</Text>

                <Text style={styles.subtitle}>
                  Crée ton profil et débloque{'\n'}tes premières missions.
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
                  <Text style={[styles.label, { fontFamily: orbitron }]}>NOM D'UTILISATEUR</Text>

                  <LinearGradient colors={['#120804', '#301706', '#120804']} style={styles.inputFrame}>
                    <View style={styles.inputIconBox}>
                      <Text style={styles.inputIcon}>👤</Text>
                    </View>

                    <TextInput
                      style={[styles.input, { fontFamily: orbitron }]}
                      placeholder="Ton pseudo"
                      placeholderTextColor="rgba(255,220,150,0.38)"
                      value={username}
                      onChangeText={setUsername}
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                  </LinearGradient>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { fontFamily: orbitron }]}>EMAIL</Text>

                  <LinearGradient colors={['#120804', '#301706', '#120804']} style={styles.inputFrame}>
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
                  <Text style={[styles.label, { fontFamily: orbitron }]}>VILLE</Text>

                  <Pressable
                    disabled={isLoading}
                    onPress={() => setCityOpen((previous) => !previous)}
                    style={({ pressed }) => [pressed && !isLoading && styles.pressed]}
                  >
                    <LinearGradient colors={['#120804', '#301706', '#120804']} style={styles.inputFrame}>
                      <View style={styles.inputIconBox}>
                        <Text style={styles.inputIcon}>📍</Text>
                      </View>

                      <Text style={[styles.cityValueText, { fontFamily: orbitron }]}>{city}</Text>

                      <View style={styles.eyeButton}>
                        <Text style={styles.eyeText}>{cityOpen ? '▲' : '▼'}</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>

                  {cityOpen ? (
                    <View style={styles.cityDropdown}>
                      {SUPPORTED_CITIES.map((item) => (
                        <Pressable
                          key={item}
                          onPress={() => {
                            setCity(item);
                            setCityOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.cityOption,
                            item === city && styles.cityOptionActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.cityOptionText, item === city && styles.cityOptionTextActive]}>{item}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { fontFamily: orbitron }]}>MOT DE PASSE</Text>

                  <LinearGradient colors={['#120804', '#301706', '#120804']} style={styles.inputFrame}>
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

                    <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                      <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
                    </Pressable>
                  </LinearGradient>
                </View>

                <Pressable
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    styles.registerButtonWrap,
                    pressed && !isLoading && styles.pressed,
                    isLoading && styles.disabled,
                  ]}
                >
                  <LinearGradient colors={['#fff3a3', '#f59e0b', '#7c2d12']} style={styles.registerButtonBorder}>
                    <LinearGradient colors={['#4ade80', '#16a34a', '#166534']} style={styles.registerButton}>
                      {isLoading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={[styles.registerTextButton, { fontFamily: orbitron }]}>
                            INSCRIPTION...
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.registerTextButton, { fontFamily: orbitron }]}>
                          CRÉER UN COMPTE
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
                  <Text style={styles.footerText}>Déjà inscrit ?</Text>

                  <Link href="/login" asChild>
                    <Pressable style={({ pressed }) => pressed && styles.pressed}>
                      <Text style={[styles.loginText, { fontFamily: orbitron }]}>SE CONNECTER</Text>
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
    fontSize: 54,
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
    paddingHorizontal: 24,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: '#7c2d12',
  },
  ribbonText: {
    color: '#3f2307',
    fontSize: 12,
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
    marginTop: 50,
  },
  panelContent: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 26,
    marginTop: -312,
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
    fontSize: 33,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: '#3f2307',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#facc15',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dividerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },

  formGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#facc15',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
    letterSpacing: 0.7,
    textShadowColor: '#3f2307',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  inputFrame: {
    height: 56,
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
    fontSize: 21,
  },
  input: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 14,
  },
  cityValueText: {
    flex: 1,
    color: '#fde68a',
    fontSize: 14,
    fontWeight: '800',
  },
  cityDropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b5e34',
    backgroundColor: 'rgba(18,8,4,0.92)',
    overflow: 'hidden',
  },
  cityOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,94,52,0.4)',
  },
  cityOptionActive: {
    backgroundColor: 'rgba(217,119,6,0.18)',
  },
  cityOptionText: {
    color: '#fef3c7',
    fontWeight: '700',
    fontSize: 13,
  },
  cityOptionTextActive: {
    color: '#facc15',
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

  registerButtonWrap: {
    marginTop: 8,
    alignSelf: 'center',
    width: '92%',
  },
  registerButtonBorder: {
    borderRadius: 16,
    padding: 4,
  },
  registerButton: {
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  registerTextButton: {
    color: '#fff',
    fontSize: 17,
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
  loginText: {
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