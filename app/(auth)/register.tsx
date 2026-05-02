// import { useEffect, useRef, useState } from 'react';
// import {
//   Animated,
//   ActivityIndicator,
//   Easing,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from 'react-native';
// // vidéo supprimée — Lottie sera intégré si tu choisis une animation
// import { Link, useRouter } from 'expo-router';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useFonts } from 'expo-font';
// import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
// import { ThemedText } from '@/components/themed-text';
// import { useAuth } from '@/providers/auth-provider';

// function Nail({ style }: { style: object }) {
//   return (
//     <View style={[styles.nailOuter, style]}>
//       <LinearGradient
//         colors={['#e8d070', '#c8a030', '#7a5010']}
//         start={{ x: 0.3, y: 0.2 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.nailInner}
//       />
//     </View>
//   );
// }

// function LoginAura() {
//   const spin = useRef(new Animated.Value(0)).current;
//   const pulse = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const spinLoop = Animated.loop(
//       Animated.timing(spin, {
//         toValue: 1,
//         duration: 2800,
//         easing: Easing.linear,
//         useNativeDriver: true,
//       })
//     );

//     const pulseLoop = Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, {
//           toValue: 1,
//           duration: 900,
//           easing: Easing.out(Easing.quad),
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulse, {
//           toValue: 0,
//           duration: 900,
//           easing: Easing.in(Easing.quad),
//           useNativeDriver: true,
//         }),
//       ])
//     );

//     spinLoop.start();
//     pulseLoop.start();

//     return () => {
//       spinLoop.stop();
//       pulseLoop.stop();
//     };
//   }, [pulse, spin]);

//   const rotate = spin.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   const scale = pulse.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.92, 1.08],
//   });

//   const opacity = pulse.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.45, 0.85],
//   });

//   return (
//     <View style={styles.auraWrap} pointerEvents="none">
//       <Animated.View style={[styles.auraOrbit, { transform: [{ rotate }] }]}>
//         <View style={styles.auraRing} />
//         <View style={[styles.auraSpark, styles.auraSparkTop]} />
//         <View style={[styles.auraSpark, styles.auraSparkRight]} />
//         <View style={[styles.auraSpark, styles.auraSparkBottom]} />
//         <View style={[styles.auraSpark, styles.auraSparkLeft]} />
//       </Animated.View>

//       <Animated.View
//         style={[
//           styles.auraCore,
//           {
//             opacity,
//             transform: [{ scale }],
//           },
//         ]}
//       />
//     </View>
//   );
// }

// export default function RegisterScreen() {
//   const router = useRouter();
//   const { signUp } = useAuth();
//   const [fontsLoaded] = useFonts({ Orbitron_700Bold });
//   const [username, setUsername] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleRegister = async () => {
//     try {
//       setError(null);
//       setIsLoading(true);
//       await signUp(email, username, password);
//       router.replace('/login');
//     } catch (err) {
//       const message = err instanceof Error ? err.message : 'Registration failed';
//       setError(message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const orbitron = fontsLoaded ? 'Orbitron_700Bold' : undefined;

//   return (
//     <View style={styles.screen}>
//       <View style={[styles.glowOrb, styles.glowOrbLeft]} />
//       <View style={[styles.glowOrb, styles.glowOrbRight]} />

//       <KeyboardAvoidingView
//         style={styles.keyboardContainer}
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           keyboardShouldPersistTaps="handled"
//         >
//           <View style={styles.shadowShell}>

//             <LoginAura />

//             <LinearGradient
//               colors={['#e8b86a', '#c4843a', '#8a5218']}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={styles.bevelOuter}
//             >
//               <LinearGradient
//                 colors={['#3a1a02', '#5a3008', '#3a1a02']}
//                 start={{ x: 0, y: 0 }}
//                 end={{ x: 1, y: 1 }}
//                 style={styles.bevelInner}
//               >
//                 <LinearGradient
//                   colors={['#d4924a', '#a06820', '#c07030', '#8a5218', '#b87030', '#9a6220']}
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 0, y: 1 }}
//                   style={styles.woodSurface}
//                 >
//                   <LinearGradient
//                     colors={['rgba(255,220,140,0.18)', 'transparent']}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 0, y: 1 }}
//                     style={styles.topSheen}
//                     pointerEvents="none"
//                   />

