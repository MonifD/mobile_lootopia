// import { useEffect, useRef } from 'react';
// import { Link, useRouter } from 'expo-router';
// import {
//   Animated,
//   Easing,
//   ImageBackground,
//   ScrollView,
//   StyleSheet,
//   View,
//   Pressable,
//   Text,
// } from 'react-native';

// import { LinearGradient } from 'expo-linear-gradient';

// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import ChromaButton from '@/components/codeui/chroma-button';
// import { useAuth } from '@/providers/auth-provider';

// // ─── Ticker data ───────────────────────────────────────────────────────────────
// const TICKER_ITEMS = [
//   'CHASSE AU TRÉSOR',
//   '·',
//   'INDICES EXCLUSIFS',
//   '·',
//   'RÉCOMPENSES RÉELLES',
//   '·',
//   'CO-OP EN ÉQUIPE',
//   '·',
//   'CHASSE AU TRÉSOR',
//   '·',
//   'INDICES EXCLUSIFS',
//   '·',
//   'RÉCOMPENSES RÉELLES',
// ];

// export default function WelcomeScreen() {
//   const router = useRouter();
//   const { session } = useAuth();
//   const isSignedIn = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

//   // ── Animation refs ─────────────────────────────────────────────────────────
//   const heroOpacity = useRef(new Animated.Value(0)).current;
//   const titleY      = useRef(new Animated.Value(24)).current;
//   const subtitleY   = useRef(new Animated.Value(16)).current;
//   const ctaY        = useRef(new Animated.Value(20)).current;
//   const ctaOpacity  = useRef(new Animated.Value(0)).current;
//   const tickerX     = useRef(new Animated.Value(0)).current;
//   const pulse       = useRef(new Animated.Value(0.85)).current;
//   const floatY      = useRef(new Animated.Value(0)).current;
//   const scanLine    = useRef(new Animated.Value(0)).current;

//   const glowOpacity = pulse.interpolate({ inputRange: [0.85, 1], outputRange: [0.5, 1] });
//   const chestScale  = pulse.interpolate({ inputRange: [0.85, 1], outputRange: [0.97, 1.03] });
//   const chestY      = floatY.interpolate({ inputRange: [-10, 0], outputRange: [-10, 0] });
//   const scanY       = scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, 140] });

//   useEffect(() => {
//     // ── Entry sequence ────────────────────────────────────────────────────────
//     Animated.sequence([
//       Animated.timing(heroOpacity, {
//         toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
//       }),
//       Animated.parallel([
//         Animated.timing(titleY, {
//           toValue: 0, duration: 520, easing: Easing.out(Easing.exp), useNativeDriver: true,
//         }),
//         Animated.timing(subtitleY, {
//           toValue: 0, duration: 600, easing: Easing.out(Easing.exp), useNativeDriver: true,
//         }),
//       ]),
//       Animated.parallel([
//         Animated.timing(ctaOpacity, {
//           toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
//         }),
//         Animated.timing(ctaY, {
//           toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
//         }),
//       ]),
//     ]).start();

//     // ── Ticker loop ───────────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.timing(tickerX, {
//         toValue: -480, duration: 10000, easing: Easing.linear, useNativeDriver: true,
//       })
//     ).start();

//     // ── Pulse glow ────────────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, {
//           toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
//         }),
//         Animated.timing(pulse, {
//           toValue: 0.85, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
//         }),
//       ])
//     ).start();

//     // ── Float ─────────────────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(floatY, {
//           toValue: -10, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
//         }),
//         Animated.timing(floatY, {
//           toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
//         }),
//       ])
//     ).start();

//     // ── Scan line ─────────────────────────────────────────────────────────────
//     Animated.loop(
//       Animated.timing(scanLine, {
//         toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true,
//       })
//     ).start();
//   }, []);

//   const glow = useRef(new Animated.Value(0.6)).current;

// useEffect(() => {
//   Animated.loop(
//     Animated.sequence([
//       Animated.timing(glow, { toValue: 1, duration: 800, useNativeDriver: true }),
//       Animated.timing(glow, { toValue: 0.6, duration: 800, useNativeDriver: true }),
//     ])
//   ).start();
// }, []);

//   return (
//     <ImageBackground
//       source={require('@/assets/images/capture-ecran-2026-04-21.png')}
//       style={styles.root}
//       imageStyle={styles.bgImage}
//       resizeMode="cover">

//       {/* Dark overlay gradient */}
//       <LinearGradient
//         colors={['rgba(2,5,16,0.55)', 'rgba(4,10,28,0.72)', 'rgba(6,14,38,0.88)']}
//         style={StyleSheet.absoluteFill}
//       />

//       {/* Ambient orbs */}
//       <View style={[styles.orb, styles.orbTopLeft]} />
//       <View style={[styles.orb, styles.orbBottomRight]} />

//       <ThemedView style={styles.container}>
//         <ScrollView
//           contentContainerStyle={styles.scroll}
//           showsVerticalScrollIndicator={false}>

//           {/* ── HERO SECTION ─────────────────────────────────────────────── */}
//           <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>

//             {/* Status badge */}
//             <Animated.View style={[styles.statusBadge, { opacity: heroOpacity }]}>
//               <View style={styles.statusDot} />
//               <Text style={styles.statusText}>SAISON 1 — EN COURS</Text>
//             </Animated.View>

//             {/* Title */}
//             <Animated.Text
//               style={[styles.title, { transform: [{ translateY: titleY }] }]}>
//               {'TREASURE\nHUNT'}
//             </Animated.Text>

//             {/* Subtitle */}
//             <Animated.Text
//               style={[styles.subtitle, { transform: [{ translateY: subtitleY }] }]}>
//               Pars à l'aventure. Suis les indices.{'\n'}Remporte le butin.
//             </Animated.Text>

//             {/* Stats strip */}
//             <Animated.View
//               style={[styles.statsStrip, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}>
//               <View style={styles.statItem}>
//                 <Text style={styles.statValue}>1 200+</Text>
//                 <Text style={styles.statLabel}>Joueurs actifs</Text>
//               </View>
//               <View style={styles.statDivider} />
//               <View style={styles.statItem}>
//                 <Text style={styles.statValue}>48</Text>
//                 <Text style={styles.statLabel}>Quêtes ouvertes</Text>
//               </View>
//               <View style={styles.statDivider} />
//               <View style={styles.statItem}>
//                 <Text style={styles.statValue}>€5K</Text>
//                 <Text style={styles.statLabel}>Récompenses</Text>
//               </View>
//             </Animated.View>

//             {/* Ticker */}
//             <View style={styles.tickerWrap}>
//               <Animated.View style={[styles.tickerTrack, { transform: [{ translateX: tickerX }] }]}>
//                 {TICKER_ITEMS.map((item, i) => (
//                   <Text key={i} style={item === '·' ? styles.tickerDot : styles.tickerText}>
//                     {item}
//                   </Text>
//                 ))}
//               </Animated.View>
//             </View>
//           </Animated.View>

//           {/* ── CHEST CARD ───────────────────────────────────────────────── */}
//           <Animated.View
//             style={[styles.chestCard, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}>

//             {/* Scan line effect */}
//             <Animated.View
//               style={[styles.scanLine, { transform: [{ translateY: scanY }] }]}
//               pointerEvents="none"
//             />

//             {/* Corner accents */}
//             <View style={[styles.corner, styles.cornerTL]} />
//             <View style={[styles.corner, styles.cornerTR]} />
//             <View style={[styles.corner, styles.cornerBL]} />
//             <View style={[styles.corner, styles.cornerBR]} />

//             {/* Chest */}
//             <Animated.View style={{ transform: [{ translateY: chestY }, { scale: chestScale }] }}>
//               <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
//               <Text style={styles.chestEmoji}>🧰</Text>
//             </Animated.View>

//             <Text style={styles.chestTitle}>LOOT CORE</Text>
//             <Text style={styles.chestSub}>Ouvre chaque coffre en résolvant les énigmes</Text>

//             {/* Loot badges */}
//             <View style={styles.badgesRow}>
//               {[
//                 { icon: '💠', label: 'Rare' },
//                 { icon: '🪙', label: 'Or' },
//                 { icon: '🏆', label: 'Légendaire' },
//               ].map(({ icon, label }) => (
//                 <View key={label} style={styles.badge}>
//                   <Text style={styles.badgeIcon}>{icon}</Text>
//                   <Text style={styles.badgeLabel}>{label}</Text>
//                 </View>
//               ))}
//             </View>
//           </Animated.View>

//           {/* ── CTA SECTION ──────────────────────────────────────────────── */}
//           <Animated.View
//             style={[styles.cta, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}>

//             {isSignedIn ? (
//               <ChromaButton
//                 text="Continuer l'aventure"
//                 emoji="🚀"
//                 variant="primary"
//                 size="lg"
//                 onPress={() => router.replace('/(tabs)')}
//               />
//             ) : (
//               <>
//                 <Text style={styles.ctaTitle}>Rejoins la chasse</Text>
//                 <Text style={styles.ctaTagline}>
//                   Crée ton compte ou connecte-toi pour accéder aux quêtes et récompenses.
//                 </Text>
// <Link href="/register" asChild>
//   <Pressable>
//     <Animated.View
//       style={{
//         opacity: glow,
//         transform: [{ scale: glow.interpolate({ inputRange: [0.6, 1], outputRange: [0.98, 1.02] }) }],
//       }}>
//       <LinearGradient
//         colors={['#00ff88', '#0e4802', '#2ff750']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={{
//           paddingVertical: 14,
//           paddingHorizontal: 20,
//           borderRadius: 10,
//           shadowColor: '#00ff88',
//           shadowOpacity: 0.6,
//           shadowRadius: 12,
//           elevation: 8,
//         }}
//       >
//         <Text
//           style={{
//             color: 'white',
//             fontSize: 20,
//             fontWeight: '900',
//             textAlign: 'center',
//           }}
//         >
//           Créer un compte
//         </Text>
//       </LinearGradient>
//     </Animated.View>
//   </Pressable>
// </Link>
// <Link href="/login" asChild>
//   <Pressable>
//     <LinearGradient
//       colors={['#00ff15', '#167303', '#0c1600']}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//       style={{
//         paddingVertical: 14,
//         paddingHorizontal: 20,
//         borderRadius: 10,
//         shadowColor: '#00ff15',
//         shadowOpacity: 0.6,
//         shadowRadius: 12,
//         elevation: 8,
//       }}
//     >
//       <Text
//         style={{
//           color: 'white',
//           fontSize: 20,
//           fontWeight: '900',
//           textAlign: 'center',
//         }}
//       >
//         Se connecter
//       </Text>
//     </LinearGradient>
//   </Pressable>
// </Link>

//                 <Text style={styles.legal}>
//                   En continuant, tu acceptes nos{' '}
//                   <Text style={styles.legalLink}>Conditions d'utilisation</Text>
//                 </Text>
//               </>
//             )}
//           </Animated.View>

//         </ScrollView>
//       </ThemedView>
//     </ImageBackground>
//   );
// }

// // ─── Styles ────────────────────────────────────────────────────────────────────
// const CYAN   = '#22d3ee';
// const GOLD   = '#fbbf24';
// const DIM    = 'rgba(148,163,184,0.75)';
// const GLASS  = 'rgba(15,23,42,0.60)';
// const BORDER = 'rgba(34,211,238,0.28)';

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.9 },
//   container: { flex: 1, backgroundColor: 'transparent' },

//   orb: { position: 'absolute', borderRadius: 9999 },
//   orbTopLeft: {
//     top: '-5%', left: '-20%',
//     width: 280, height: 280,
//     backgroundColor: 'rgba(14,165,233,0.07)',
//   },
//   orbBottomRight: {
//     bottom: '0%', right: '-25%',
//     width: 320, height: 320,
//     backgroundColor: 'rgba(250,191,36,0.06)',
//   },

//   scroll: {
//     paddingHorizontal: 20,
//     paddingTop: 64,
//     paddingBottom: 48,
//     gap: 20,
//   },

//   // ── Hero ──────────────────────────────────────────────────────────────────
//   hero: { gap: 14 },

//   statusBadge: {
//     flexDirection: 'row',
//     alignSelf: 'flex-start',
//     alignItems: 'center',
//     gap: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 999,
//     borderWidth: 1,
//     borderColor: 'rgba(34,211,238,0.35)',
//     backgroundColor: 'rgba(34,211,238,0.08)',
//   },
//   statusDot: {
//     width: 7, height: 7, borderRadius: 7,
//     backgroundColor: '#4ade80',
//     shadowColor: '#4ade80',
//     shadowOpacity: 0.9,
//     shadowRadius: 4,
//   },
//   statusText: {
//     color: '#67e8f9', fontSize: 10,
//     fontWeight: '800', letterSpacing: 1.4,
//   },

//   title: {
//     color: '#f0f9ff',
//     fontSize: 52,
//     lineHeight: 54,
//     fontWeight: '900',
//     letterSpacing: -1,
//     textShadowColor: 'rgba(34,211,238,0.25)',
//     textShadowOffset: { width: 0, height: 0 },
//     textShadowRadius: 20,
//   },

//   subtitle: {
//     color: DIM,
//     fontSize: 15,
//     lineHeight: 22,
//     fontWeight: '400',
//   },

//   // ── Stats strip ───────────────────────────────────────────────────────────
//   statsStrip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: BORDER,
//     backgroundColor: GLASS,
//     paddingVertical: 14,
//     paddingHorizontal: 6,
//     marginTop: 4,
//   },
//   statItem: { flex: 1, alignItems: 'center', gap: 2 },
//   statValue: { color: CYAN, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
//   statLabel: { color: DIM, fontSize: 10, fontWeight: '500', letterSpacing: 0.4 },
//   statDivider: { width: 1, height: 32, backgroundColor: BORDER },