//                   <Nail style={styles.nailTL} />
//                   <Nail style={styles.nailTR} />
//                   <Nail style={styles.nailBL} />
//                   <Nail style={styles.nailBR} />

//                   <View style={styles.cardContent}>

//                     <Text style={[styles.badge, { fontFamily: orbitron }]}>Lootopia Explorer</Text>

//                     <Text style={[styles.title, { fontFamily: orbitron }]}>Inscription</Text>

//                     <ThemedText style={styles.subtitle}>Créer ton profil et débloquer tes premières missions.</ThemedText>

//                     <View style={styles.dividerWrap}>
//                       <LinearGradient
//                         colors={['transparent', '#3a1a02', 'transparent']}
//                         start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                         style={styles.dividerLine}
//                       />
//                       <LinearGradient
//                         colors={['transparent', 'rgba(255,200,100,0.28)', 'transparent']}
//                         start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//                         style={[styles.dividerLine, { marginTop: 1 }]}
//                       />
//                     </View>

//                     {error ? (
//                       <View style={styles.errorBox}>
//                         <Text style={styles.errorText}>{error}</Text>
//                       </View>
//                     ) : null}

//                     <View style={styles.formGroup}>
//                       <Text style={[styles.label, { fontFamily: orbitron }]}>Nom d'utilisateur</Text>
//                       <LinearGradient
//                         colors={['#1a0c04', '#2a1808', '#1a0c04']}
//                         start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
//                         style={styles.inputGradient}
//                       >
//                         <TextInput
//                           style={[styles.input, { fontFamily: orbitron }]}
//                           placeholder="Nom d'utilisateur"
//                           placeholderTextColor="rgba(200,160,80,0.35)"
//                           value={username}
//                           onChangeText={setUsername}
//                           editable={!isLoading}
//                           autoCapitalize="none"
//                         />
//                       </LinearGradient>
//                     </View>

//                     <View style={styles.formGroup}>
//                       <Text style={[styles.label, { fontFamily: orbitron }]}>Email</Text>
//                       <LinearGradient
//                         colors={['#1a0c04', '#2a1808', '#1a0c04']}
//                         start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
//                         style={styles.inputGradient}
//                       >
//                         <TextInput
//                           style={[styles.input, { fontFamily: orbitron }]}
//                           placeholder="ton@email.com"
//                           placeholderTextColor="rgba(200,160,80,0.35)"
//                           value={email}
//                           onChangeText={setEmail}
//                           editable={!isLoading}
//                           keyboardType="email-address"
//                           autoCapitalize="none"
//                         />
//                       </LinearGradient>
//                     </View>

//                     <View style={styles.formGroup}>
//                       <Text style={[styles.label, { fontFamily: orbitron }]}>Mot de passe</Text>
//                       <LinearGradient
//                         colors={['#1a0c04', '#2a1808', '#1a0c04']}
//                         start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
//                         style={styles.inputGradient}
//                       >
//                         <View style={styles.inputRow}>
//                           <TextInput
//                             style={[styles.input, { fontFamily: orbitron, flex: 1 }]}
//                             placeholder="Mot de passe"
//                             placeholderTextColor="rgba(200,160,80,0.35)"
//                             value={password}
//                             onChangeText={setPassword}
//                             editable={!isLoading}
//                             secureTextEntry={!showPassword}
//                           />
//                           <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
//                             <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
//                           </Pressable>
//                         </View>
//                       </LinearGradient>
//                     </View>

//                     <Pressable
//                       style={({ pressed }) => [
//                         styles.submitButton,
//                         isLoading && styles.submitButtonDisabled,
//                         pressed && !isLoading && styles.buttonLift,
//                       ]}
//                       onPress={handleRegister}
//                       disabled={isLoading}
//                     >
//                       <View style={styles.btnShadowWrap}>
//                         <LinearGradient
//                           colors={['#10b981', '#047857']}
//                           start={{ x: 0, y: 0 }}
//                           end={{ x: 1, y: 1 }}
//                           style={styles.ctaPrimary}
//                         >
//                           <LinearGradient
//                             colors={['rgba(255,255,255,0.14)', 'transparent']}
//                             start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
//                             style={StyleSheet.absoluteFillObject}
//                             pointerEvents="none"
//                           />
//                           {isLoading ? (
//                             <View style={styles.loadingRow}>
//                               <ActivityIndicator color="#ffffff" size="small" />
//                               <Text style={[styles.ctaText, { fontFamily: orbitron }]}>Inscription...</Text>
//                             </View>
//                           ) : (
//                             <Text style={[styles.ctaText, { fontFamily: orbitron }]}>Créer un compte</Text>
//                           )}
//                         </LinearGradient>
//                       </View>
//                     </Pressable>