//   // ── Ticker ────────────────────────────────────────────────────────────────
//   tickerWrap: {
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: BORDER,
//     backgroundColor: 'rgba(2,132,199,0.1)',
//     overflow: 'hidden',
//     paddingVertical: 8,
//     marginTop: 2,
//   },
//   tickerTrack: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     width: 960,
//     paddingHorizontal: 12,
//     gap: 12,
//   },
//   tickerText: { color: '#67e8f9', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
//   tickerDot:  { color: CYAN, fontSize: 10, fontWeight: '900' },

//   // ── Chest card ────────────────────────────────────────────────────────────
//   chestCard: {
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: BORDER,
//     backgroundColor: GLASS,
//     paddingVertical: 28,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//     gap: 8,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   scanLine: {
//     position: 'absolute',
//     left: 0, right: 0,
//     height: 2,
//     backgroundColor: 'rgba(34,211,238,0.18)',
//   },
//   // Corner bracket accents
//   corner: { position: 'absolute', width: 16, height: 16 },
//   cornerTL: {
//     top: 10, left: 10,
//     borderTopWidth: 2, borderLeftWidth: 2, borderColor: CYAN,
//     borderTopLeftRadius: 4,
//   },
//   cornerTR: {
//     top: 10, right: 10,
//     borderTopWidth: 2, borderRightWidth: 2, borderColor: CYAN,
//     borderTopRightRadius: 4,
//   },
//   cornerBL: {
//     bottom: 10, left: 10,
//     borderBottomWidth: 2, borderLeftWidth: 2, borderColor: CYAN,
//     borderBottomLeftRadius: 4,
//   },
//   cornerBR: {
//     bottom: 10, right: 10,
//     borderBottomWidth: 2, borderRightWidth: 2, borderColor: CYAN,
//     borderBottomRightRadius: 4,
//   },
//   glowRing: {
//     position: 'absolute',
//     width: 100, height: 100,
//     borderRadius: 50,
//     backgroundColor: 'rgba(34,211,238,0.12)',
//     alignSelf: 'center',
//     top: -4,
//   },
//   chestEmoji: { fontSize: 64, zIndex: 1 },
//   chestTitle: {
//     color: GOLD, fontSize: 13, fontWeight: '900',
//     letterSpacing: 2.5, marginTop: 4,
//   },
//   chestSub: {
//     color: DIM, fontSize: 12, lineHeight: 17,
//     textAlign: 'center', maxWidth: 220,
//   },
//   badgesRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
//   badge: {
//     alignItems: 'center', gap: 4,
//     paddingVertical: 10, paddingHorizontal: 16,
//     borderRadius: 12, borderWidth: 1,
//     borderColor: BORDER,
//     backgroundColor: 'rgba(15,23,42,0.5)',
//   },
//   badgeIcon:  { fontSize: 22 },
//   badgeLabel: { color: DIM, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 },

//   // ── CTA ───────────────────────────────────────────────────────────────────
//   cta: {
//     gap: 12,
//     borderTopWidth: 1,
//     borderTopColor: BORDER,
//     paddingTop: 20,
//   },
//   ctaTitle: {
//     color: '#f0f9ff', fontSize: 22,
//     fontWeight: '900', letterSpacing: 0.4,
//     textAlign: 'center',
//   },
//   ctaTagline: {
//     color: DIM, fontSize: 13, lineHeight: 19,
//     textAlign: 'center',
//     marginBottom: 4,
//   },
//   legal: {
//     color: 'rgba(148,163,184,0.5)', fontSize: 11,
//     textAlign: 'center', marginTop: 4,
//   },
//   legalLink: { color: CYAN, textDecorationLine: 'underline' },
// });


// // theme vert
// // import { useEffect, useRef } from 'react';
// // import { Link, useRouter } from 'expo-router';
// // import {
// //   Animated,
// //   Easing,
// //   ImageBackground,
// //   ScrollView,
// //   StyleSheet,
// //   View,
// //   Text,
// //   Pressable,
// // } from 'react-native';
// // import { LinearGradient } from 'expo-linear-gradient';

// // import { ThemedView } from '@/components/themed-view';
// // import { useAuth } from '@/providers/auth-provider';

// // // ─── Palette ─────────────────────────────────────────────────────────────────
// // const G      = '#4afa8c';                   // vert néon principal
// // const G_MID  = 'rgba(74,250,140,0.45)';    // vert semi-transparent
// // const G_DIM  = 'rgba(74,250,140,0.15)';    // vert très discret
// // const DARK   = '#030c05';                  // noir profond teinté vert
// // const OFF    = '#8fa898';                  // gris-vert secondaire
// // const WHITE  = '#e8f5ec';                  // blanc chaud

// // // ─── FutureButton ─────────────────────────────────────────────────────────────
// // function FutureButton({
// //   label,
// //   onPress,
// //   filled = false,
// // }: {
// //   label: string;
// //   onPress?: () => void;
// //   filled?: boolean;
// // }) {
// //   const scale = useRef(new Animated.Value(1)).current;

// //   const handlePress = () => {
// //     Animated.sequence([
// //       Animated.timing(scale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
// //       Animated.timing(scale, { toValue: 1,    duration: 70, useNativeDriver: true }),
// //     ]).start(() => onPress?.());
// //   };

// //   return (
// //     <Pressable onPress={handlePress}>
// //       <Animated.View style={[
// //         styles.btn,
// //         filled ? styles.btnFilled : styles.btnOutline,
// //         { transform: [{ scale }] },
// //       ]}>
// //         <Text style={[styles.btnLabel, filled ? styles.btnLabelFilled : styles.btnLabelOutline]}>
// //           {label}
// //         </Text>
// //         <Text style={[styles.btnArrow, filled ? styles.btnLabelFilled : styles.btnLabelOutline]}>
// //           ↗
// //         </Text>
// //       </Animated.View>
// //     </Pressable>
// //   );
// // }

// // // ─── Screen ───────────────────────────────────────────────────────────────────
// // export default function WelcomeScreen() {
// //   const router = useRouter();
// //   const { session } = useAuth();
// //   const isSignedIn = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

// //   const fadeIn   = useRef(new Animated.Value(0)).current;
// //   const titleY   = useRef(new Animated.Value(32)).current;
// //   const lineW    = useRef(new Animated.Value(0)).current;
// //   const ctaFade  = useRef(new Animated.Value(0)).current;
// //   const tickerX  = useRef(new Animated.Value(0)).current;
// //   const scanAnim = useRef(new Animated.Value(0)).current;
// //   const dotBlink = useRef(new Animated.Value(0.3)).current;

// //   const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 160] });

// //   useEffect(() => {
// //     // Entry sequence
// //     Animated.sequence([
// //       Animated.timing(fadeIn, {
// //         toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
// //       }),
// //       Animated.parallel([
// //         Animated.timing(titleY, {
// //           toValue: 0, duration: 700, easing: Easing.out(Easing.exp), useNativeDriver: true,
// //         }),
// //         Animated.timing(lineW, {
// //           toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false,
// //         }),
// //       ]),
// //       Animated.timing(ctaFade, {
// //         toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true,
// //       }),
// //     ]).start();

// //     // Ticker
// //     Animated.loop(
// //       Animated.timing(tickerX, {
// //         toValue: -560, duration: 12000, easing: Easing.linear, useNativeDriver: true,
// //       })
// //     ).start();