//                     <View style={styles.footerRow}>
//                       <Text style={styles.footerText}>Déjà inscrit ?</Text>
//                       <Link href="/login" asChild>
//                         <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.buttonLift]}>
//                           <Text style={[styles.linkText, { fontFamily: orbitron }]}>Se connecter</Text>
//                         </Pressable>
//                       </Link>
//                     </View>

//                   </View>

//                 </LinearGradient>
//               </LinearGradient>
//             </LinearGradient>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: '#0b1220', overflow: 'hidden' },
//   glowOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 999 },
//   glowOrbLeft:  { left: -96, top: -12,     backgroundColor: '#10b981', opacity: 0.18 },
//   glowOrbRight: { right: -84, bottom: -36, backgroundColor: '#06b6d4', opacity: 0.10 },
//   keyboardContainer: { flex: 1 },
//   scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },

//   shadowShell: {
//     width: '100%', maxWidth: 420, alignSelf: 'center',
//     borderRadius: 18,
//     shadowColor: '#0a0500', shadowOpacity: 0.75, shadowRadius: 16,
//     shadowOffset: { width: 5, height: 8 }, elevation: 16,
//   },
//   bevelOuter: { borderRadius: 18, padding: 3 },
//   bevelInner: { borderRadius: 16, padding: 2 },
//   woodSurface: { borderRadius: 14, overflow: 'hidden' },
//   topSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },

//   nailOuter: {
//     position: 'absolute', width: 14, height: 14, borderRadius: 7,
//     borderWidth: 1, borderColor: '#3a2008', overflow: 'hidden', zIndex: 10,
//     shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 2,
//     shadowOffset: { width: 1, height: 1 }, elevation: 3,
//   },
//   nailInner: { flex: 1 },
//   nailTL: { top: 10, left: 12 },
//   nailTR: { top: 10, right: 12 },
//   nailBL: { bottom: 10, left: 12 },
//   nailBR: { bottom: 10, right: 12 },

//   cardContent: { padding: 24, paddingTop: 26 },

//   dividerWrap: { marginBottom: 18 },
//   dividerLine: { height: 1, width: '100%' },

//   badge: {
//     marginBottom: 6, color: '#ffe066', fontSize: 10, fontWeight: '700',
//     textTransform: 'uppercase', letterSpacing: 1.5,
//     textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
//   },
//   title: {
//     color: '#fff8dc', marginBottom: 5, fontSize: 28, fontWeight: '700',
//     textShadowColor: 'rgba(50,20,0,0.8)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 4,
//   },
//   subtitle: { color: 'rgba(255,240,180,0.82)', marginBottom: 14, fontSize: 11, lineHeight: 17, fontStyle: 'italic' },

//   errorBox: {
//     marginBottom: 14, borderRadius: 10, borderWidth: 1,
//     borderColor: '#fecaca', backgroundColor: '#fff1f2',
//     paddingHorizontal: 14, paddingVertical: 10,
//   },
//   errorText: { color: '#be123c', fontSize: 12 },

//   formGroup: { marginBottom: 14 },
//   label: {
//     marginBottom: 6, color: '#ffe088', fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
//     textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1,
//   },
//   inputGradient: {
//     borderRadius: 10, borderWidth: 1.5, borderColor: '#3a1a06',
//     shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 3,
//     shadowOffset: { width: 0, height: 2 }, elevation: 2,
//   },
//   input: { paddingHorizontal: 14, paddingVertical: 11, color: '#f0d898', fontSize: 13, letterSpacing: 0.4 },