// //     // Scan line
// //     Animated.loop(
// //       Animated.timing(scanAnim, {
// //         toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
// //       })
// //     ).start();

// //     // Live dot pulse
// //     Animated.loop(
// //       Animated.sequence([
// //         Animated.timing(dotBlink, {
// //           toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
// //         }),
// //         Animated.timing(dotBlink, {
// //           toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true,
// //         }),
// //       ])
// //     ).start();
// //   }, []);

// //   const TICKER_WORDS = [
// //     'CHASSE EN ÉQUIPE', '/', 'INDICES RÉELS', '/',
// //     'XP & LOOT', '/', 'CO-OP MODE', '/',
// //     'CHASSE EN ÉQUIPE', '/', 'INDICES RÉELS', '/',
// //     'XP & LOOT', '/',
// //   ];

// //   return (
// //     <ImageBackground
// //       source={require('@/assets/images/capture-ecran-2026-04-21.png')}
// //       style={styles.root}
// //       imageStyle={styles.bgImage}
// //       resizeMode="cover">

// //       <LinearGradient
// //         colors={['rgba(3,12,5,0.80)', 'rgba(3,10,5,0.88)', 'rgba(3,8,5,0.96)']}
// //         style={StyleSheet.absoluteFill}
// //       />

// //       {/* Subtle horizontal grid */}
// //       {[18, 34, 50, 66, 82].map((pct) => (
// //         <View key={pct} style={[styles.gridLine, { top: `${pct}%` as any }]} />
// //       ))}

// //       <ThemedView style={styles.container}>
// //         <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

// //           {/* ─ TOP BAR ───────────────────────────────────────────────────── */}
// //           <Animated.View style={[styles.topBar, { opacity: fadeIn }]}>
// //             <View style={styles.topBarLeft}>
// //               <Animated.View style={[styles.liveDot, { opacity: dotBlink }]} />
// //               <Text style={styles.topBarText}>SAISON 01 — EN COURS</Text>
// //             </View>
// //             <Text style={styles.topBarText}>FR</Text>
// //           </Animated.View>

// //           {/* ─ HERO TEXT ─────────────────────────────────────────────────── */}
// //           <View style={styles.heroBlock}>
// //             <Animated.Text style={[styles.eyebrow, { opacity: fadeIn }]}>
// //               Explore. Trouve. Gagne.
// //             </Animated.Text>

// //             <Animated.Text style={[
// //               styles.headline,
// //               { opacity: fadeIn, transform: [{ translateY: titleY }] },
// //             ]}>
// //               {'Chasse\nau\nTrésor.'}
// //             </Animated.Text>

// //             <Animated.View style={[
// //               styles.accentLine,
// //               { width: lineW.interpolate({ inputRange: [0, 1], outputRange: ['0%', '65%'] }) },
// //             ]} />

// //             <Animated.Text style={[styles.bodyText, { opacity: fadeIn }]}>
// //               Une chasse au trésor en équipe. Des indices cachés dans le monde réel.
// //               Des récompenses qui valent le détour.
// //             </Animated.Text>
// //           </View>

// //           {/* ─ STATS ─────────────────────────────────────────────────────── */}
// //           <Animated.View style={[styles.statsRow, { opacity: ctaFade }]}>
// //             {[
// //               { val: '1 200+', sub: 'Joueurs' },
// //               { val: '48',     sub: 'Quêtes actives' },
// //               { val: '€5K',    sub: 'Butin total' },
// //             ].map(({ val, sub }, i) => (
// //               <View key={sub} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
// //                 <Text style={styles.statVal}>{val}</Text>
// //                 <Text style={styles.statSub}>{sub}</Text>
// //               </View>
// //             ))}
// //           </Animated.View>

// //           {/* ─ TICKER ────────────────────────────────────────────────────── */}
// //           <Animated.View style={[styles.tickerWrap, { opacity: ctaFade }]}>
// //             <Animated.View style={[styles.tickerTrack, { transform: [{ translateX: tickerX }] }]}>
// //               {TICKER_WORDS.map((t, i) => (
// //                 <Text key={i} style={t === '/' ? styles.tickerSep : styles.tickerWord}>
// //                   {t}
// //                 </Text>
// //               ))}
// //             </Animated.View>
// //           </Animated.View>

// //           {/* ─ CHEST PANEL ───────────────────────────────────────────────── */}
// //           <Animated.View style={[styles.chestPanel, { opacity: ctaFade }]}>
// //             {/* Brackets */}
// //             <View style={[styles.brk, styles.brkTL]} />
// //             <View style={[styles.brk, styles.brkTR]} />
// //             <View style={[styles.brk, styles.brkBL]} />
// //             <View style={[styles.brk, styles.brkBR]} />

// //             {/* Scan */}
// //             <Animated.View
// //               pointerEvents="none"
// //               style={[styles.scanLine, { transform: [{ translateY: scanY }] }]}
// //             />

// //             <View style={styles.chestRow}>
// //               <Text style={styles.chestEmoji}>🧰</Text>
// //               <View style={styles.chestInfo}>
// //                 <Text style={styles.chestLabel}>LOOT CORE</Text>
// //                 <Text style={styles.chestDesc}>Résous les énigmes, ouvre les coffres</Text>
// //               </View>
// //               <View style={styles.activeBadge}>
// //                 <Text style={styles.activeBadgeText}>ACTIF</Text>
// //               </View>
// //             </View>

// //             <View style={styles.chestDivider} />

// //             <View style={styles.rewardRow}>
// //               {[
// //                 { icon: '💠', label: 'Rare' },
// //                 { icon: '🪙', label: 'Or' },
// //                 { icon: '🏆', label: 'Légendaire' },
// //               ].map(({ icon, label }) => (
// //                 <View key={label} style={styles.rewardItem}>
// //                   <Text style={styles.rewardEmoji}>{icon}</Text>
// //                   <Text style={styles.rewardLabel}>{label}</Text>
// //                 </View>
// //               ))}
// //             </View>
// //           </Animated.View>

// //           {/* ─ CTA ───────────────────────────────────────────────────────── */}
// //           <Animated.View style={[styles.ctaBlock, { opacity: ctaFade }]}>
// //             <View style={styles.ctaDivider} />

// //             {isSignedIn ? (
// //               <FutureButton
// //                 label="Continuer l'aventure"
// //                 onPress={() => router.replace('/(tabs)')}
// //                 filled
// //               />
// //             ) : (
// //               <>
// //                 <Text style={styles.ctaHeading}>Rejoins la chasse</Text>
// //                 <Text style={styles.ctaBody}>
// //                   Crée ton compte ou connecte-toi pour accéder aux quêtes et récompenses.
// //                 </Text>

// //                 <Link href="/register" asChild>
// //                   <Pressable>
// //                     <FutureButton label="Créer un compte" filled />
// //                   </Pressable>
// //                 </Link>

// //                 <Link href="/login" asChild>
// //                   <Pressable>
// //                     <FutureButton label="Se connecter" />
// //                   </Pressable>
// //                 </Link>