//   submitButton: { marginTop: 4, borderRadius: 12 },
//   submitButtonDisabled: { opacity: 0.72 },
//   buttonLift: { transform: [{ scale: 0.97 }] },
//   btnShadowWrap: {
//     borderRadius: 12, backgroundColor: '#036040',
//     shadowColor: '#10b981', shadowOpacity: 0.35, shadowRadius: 10,
//     shadowOffset: { width: 0, height: 0 }, elevation: 8,
//     transform: [{ translateY: -2 }],
//   },
//   ctaPrimary: {
//     flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
//     paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12,
//     borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden',
//   },
//   ctaText: {
//     color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center',
//     textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
//   },
//   loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   footerRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
//   footerText: { color: 'rgba(255,240,180,0.72)', fontSize: 11 },
//   linkButton: { paddingVertical: 2, paddingHorizontal: 2 },
//   linkText: { color: '#34d399', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
//   auraWrap: {
//     position: 'absolute',
//     right: -10,
//     bottom: -8,
//     width: 132,
//     height: 132,
//     zIndex: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'transparent',
//   },
//   auraOrbit: {
//     width: 116,
//     height: 116,
//     borderRadius: 58,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   auraRing: {
//     position: 'absolute',
//     width: 96,
//     height: 96,
//     borderRadius: 48,
//     borderWidth: 1.5,
//     borderColor: 'rgba(52, 211, 153, 0.55)',
//     backgroundColor: 'rgba(16, 185, 129, 0.08)',
//     shadowColor: '#10b981',
//     shadowOpacity: 0.4,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 0 },
//   },
//   auraSpark: {
//     position: 'absolute',
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#86efac',
//     shadowColor: '#86efac',
//     shadowOpacity: 0.95,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 0 },
//   },
//   auraSparkTop: { top: 4, left: '50%', marginLeft: -6 },
//   auraSparkRight: { right: 8, top: '50%', marginTop: -6 },
//   auraSparkBottom: { bottom: 4, left: '50%', marginLeft: -6 },
//   auraSparkLeft: { left: 8, top: '50%', marginTop: -6 },
//   auraCore: {
//     position: 'absolute',
//     width: 26,
//     height: 26,
//     borderRadius: 13,
//     backgroundColor: '#f8fafc',
//     shadowColor: '#ffffff',
//     shadowOpacity: 0.75,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 0 },
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   eyeButton: {
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     marginLeft: 8,
//     alignSelf: 'center',
//   },
//   eyeText: {
//     fontSize: 16,
//   },
// });


import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Easing,
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
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/providers/auth-provider';

function Nail({ style }: { style: object }) {
  return (
    <View style={[styles.nailOuter, style]}>
      <LinearGradient
        colors={['#e8d070', '#c8a030', '#7a5010']}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.nailInner}
      />
    </View>
  );
}

function LoginAura() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });

  return (
    <View style={styles.auraWrap} pointerEvents="none">
      <Animated.View style={[styles.auraOrbit, { transform: [{ rotate }] }]}>
        <View style={styles.auraRing} />
        <View style={[styles.auraSpark, styles.auraSparkTop]} />
        <View style={[styles.auraSpark, styles.auraSparkRight]} />
        <View style={[styles.auraSpark, styles.auraSparkBottom]} />
        <View style={[styles.auraSpark, styles.auraSparkLeft]} />
      </Animated.View>
      <Animated.View style={[styles.auraCore, { opacity, transform: [{ scale }] }]} />
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fontsLoaded] = useFonts({ Orbitron_700Bold });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signUp(email, username, password);
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const orbitron = fontsLoaded ? 'Orbitron_700Bold' : undefined;

  return (
    <ImageBackground
      source={require('../../assets/images/illustration-style-dessin-anime-paysage-vert-riviere-montagnes_1213951-52970.jpg')}
      style={styles.screen}
      resizeMode="stretch"
      imageStyle={{ transform: [{ scale: 1.0 }] }}
    >
      {/* ← overlay léger */}
      <View style={styles.screenOverlay} />

      <View style={[styles.glowOrb, styles.glowOrbLeft]} />
      <View style={[styles.glowOrb, styles.glowOrbRight]} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.shadowShell}>
            <LoginAura />
            <LinearGradient
              colors={['#e8b86a', '#c4843a', '#8a5218']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bevelOuter}
            >
              <LinearGradient
                colors={['#3a1a02', '#5a3008', '#3a1a02']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bevelInner}
              >
                <LinearGradient
                  colors={['#d4924a', '#a06820', '#c07030', '#8a5218', '#b87030', '#9a6220']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.woodSurface}
                >
                  <LinearGradient
                    colors={['rgba(255,220,140,0.18)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.topSheen}
                    pointerEvents="none"
                  />

                  <Nail style={styles.nailTL} />
                  <Nail style={styles.nailTR} />
                  <Nail style={styles.nailBL} />
                  <Nail style={styles.nailBR} />

                  <View style={styles.cardContent}>
                    <Text style={[styles.badge, { fontFamily: orbitron }]}>Lootopia Explorer</Text>
                    <Text style={[styles.title, { fontFamily: orbitron }]}>Inscription</Text>
                    <ThemedText style={styles.subtitle}>Créer ton profil et débloquer tes premières missions.</ThemedText>

                    <View style={styles.dividerWrap}>
                      <LinearGradient
                        colors={['transparent', '#3a1a02', 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.dividerLine}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(255,200,100,0.28)', 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.dividerLine, { marginTop: 1 }]}
                      />
                    </View>

                    {error ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { fontFamily: orbitron }]}>Nom d'utilisateur</Text>
                      <LinearGradient
                        colors={['#1a0c04', '#2a1808', '#1a0c04']}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={styles.inputGradient}
                      >
                        <TextInput
                          style={[styles.input, { fontFamily: orbitron }]}
                          placeholder="Nom d'utilisateur"
                          placeholderTextColor="rgba(200,160,80,0.35)"
                          value={username}
                          onChangeText={setUsername}
                          editable={!isLoading}
                          autoCapitalize="none"
                        />
                      </LinearGradient>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { fontFamily: orbitron }]}>Email</Text>
                      <LinearGradient
                        colors={['#1a0c04', '#2a1808', '#1a0c04']}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={styles.inputGradient}
                      >
                        <TextInput
                          style={[styles.input, { fontFamily: orbitron }]}
                          placeholder="ton@email.com"
                          placeholderTextColor="rgba(200,160,80,0.35)"
                          value={email}
                          onChangeText={setEmail}
                          editable={!isLoading}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </LinearGradient>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={[styles.label, { fontFamily: orbitron }]}>Mot de passe</Text>
                      <LinearGradient
                        colors={['#1a0c04', '#2a1808', '#1a0c04']}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={styles.inputGradient}
                      >
                        <View style={styles.inputRow}>
                          <TextInput
                            style={[styles.input, { fontFamily: orbitron, flex: 1 }]}
                            placeholder="Mot de passe"
                            placeholderTextColor="rgba(200,160,80,0.35)"
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                            secureTextEntry={!showPassword}
                          />
                          <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                            <Text style={styles.eyeText}>{showPassword ? '👁️' : '🙈'}</Text>
                          </Pressable>
                        </View>
                      </LinearGradient>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.submitButton,
                        isLoading && styles.submitButtonDisabled,
                        pressed && !isLoading && styles.buttonLift,
                      ]}
                      onPress={handleRegister}
                      disabled={isLoading}
                    >
                      <View style={styles.btnShadowWrap}>
                        <LinearGradient
                          colors={['#10b981', '#047857']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.ctaPrimary}
                        >
                          <LinearGradient
                            colors={['rgba(255,255,255,0.14)', 'transparent']}
                            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                            pointerEvents="none"
                          />
                          {isLoading ? (
                            <View style={styles.loadingRow}>
                              <ActivityIndicator color="#ffffff" size="small" />
                              <Text style={[styles.ctaText, { fontFamily: orbitron }]}>Inscription...</Text>
                            </View>
                          ) : (
                            <Text style={[styles.ctaText, { fontFamily: orbitron }]}>Créer un compte</Text>
                          )}
                        </LinearGradient>
                      </View>
                    </Pressable>

                    <View style={styles.footerRow}>
                      <Text style={styles.footerText}>Déjà inscrit ?</Text>
                      <Link href="/login" asChild>
                        <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.buttonLift]}>
                          <Text style={[styles.linkText, { fontFamily: orbitron }]}>Se connecter</Text>
                        </Pressable>
                      </Link>
                    </View>
                  </View>
                </LinearGradient>
              </LinearGradient>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden' },
  screenOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.10)',
  },
  glowOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 999, zIndex: 2 },
  glowOrbLeft:  { left: -96, top: -12,     backgroundColor: '#10b981', opacity: 0.18 },
  glowOrbRight: { right: -84, bottom: -36, backgroundColor: '#06b6d4', opacity: 0.10 },
  keyboardContainer: { flex: 1, zIndex: 3 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },

  shadowShell: {
    width: '100%', maxWidth: 420, alignSelf: 'center',
    borderRadius: 18,
    shadowColor: '#0a0500', shadowOpacity: 0.75, shadowRadius: 16,
    shadowOffset: { width: 5, height: 8 }, elevation: 16,
  },
  bevelOuter: { borderRadius: 18, padding: 3 },
  bevelInner: { borderRadius: 16, padding: 2 },
  woodSurface: { borderRadius: 14, overflow: 'hidden' },
  topSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },

  nailOuter: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    borderWidth: 1, borderColor: '#3a2008', overflow: 'hidden', zIndex: 10,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 2,
    shadowOffset: { width: 1, height: 1 }, elevation: 3,
  },
  nailInner: { flex: 1 },
  nailTL: { top: 10, left: 12 },
  nailTR: { top: 10, right: 12 },
  nailBL: { bottom: 10, left: 12 },
  nailBR: { bottom: 10, right: 12 },

  cardContent: { padding: 24, paddingTop: 26 },
  dividerWrap: { marginBottom: 18 },
  dividerLine: { height: 1, width: '100%' },

  badge: {
    marginBottom: 6, color: '#ffe066', fontSize: 10, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  title: {
    color: '#fff8dc', marginBottom: 5, fontSize: 28, fontWeight: '700',
    textShadowColor: 'rgba(50,20,0,0.8)', textShadowOffset: { width: 1, height: 2 }, textShadowRadius: 4,
  },
  subtitle: { color: 'rgba(255,240,180,0.82)', marginBottom: 14, fontSize: 11, lineHeight: 17, fontStyle: 'italic' },

  errorBox: {
    marginBottom: 14, borderRadius: 10, borderWidth: 1,
    borderColor: '#fecaca', backgroundColor: '#fff1f2',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorText: { color: '#be123c', fontSize: 12 },

  formGroup: { marginBottom: 14 },
  label: {
    marginBottom: 6, color: '#ffe088', fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1,
  },
  inputGradient: {
    borderRadius: 10, borderWidth: 1.5, borderColor: '#3a1a06',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  input: { paddingHorizontal: 14, paddingVertical: 11, color: '#f0d898', fontSize: 13, letterSpacing: 0.4 },

  submitButton: { marginTop: 4, borderRadius: 12 },
  submitButtonDisabled: { opacity: 0.72 },
  buttonLift: { transform: [{ scale: 0.97 }] },
  btnShadowWrap: {
    borderRadius: 12, backgroundColor: '#036040',
    shadowColor: '#10b981', shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }, elevation: 8,
    transform: [{ translateY: -2 }],
  },
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden',
  },
  ctaText: {
    color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerRow: { marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  footerText: { color: 'rgba(255,240,180,0.72)', fontSize: 11 },
  linkButton: { paddingVertical: 2, paddingHorizontal: 2 },
  linkText: { color: '#34d399', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  auraWrap: {
    position: 'absolute', right: -10, bottom: -8, width: 132, height: 132,
    zIndex: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  auraOrbit: { width: 116, height: 116, borderRadius: 58, alignItems: 'center', justifyContent: 'center' },
  auraRing: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5, borderColor: 'rgba(52, 211, 153, 0.55)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  auraSpark: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#86efac', shadowColor: '#86efac', shadowOpacity: 0.95,
    shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  auraSparkTop: { top: 4, left: '50%', marginLeft: -6 },
  auraSparkRight: { right: 8, top: '50%', marginTop: -6 },
  auraSparkBottom: { bottom: 4, left: '50%', marginLeft: -6 },
  auraSparkLeft: { left: 8, top: '50%', marginTop: -6 },
  auraCore: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#f8fafc', shadowColor: '#ffffff',
    shadowOpacity: 0.75, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { paddingHorizontal: 10, paddingVertical: 8, marginLeft: 8, alignSelf: 'center' },
  eyeText: { fontSize: 16 },
});