// //                 <Text style={styles.legal}>
// //                   En continuant, tu acceptes nos{' '}
// //                   <Text style={styles.legalLink}>Conditions d'utilisation</Text>
// //                 </Text>
// //               </>
// //             )}
// //           </Animated.View>

// //           <View style={{ height: 32 }} />
// //         </ScrollView>
// //       </ThemedView>
// //     </ImageBackground>
// //   );
// // }

// // // ─── Styles ───────────────────────────────────────────────────────────────────
// // const styles = StyleSheet.create({
// //   root:    { flex: 1 },
// //   bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
// //   container: { flex: 1, backgroundColor: 'transparent' },

// //   gridLine: {
// //     position: 'absolute', left: 0, right: 0,
// //     height: 1,
// //     backgroundColor: 'rgba(74,250,140,0.035)',
// //   },

// //   scroll: {
// //     paddingHorizontal: 24,
// //     paddingTop: 58,
// //     gap: 26,
// //   },

// //   // ── Top bar ───────────────────────────────────────────────────────────────
// //   topBar: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingBottom: 18,
// //     borderBottomWidth: 1,
// //     borderBottomColor: G_DIM,
// //   },
// //   topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
// //   liveDot: {
// //     width: 6, height: 6, borderRadius: 6,
// //     backgroundColor: G,
// //   },
// //   topBarText: {
// //     color: 'rgba(74,250,140,0.5)',
// //     fontSize: 9, fontWeight: '800', letterSpacing: 2,
// //   },

// //   // ── Hero ──────────────────────────────────────────────────────────────────
// //   heroBlock: { gap: 14 },
// //   eyebrow: {
// //     color: G,
// //     fontSize: 10, fontWeight: '800', letterSpacing: 2.8,
// //     textTransform: 'uppercase',
// //   },
// //   headline: {
// //     color: WHITE,
// //     fontSize: 66, lineHeight: 64,
// //     fontWeight: '900', letterSpacing: -2.5,
// //   },
// //   accentLine: {
// //     height: 2, backgroundColor: G,
// //     marginTop: -2,
// //   },
// //   bodyText: {
// //     color: OFF, fontSize: 14, lineHeight: 22,
// //     fontWeight: '400', maxWidth: 310,
// //   },

// //   // ── Stats ─────────────────────────────────────────────────────────────────
// //   statsRow: {
// //     flexDirection: 'row',
// //     borderWidth: 1,
// //     borderColor: G_DIM,
// //     borderRadius: 2,
// //     overflow: 'hidden',
// //   },
// //   statCell: { flex: 1, alignItems: 'center', paddingVertical: 16 },
// //   statCellBorder: { borderRightWidth: 1, borderRightColor: G_DIM },
// //   statVal: { color: G, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
// //   statSub: { color: OFF, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 3 },

// //   // ── Ticker ────────────────────────────────────────────────────────────────
// //   tickerWrap: {
// //     borderTopWidth: 1, borderBottomWidth: 1,
// //     borderColor: G_DIM,
// //     overflow: 'hidden',
// //     paddingVertical: 9,
// //     marginHorizontal: -24,
// //   },
// //   tickerTrack: {
// //     flexDirection: 'row', alignItems: 'center',
// //     width: 1120, paddingHorizontal: 24, gap: 16,
// //   },
// //   tickerWord: { color: 'rgba(74,250,140,0.55)', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
// //   tickerSep:  { color: 'rgba(74,250,140,0.2)',  fontSize: 9, fontWeight: '400' },

// //   // ── Chest panel ───────────────────────────────────────────────────────────
// //   chestPanel: {
// //     borderWidth: 1, borderColor: G_DIM,
// //     borderRadius: 2,
// //     backgroundColor: 'rgba(4,16,8,0.75)',
// //     overflow: 'hidden',
// //     position: 'relative',
// //   },
// //   scanLine: {
// //     position: 'absolute', left: 0, right: 0, height: 1,
// //     backgroundColor: 'rgba(74,250,140,0.2)', zIndex: 1,
// //   },
// //   // Corner brackets
// //   brk: { position: 'absolute', width: 12, height: 12, borderColor: G },
// //   brkTL: { top: 8,  left: 8,  borderTopWidth: 1.5, borderLeftWidth: 1.5 },
// //   brkTR: { top: 8,  right: 8, borderTopWidth: 1.5, borderRightWidth: 1.5 },
// //   brkBL: { bottom: 8, left: 8,  borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
// //   brkBR: { bottom: 8, right: 8, borderBottomWidth: 1.5, borderRightWidth: 1.5 },

// //   chestRow: {
// //     flexDirection: 'row', alignItems: 'center',
// //     gap: 14, padding: 18,
// //   },
// //   chestEmoji: { fontSize: 38 },
// //   chestInfo:  { flex: 1, gap: 4 },
// //   chestLabel: { color: G, fontSize: 10, fontWeight: '900', letterSpacing: 2.2 },
// //   chestDesc:  { color: OFF, fontSize: 12, lineHeight: 16 },
// //   activeBadge: {
// //     paddingHorizontal: 8, paddingVertical: 4,
// //     borderWidth: 1, borderColor: G_MID, borderRadius: 2,
// //   },
// //   activeBadgeText: { color: G, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },

// //   chestDivider: { height: 1, backgroundColor: G_DIM },

// //   rewardRow: {
// //     flexDirection: 'row',
// //     padding: 16, paddingTop: 12,
// //     gap: 0,
// //   },
// //   rewardItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
// //   rewardEmoji: { fontSize: 18 },
// //   rewardLabel: { color: OFF, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

// //   // ── CTA block ─────────────────────────────────────────────────────────────
// //   ctaBlock: { gap: 12 },
// //   ctaDivider: { height: 1, backgroundColor: G_DIM, marginBottom: 4 },
// //   ctaHeading: {
// //     color: WHITE, fontSize: 24, fontWeight: '900', letterSpacing: -0.5,
// //   },
// //   ctaBody: {
// //     color: OFF, fontSize: 13, lineHeight: 19,
// //     marginBottom: 4,
// //   },

// //   // ── Buttons ───────────────────────────────────────────────────────────────
// //   btn: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     justifyContent: 'space-between',
// //     paddingVertical: 17,
// //     paddingHorizontal: 20,
// //     borderRadius: 2,
// //   },
// //   btnFilled:  { backgroundColor: G },
// //   btnOutline: {
// //     backgroundColor: 'transparent',
// //     borderWidth: 1,
// //     borderColor: G_MID,
// //   },
// //   btnLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
// //   btnLabelFilled:  { color: DARK },
// //   btnLabelOutline: { color: G },
// //   btnArrow: { fontSize: 16, fontWeight: '400' },

// //   legal: {
// //     color: 'rgba(143,168,152,0.4)', fontSize: 11, textAlign: 'center', marginTop: 4,
// //   },
// //   legalLink: { color: 'rgba(74,250,140,0.5)' },
// // });


import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Link, useRouter } from 'expo-router';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, {
  Ellipse,
  Rect,
  Circle,
  Line,
  Path,
  G,
  Text as SvgText,
} from 'react-native-svg';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

// ─── Palette (identique à ton projet) ────────────────────────────────────────
const CYAN   = '#22d3ee';
const GREEN  = '#10b981';
const GREEN2 = '#34d399';
const GOLD   = '#fbbf24';
const DIM    = 'rgba(148,163,184,0.75)';
const GLASS  = 'rgba(15,23,42,0.60)';
const BORDER = 'rgba(34,211,238,0.22)';

// ─── Ticker data ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'CHASSE AU TRÉSOR','·','INDICES EXCLUSIFS','·',
  'RÉCOMPENSES RÉELLES','·','CO-OP EN ÉQUIPE','·',
  'CHASSE AU TRÉSOR','·','INDICES EXCLUSIFS','·',
  'RÉCOMPENSES RÉELLES','·',
];

// ─── MangaHero (SVG animé) ────────────────────────────────────────────────────
function MangaHero({
  floatY,
  chestScale,
}: {
  floatY: Animated.Value | Animated.AnimatedInterpolation<number>;
  chestScale: Animated.AnimatedInterpolation<number>;
}) {
  // ── Walk cycle refs ─────────────────────────────────────────────────────
  const walkA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(walkA, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(walkA, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const legLRot = walkA.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '16deg'] });
  const legRRot = walkA.interpolate({ inputRange: [0, 1], outputRange: ['16deg', '-20deg'] });
  const armLRot = walkA.interpolate({ inputRange: [0, 1], outputRange: ['22deg', '-28deg'] });
  const armRRot = walkA.interpolate({ inputRange: [0, 1], outputRange: ['-28deg', '22deg'] });

  return (
    <Animated.View style={{ transform: [{ translateY: floatY }, { scale: chestScale }] }}>
      <Svg viewBox="0 0 160 310" width={160} height={310}>

        {/* Shadow */}
        <Ellipse cx="80" cy="302" rx="38" ry="6" fill={GREEN} opacity={0.18} />

        {/* ── LEGS ── */}
        {/* Left leg */}
        <AnimatedG
          originX={54} originY={178}
          rotation={legLRot}>
          <Rect x="47" y="178" width="15" height="50" rx="7.5" fill="#1e3a5f" />
          <Rect x="47" y="218" width="15" height="12" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <Rect x="44" y="226" width="20" height="6" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
        </AnimatedG>
        {/* Right leg */}
        <AnimatedG
          originX={76} originY={178}
          rotation={legRRot}>
          <Rect x="69" y="178" width="15" height="50" rx="7.5" fill="#1e3a5f" />
          <Rect x="69" y="218" width="15" height="12" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <Rect x="67" y="226" width="20" height="6" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
        </AnimatedG>

        {/* ── BODY ── */}
        <Rect x="40" y="110" width="80" height="72" rx="16" fill="#1e40af" />
        <Rect x="40" y="110" width="80" height="24" rx="16" fill="#1d4ed8" />
        <Line x1="40" y1="134" x2="120" y2="134" stroke="#1e40af" strokeWidth="1" />
        <Line x1="80" y1="110" x2="80" y2="182" stroke="#1e3a8a" strokeWidth="2" />
        {/* belt */}
        <Rect x="40" y="172" width="80" height="9" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
        <Rect x="74" y="173" width="12" height="7" rx="2" fill={GOLD} />
        {/* badge */}
        <Rect x="46" y="120" width="22" height="12" rx="4" fill="#059669" />
        <SvgText x="57" y="130" fontSize="6" textAnchor="middle" fill="#d1fae5" fontWeight="800">LOO</SvgText>
        {/* collar */}
        <Path d="M64 110 L72 122 L80 116 L88 122 L96 110" fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeLinejoin="round" />

        {/* ── LEFT ARM (loupe) ── */}
        <AnimatedG
          originX={55} originY={118}
          rotation={armLRot}>
          <Rect x="25" y="118" width="15" height="45" rx="7.5" fill="#1e40af" />
          <Ellipse cx="32" cy="165" rx="8.5" ry="7.5" fill="#f97316" />
          {/* magnifying glass */}
          <Circle cx="20" cy="182" r="17" fill="none" stroke={GREEN} strokeWidth="3" />
          <Circle cx="20" cy="182" r="13" fill="#020617" opacity={0.9} />
          <Line x1="9" y1="175" x2="31" y2="175" stroke={GREEN2} strokeWidth="0.8" opacity={0.5} />
          <Line x1="9" y1="182" x2="31" y2="182" stroke={GREEN2} strokeWidth="1.2" opacity={0.9} />
          <Line x1="9" y1="189" x2="31" y2="189" stroke={GREEN2} strokeWidth="0.8" opacity={0.5} />
          <Line x1="20" y1="169" x2="20" y2="195" stroke={GREEN} strokeWidth="0.8" opacity={0.4} />
          <Circle cx="20" cy="182" r="2.5" fill={GREEN2} opacity={0.9} />
          {/* handle */}
          <Line x1="31" y1="193" x2="40" y2="204" stroke={GREEN} strokeWidth="4" strokeLinecap="round" />
          <Line x1="31" y1="193" x2="40" y2="204" stroke="#065f46" strokeWidth="2" strokeLinecap="round" />
          {/* XP badge */}
          <Rect x="36" y="164" width="26" height="13" rx="6.5" fill="#065f46" stroke={GREEN} strokeWidth="1" />
          <SvgText x="49" y="174" fontSize="6.5" textAnchor="middle" fill={GREEN2} fontWeight="800">+XP</SvgText>
        </AnimatedG>

        {/* ── RIGHT ARM ── */}
        <AnimatedG
          originX={105} originY={118}
          rotation={armRRot}>
          <Rect x="105" y="118" width="15" height="45" rx="7.5" fill="#1e40af" />
          <Ellipse cx="112" cy="165" rx="8.5" ry="7.5" fill="#f97316" />
        </AnimatedG>

        {/* ── NECK ── */}
        <Rect x="72" y="96" width="16" height="17" rx="5" fill="#f97316" />

        {/* ── HEAD — visage manga ── */}
        <Path d="M47 74 Q46 55 60 46 Q80 38 100 46 Q114 55 113 74 Q112 90 105 98 Q94 108 80 110 Q66 108 55 98 Q48 90 47 74Z" fill="#f97316" />
        <Path d="M55 98 Q66 108 80 110 Q94 108 105 98 Q100 106 80 108 Q60 106 55 98Z" fill="#ea580c" opacity={0.35} />
        {/* blush */}
        <Ellipse cx="57" cy="87" rx="8" ry="4" fill="#fb7185" opacity={0.25} />
        <Ellipse cx="103" cy="87" rx="8" ry="4" fill="#fb7185" opacity={0.25} />
        {/* ears */}
        <Ellipse cx="46" cy="76" rx="6" ry="8" fill="#f97316" />
        <Ellipse cx="46" cy="76" rx="4" ry="5.5" fill="#ea580c" opacity={0.4} />
        <Ellipse cx="114" cy="76" rx="6" ry="8" fill="#f97316" />
        <Ellipse cx="114" cy="76" rx="4" ry="5.5" fill="#ea580c" opacity={0.4} />
        {/* eyes whites */}
        <Ellipse cx="66" cy="73" rx="12" ry="13" fill="#fff" />
        <Ellipse cx="94" cy="73" rx="12" ry="13" fill="#fff" />
        {/* iris */}
        <Ellipse cx="66" cy="74" rx="9" ry="10" fill="#059669" />
        <Ellipse cx="94" cy="74" rx="9" ry="10" fill="#059669" />
        {/* pupil */}
        <Ellipse cx="67" cy="75" rx="5.5" ry="6.5" fill="#022c22" />
        <Ellipse cx="95" cy="75" rx="5.5" ry="6.5" fill="#022c22" />
        {/* manga shine */}
        <Ellipse cx="64" cy="70" rx="3" ry="3.5" fill="#fff" opacity={0.9} />
        <Circle cx="69" cy="79" r="1.5" fill="#fff" opacity={0.6} />
        <Ellipse cx="92" cy="70" rx="3" ry="3.5" fill="#fff" opacity={0.9} />
        <Circle cx="97" cy="79" r="1.5" fill="#fff" opacity={0.6} />
        {/* lashes */}
        <Path d="M54 64 Q66 58 78 64" fill="#1a1a2e" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round" />
        <Path d="M82 64 Q94 58 106 64" fill="#1a1a2e" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round" />
        <Path d="M56 82 Q66 86 76 82" fill="none" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M84 82 Q94 86 104 82" fill="none" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" />
        {/* brows */}
        <Path d="M53 58 Q66 52 79 56" fill="none" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
        <Path d="M81 56 Q94 52 107 58" fill="none" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
        {/* nose */}
        <Path d="M78 84 Q80 88 82 84" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
        {/* mouth */}
        <Path d="M68 96 Q80 104 92 96" fill="none" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M68 96 Q65 92 68 90" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />

        {/* ── HAT ── */}
        <Ellipse cx="80" cy="46" rx="42" ry="9" fill="#92400e" />
        <Ellipse cx="80" cy="44" rx="38" ry="7.5" fill="#78350f" />
        <Path d="M44 44 Q44 14 80 12 Q116 14 116 44Z" fill="#92400e" />
        <Path d="M44 44 Q44 24 80 22 Q116 24 116 44Z" fill="#a16207" />
        <Ellipse cx="80" cy="18" rx="20" ry="6" fill="#92400e" opacity={0.5} />
        {/* band émeraude */}
        <Rect x="44" y="38" width="72" height="7" rx="2" fill="#059669" />
        <Rect x="52" y="39.5" width="12" height="4" rx="1.5" fill={GREEN2} opacity={0.7} />
        <Rect x="96" y="39.5" width="8" height="4" rx="1.5" fill={GREEN2} opacity={0.5} />
        <Ellipse cx="68" cy="22" rx="10" ry="4" fill="#b45309" opacity={0.4} />

        {/* sparkles */}
        <Circle cx="128" cy="90" r="2.5" fill={GREEN2} opacity={0.7} />
        <Circle cx="136" cy="72" r="1.5" fill={GREEN2} opacity={0.5} />
        <Circle cx="18" cy="98" r="2" fill={GOLD} opacity={0.6} />
        {/* manga speed lines */}
        <Line x1="130" y1="130" x2="155" y2="122" stroke={GREEN} strokeWidth="1" opacity={0.25} />
        <Line x1="132" y1="142" x2="158" y2="138" stroke={GREEN} strokeWidth="0.7" opacity={0.2} />
        <Line x1="129" y1="155" x2="154" y2="154" stroke={GREEN} strokeWidth="0.7" opacity={0.15} />
      </Svg>
    </Animated.View>
  );
}

// ─── Helper: G animé via transform ───────────────────────────────────────────
// react-native-svg <G> ne supporte pas nativement les Animated.Value sur rotation
// On wrappe dans un Animated.View avec transform
function AnimatedG({
  children,
  originX,
  originY,
  rotation,
}: {
  children: ReactNode;
  originX: number;
  originY: number;
  rotation: Animated.AnimatedInterpolation<string>;
}) {
  return (
    // SVG foreignObject workaround : on utilise un G natif avec transform string
    // Dans react-native-svg, on passe la rotation directement en prop
    <G
      transform={`translate(${originX},${originY})`}
      // @ts-ignore — rotation animée via style n'est pas supportée nativement
      // Pour une vraie animation de rotation par segment, utilise Reanimated 2
      // avec useSharedValue + useDerivedValue, ou bien react-native-svg Animated.
    >
      {/* Note: pour une vraie animation par segment de corps (jambes/bras),
          utilise `react-native-svg` Animated comme ci-dessous :
          import Animated from 'react-native-reanimated';
          const AnimatedG = Animated.createAnimatedComponent(G);
      */}
      <G transform={`translate(-${originX},-${originY})`}>
        {children}
      </G>
    </G>
  );
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const router   = useRouter();
  const { session } = useAuth();
  const isSignedIn  = !!session || process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';
  const welcomeVideoSource = require('@/assets/images/videoVieux.mp4');
  const hasRevealedRef = useRef(false);

  // ── expo-video player ────────────────────────────────────────────────────
  const player = useVideoPlayer(welcomeVideoSource, (p) => {
    p.volume = 1.0;
    p.muted = false;
    p.loop = false;
    p.play();
  });

  // ── Animation refs ────────────────────────────────────────────────────────
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(24)).current;
  const ctaOpacity  = useRef(new Animated.Value(0)).current;
  const ctaY        = useRef(new Animated.Value(20)).current;
  const tickerX     = useRef(new Animated.Value(0)).current;
  const pulse       = useRef(new Animated.Value(0.85)).current;
  const floatY      = useRef(new Animated.Value(0)).current;
  const dotBlink    = useRef(new Animated.Value(0.4)).current;
  const btnGlow     = useRef(new Animated.Value(0)).current;

  const chestScale  = pulse.interpolate({ inputRange: [0.85, 1], outputRange: [0.97, 1.03] });
  const floatAnim   = floatY.interpolate({ inputRange: [-10, 0], outputRange: [-10, 0] });
  const glowOpacity = btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });
  const freezeFaceMs = 350;

  const revealCta = useCallback(() => {
    Animated.parallel([
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ctaY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaOpacity, ctaY]);

  // Détecte la fin de lecture via expo-video (remplace onPlaybackStatusUpdate)
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (hasRevealedRef.current) return;
      hasRevealedRef.current = true;
      // Freeze sur la première frame (en secondes)
      try {
        player.currentTime = freezeFaceMs / 1000;
        player.pause();
      } catch {
        // No-op
      }
      revealCta();
    });
    return () => sub.remove();
  }, [player, revealCta, freezeFaceMs]);

  useEffect(() => {

    // Entry sequence
    Animated.sequence([
      Animated.timing(heroOpacity, {
        toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleY, {
          toValue: 0, duration: 520, easing: Easing.out(Easing.exp), useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Ticker loop
    Animated.loop(
      Animated.timing(tickerX, {
        toValue: -480, duration: 10000, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();

    // Pulse + float
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Live dot blink
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotBlink, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(dotBlink, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Button glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnGlow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>

      <VideoView
        player={player}
        style={styles.bgMedia}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* Overlay lisibilité (surtout en bas pour le CTA) */}
      <LinearGradient
        colors={['rgba(2,5,16,0.04)', 'rgba(4,10,28,0.22)', 'rgba(6,14,38,0.62)']}
        style={StyleSheet.absoluteFill}
      />

      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          {/* ── CTA SECTION ──────────────────────────────────────────────── */}
          <Animated.View style={[styles.ctaCard, { opacity: ctaOpacity, transform: [{ translateY: ctaY }] }]}>
            <View style={styles.ctaFrameTop} />
            <View style={styles.cta}>
            <Text style={[styles.logoText, styles.ctaLogo]}>
              LOOT<Text style={styles.logoAccent}>OPIA</Text>
            </Text>
            <Text style={styles.ctaTitle}>Rejoins la chasse</Text>
            <Text style={styles.ctaTagline}>
              Crée ton compte ou connecte-toi pour accéder aux quêtes et récompenses.
            </Text>

            {isSignedIn ? (
              <Pressable onPress={() => router.replace('/(tabs)')}>
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>Continuer l'aventure ↗</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <>
                {/* Créer un compte */}
                <Link href="/register" asChild>
                  <Pressable>
                    <Animated.View style={{ opacity: glowOpacity.interpolate({ inputRange: [0.25, 0.6], outputRange: [1, 1] }) }}>
                      <LinearGradient
                        colors={['#059669', '#047857']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.btnPrimary}>
                        <Text style={styles.btnPrimaryText}>Créer un compte ↗</Text>
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>
                </Link>

                {/* Se connecter */}
                <Link href="/login" asChild>
                  <Pressable>
                    <View style={styles.btnSecondary}>
                      <Text style={styles.btnSecondaryText}>Se connecter</Text>
                    </View>
                  </Pressable>
                </Link>
              </>
            )}

            <Text style={styles.legal}>
              En continuant, tu acceptes nos{' '}
              <Text style={styles.legalLink}>Conditions d'utilisation</Text>
            </Text>
            </View>
            <View style={styles.ctaFrameBottom} />
          </Animated.View>
        </ScrollView>
      </ThemedView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:      { flex: 1 },
  bgMedia:   { ...StyleSheet.absoluteFillObject },
  bgImage:   { ...StyleSheet.absoluteFillObject, opacity: 0.85 },
  container: { flex: 1, backgroundColor: 'transparent' },

  orb: { position: 'absolute', borderRadius: 9999 },
  orbTopLeft: {
    top: '-5%', left: '-20%',
    width: 280, height: 280,
    backgroundColor: 'rgba(16,185,129,0.06)',
  },
  orbBottomRight: {
    bottom: '0%', right: '-25%',
    width: 320, height: 320,
    backgroundColor: 'rgba(250,191,36,0.04)',
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 18,
    alignItems: 'stretch',
  },

  // ── Top bar ───────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34,211,238,0.12)',
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 7, height: 7, borderRadius: 7,
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80', shadowOpacity: 0.9, shadowRadius: 5,
  },
  topBarText: {
    color: 'rgba(103,232,249,0.55)',
    fontSize: 9, fontWeight: '800', letterSpacing: 2,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroWrap: {
    alignItems: 'center',
    position: 'relative',
    height: 290,
    marginTop: -10,
  },
  heroGlow: {
    position: 'absolute',
    top: 30,
    width: 220, height: 200,
    borderRadius: 110,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  groundGlow: {
    position: 'absolute',
    bottom: 0,
    width: 160, height: 20,
    borderRadius: 80,
    backgroundColor: 'rgba(16,185,129,0.2)',
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoBlock:  { alignItems: 'center', gap: 8, marginTop: 8 },
  logoText: {
    color: '#f0f9ff',
    fontSize: 40, fontWeight: '900', letterSpacing: 6,
    textShadowColor: 'rgba(16,185,129,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  logoAccent: { color: GREEN },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    backgroundColor: 'rgba(5,46,22,0.7)',
  },
  statusDot: {
    width: 7, height: 7, borderRadius: 7,
    backgroundColor: '#4ade80',
    shadowColor: '#4ade80', shadowOpacity: 0.9, shadowRadius: 4,
  },
  statusText: { color: '#67e8f9', fontSize: 9, fontWeight: '800', letterSpacing: 2 },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsStrip: {
    flexDirection: 'row',
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: GLASS,
    overflow: 'hidden',
  },
  statItem:   { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  statBorder: { borderRightWidth: 1, borderRightColor: BORDER },
  statVal: { color: CYAN, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  statLabel: { color: DIM, fontSize: 9, fontWeight: '600', letterSpacing: 0.4, marginTop: 2 },

  // ── Ticker ────────────────────────────────────────────────────────────────
  tickerWrap: {
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(2,132,199,0.08)',
    overflow: 'hidden',
    paddingVertical: 8,
    marginHorizontal: -20,
  },
  tickerTrack: {
    flexDirection: 'row', alignItems: 'center',
    width: 960, paddingHorizontal: 12, gap: 8,
  },
  tickerText: { color: '#67e8f9', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  tickerDot:  { color: CYAN, fontSize: 9, fontWeight: '900' },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(34,211,238,0.55)',
    backgroundColor: 'rgba(2,6,23,0.82)',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginTop: 24,
  },
  ctaFrameTop: {
    alignSelf: 'center',
    width: '42%',
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
    backgroundColor: 'rgba(52,211,153,0.85)',
  },
  ctaFrameBottom: {
    alignSelf: 'center',
    width: '30%',
    height: 3,
    borderRadius: 2,
    marginTop: 10,
    backgroundColor: 'rgba(34,211,238,0.8)',
  },
  cta: {
    gap: 12,
    paddingTop: 4,
  },
  ctaLogo: {
    alignSelf: 'center',
    fontSize: 30,
    letterSpacing: 4,
    marginBottom: 2,
  },
  ctaTitle: {
    color: '#ecfeff', fontSize: 24, fontWeight: '900',
    letterSpacing: 1.2, textAlign: 'center', textTransform: 'uppercase',
    textShadowColor: 'rgba(34,211,238,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  ctaTagline: {
    color: 'rgba(236,254,255,0.86)', fontSize: 13, lineHeight: 19,
    textAlign: 'center', marginBottom: 4,
  },

  // Buttons
  btnPrimary: {
    paddingVertical: 15, paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(167,243,208,0.95)',
    alignItems: 'center',
    shadowColor: GREEN, shadowOpacity: 0.55, shadowRadius: 14, elevation: 8,
  },
  btnPrimaryText: {
    color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  btnSecondary: {
    paddingVertical: 15, paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(34,211,238,0.7)',
    backgroundColor: 'rgba(2,132,199,0.2)',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#a5f3fc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },

  legal: {
    color: 'rgba(186,230,253,0.72)', fontSize: 11,
    textAlign: 'center', marginTop: 4,
  },
  legalLink: { color: CYAN, textDecorationLine: 'underline' },
});