import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { useApiResource } from '@/hooks/use-api-resource';
import { addGems } from '@/hooks/use-gems';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';

// ─── Types ───────────────────────────────────────────────────────────────────

type ArEvent =
  | { type: 'MARKER_FOUND' }
  | { type: 'MARKER_LOST' };

type GamePhase = 'searching' | 'detected' | 'countdown' | 'validated';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 3;
const BASE_URL = 'https://lootopia-app.lemonmushroom-0ccbe539.polandcentral.azurecontainerapps.io';

const SEARCH_MESSAGES = [
  "🗺️  Les anciens parlent d'un marqueur caché ici…",
  '🔦  Tourne-toi lentement, il se cache dans l\'ombre.',
  '⚓  Le trésor attend que tu le trouves…',
  '🧭  Rapproche-toi. Tu brûles.',
  '🌑  Quelque chose de puissant est tout près…',
  '🕯️  Le trésor révèle ses secrets aux persévérants.',
];

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildArHtml(markerPatternUrl?: string | null): string {
  const hasPattern =
    typeof markerPatternUrl === 'string' && markerPatternUrl.trim().length > 0;
  const safeMarkerUrl = hasPattern
    ? markerPatternUrl!.replace(/"/g, '&quot;')
    : null;

  const markerTag = hasPattern
    ? `<a-marker type="pattern" url="${safeMarkerUrl}">`
    : '<a-marker preset="hiro">';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
  <script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }

    /* AR.js crée un <video> et un <canvas> — il faut qu'ils soient visibles */
    video, canvas {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      z-index: 0 !important;
    }

    a-scene {
      position: fixed !important;
      top: 0; left: 0;
      width: 100% !important;
      height: 100% !important;
      z-index: 1;
    }

    #overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 9999;
      font-family: Arial, sans-serif;
    }

    #status {
      position: absolute;
      top: 10px; left: 10px; right: 10px;
      background: rgba(10,10,20,0.85);
      border: 1px solid rgba(250,204,21,0.4);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fef3c7;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      transition: all 0.4s ease;
    }

    #status.found {
      border-color: rgba(34,197,94,0.8);
      color: #bbf7d0;
      background: rgba(5,46,22,0.9);
    }

    #frame {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 220px; height: 220px;
    }
    #frame .corner {
      position: absolute;
      width: 28px; height: 28px;
      border-color: rgba(250,204,21,0.8);
      border-style: solid;
    }
    #frame .tl { top:0; left:0;  border-width:3px 0 0 3px; }
    #frame .tr { top:0; right:0; border-width:3px 3px 0 0; }
    #frame .bl { bottom:0; left:0; border-width:0 0 3px 3px; }
    #frame .br { bottom:0; right:0; border-width:0 3px 3px 0; }

    #frame.found .corner {
      border-color: rgba(34,197,94,0.9);
      animation: pulse-found 0.6s ease-in-out infinite alternate;
    }
    @keyframes pulse-found { from { opacity:0.6; } to { opacity:1; } }

    #scanline {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 210px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(250,204,21,0.7), transparent);
      animation: scan 2s ease-in-out infinite;
    }
    #scanline.found { display: none; }
    @keyframes scan {
      0%   { margin-top: -100px; }
      50%  { margin-top:  100px; }
      100% { margin-top: -100px; }
    }
  </style>
</head>
<body>
  <div id="overlay">
    <div id="status">📷 Cherche le marqueur…</div>
    <div id="frame">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
    </div>
    <div id="scanline"></div>
  </div>

  <a-scene
    embedded
    vr-mode-ui="enabled: false"
    renderer="logarithmicDepthBuffer: true; colorManagement: true;"
    arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
  >
    ${markerTag}
      <a-box
        position="0 0.5 0"
        scale="0.5 0.5 0.5"
        material="color: #06b6d4; emissive: #0e7490; emissiveIntensity: 0.4;"
        animation__rot="property: rotation; to: 0 360 0; loop: true; dur: 2000; easing: linear;"
        animation__scale="property: scale; to: 1 1 1; dur: 800; easing: easeOutElastic;"
      ></a-box>
      <a-text
        value="✦ Trésor ✦"
        color="#facc15"
        align="center"
        position="0 1.5 0"
        rotation="-90 0 0"
        width="4"
        animation="property: opacity; from: 0; to: 1; dur: 600;"
      ></a-text>
      <a-ring
        color="#facc15"
        position="0 0.01 0"
        rotation="-90 0 0"
        radius-inner="0.6"
        radius-outer="0.7"
        opacity="0.6"
        animation="property: rotation; to: -90 0 360; loop: true; dur: 3000; easing: linear;"
      ></a-ring>
    </a-marker>
    <a-entity camera></a-entity>
  </a-scene>

  <script>
    const marker   = document.querySelector('a-marker');
    const status   = document.getElementById('status');
    const frame    = document.getElementById('frame');
    const scanline = document.getElementById('scanline');

    let found = false;

    marker.addEventListener('markerFound', function () {
      if (found) return;
      found = true;
      status.textContent = '✅ Marqueur trouvé — maintiens stable !';
      status.classList.add('found');
      frame.classList.add('found');
      scanline.classList.add('found');
      window.ReactNativeWebView &&
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_FOUND' }));
    });

    marker.addEventListener('markerLost', function () {
      if (!found) return;
      found = false;
      status.textContent = '📷 Marqueur perdu, rapproche-toi…';
      status.classList.remove('found');
      frame.classList.remove('found');
      scanline.classList.remove('found');
      window.ReactNativeWebView &&
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_LOST' }));
    });
  </script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArStepScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string; huntId?: string }>();
  const stepId = Number(params.id ?? 0);
  const huntId = Number(params.huntId ?? 0);

  const [permission, requestPermission] = useCameraPermissions();
  const [webviewError, setWebviewError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const [phase, setPhase] = useState<GamePhase>('searching');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [msgIndex, setMsgIndex] = useState(0);

  const pulseAnim      = useRef(new Animated.Value(1)).current;
  const glowAnim       = useRef(new Animated.Value(0)).current;
  const countdownScale = useRef(new Animated.Value(1)).current;
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgCycleRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadStep = useCallback(async () => {
    if (!huntId || !stepId) throw new Error("Identifiant d'étape invalide.");
    const steps = await lootopiaApi.getHuntSteps(huntId);
    const found = steps.find((s) => s.id === stepId);
    if (!found) throw new Error('Étape introuvable pour cette chasse.');
    return found;
  }, [huntId, stepId]);

  const { data: step, loading: stepLoading, error: stepError } =
    useApiResource(loadStep);

  const arMarkerUrl = step?.arMarkerUrl ?? null;
  const htmlSource  = useMemo(() => buildArHtml(arMarkerUrl), [arMarkerUrl]);

  // ── Camera permission ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!permission || permission.granted) return;
    void requestPermission();
  }, [permission, requestPermission]);

  // ── Message cycling ───────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'searching') {
      if (msgCycleRef.current) clearInterval(msgCycleRef.current);
      return;
    }
    msgCycleRef.current = setInterval(() => {
      setMsgIndex((i) => (i + 1) % SEARCH_MESSAGES.length);
    }, 3500);
    return () => { if (msgCycleRef.current) clearInterval(msgCycleRef.current); };
  }, [phase]);

  // ── Pulse animation ───────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'detected' || phase === 'countdown') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
        ])
      ).start();
      Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [phase, pulseAnim, glowAnim]);

  // ── Validate step ─────────────────────────────────────────────────────────

  const validateStep = useCallback(async () => {
    if (!session?.userId || !stepId) return;
    setValidating(true);
    try {
      const participation = await lootopiaApi.completeStep(session.userId, stepId, 10);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (participation.isLastStep) {
        await addGems(session.userId, 10);
        Alert.alert('🏆 Chasse terminée !', '💎 +10 gemmes gagnées !', [
          { text: 'Super !', onPress: () => router.replace(`/hunt-map/${huntId}`) },
        ]);
      } else {
        setPhase('validated');
      }
    } catch {
      Alert.alert('Erreur', "Impossible de valider l'étape. Réessaie.");
      setPhase('searching');
    } finally {
      setValidating(false);
    }
  }, [session?.userId, stepId, huntId, router]);

  // ── Countdown ─────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        Animated.sequence([
          Animated.timing(countdownScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
          Animated.timing(countdownScale, { toValue: 1,   duration: 180, useNativeDriver: true }),
        ]).start();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          void validateStep();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [countdownScale, validateStep]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(COUNTDOWN_SECONDS);
    setPhase('detected');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (msgCycleRef.current)  clearInterval(msgCycleRef.current);
    };
  }, []);

  // ── WebView messages ──────────────────────────────────────────────────────

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg: ArEvent = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'MARKER_FOUND' && phase === 'searching') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setPhase('detected');
          startCountdown();
        }
        if (msg.type === 'MARKER_LOST' && (phase === 'detected' || phase === 'countdown')) {
          cancelCountdown();
          setPhase('searching');
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch {
        // ignore parse errors
      }
    },
    [phase, startCountdown, cancelCountdown]
  );

  // ── Open marker in browser ────────────────────────────────────────────────

  const openInBrowser = useCallback(async () => {
    if (!arMarkerUrl) return;
    try {
      await WebBrowser.openBrowserAsync(arMarkerUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir le marqueur.");
    }
  }, [arMarkerUrl]);

  const glowColor = glowAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(250,204,21,0)', 'rgba(250,204,21,0.18)'],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / permission / error states
  // ─────────────────────────────────────────────────────────────────────────

  if (stepLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#facc15" size="large" />
        <Text style={styles.loadingText}>Préparation du portail…</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#facc15" />
        <Text style={styles.loadingText}>Vérification des accès…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.errorTitle}>Accès caméra requis</Text>
        <Text style={styles.errorSubtitle}>
          La réalité augmentée a besoin de la caméra pour révéler le trésor.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => void requestPermission()}>
          <Text style={styles.primaryButtonText}>Autoriser la caméra</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={() => router.replace(`/hunt-map/${huntId}`)}>
          <Text style={styles.ghostButtonText}>Retour à la carte</Text>
        </Pressable>
      </View>
    );
  }

  if (stepError || !step) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Étape introuvable</Text>
        <Text style={styles.errorSubtitle}>{stepError ?? 'Impossible de charger cette étape.'}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace(`/hunt-map/${huntId}`)}>
          <Text style={styles.primaryButtonText}>Retour à la carte</Text>
        </Pressable>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Validated screen
  // ─────────────────────────────────────────────────────────────────────────

  if (phase === 'validated' || validating) {
    return (
      <View style={styles.validatedScreen}>
        {validating ? (
          <>
            <ActivityIndicator color="#facc15" size="large" />
            <Text style={styles.loadingText}>Validation en cours…</Text>
          </>
        ) : (
          <>
            <Animated.Text style={[styles.validatedEmoji, { transform: [{ scale: pulseAnim }] }]}>
              ✦
            </Animated.Text>
            <Text style={styles.validatedTitle}>Trésor découvert !</Text>
            <Text style={styles.validatedSubtitle}>
              Tu as percé le secret de l'étape {step.orderNumber}.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace(`/hunt-map/${huntId}`)}
            >
              <Text style={styles.primaryButtonText}>Continuer la chasse</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main AR screen
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.closeButton}
          onPress={() => router.replace(`/hunt-map/${huntId}`)}
        >
          <Text style={styles.closeText}>‹</Text>
        </Pressable>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>ÉTAPE {step.orderNumber}</Text>
          <Text style={styles.headerSubtitle}>Mode Réalité Augmentée</Text>
        </View>
      </View>

      <WebView
        source={{
          html: htmlSource,
          baseUrl: BASE_URL,
        }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        onMessage={handleWebViewMessage}
        onError={(e) => setWebviewError(e.nativeEvent.description || 'Erreur WebView')}
        onHttpError={(e) => setWebviewError(`HTTP ${e.nativeEvent.statusCode}`)}
      />

      <Animated.View style={[styles.bottomPanel, { backgroundColor: glowColor as any }]}>

        {phase === 'searching' && (
          <View style={styles.searchBox}>
            <Text style={styles.searchMessage}>{SEARCH_MESSAGES[msgIndex]}</Text>
          </View>
        )}

        {phase === 'detected' && (
          <Animated.View style={[styles.detectedBox, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.detectedLabel}>🔮 Marqueur détecté</Text>
            <Text style={styles.detectedSub}>Maintiens-le dans le cadre…</Text>
            <Pressable style={styles.validateButton} onPress={startCountdown}>
              <Text style={styles.validateButtonText}>Valider maintenant</Text>
            </Pressable>
          </Animated.View>
        )}

        {phase === 'countdown' && (
          <View style={styles.countdownBox}>
            <View style={styles.countdownRow}>
              <Text style={styles.countdownLabel}>Validation dans</Text>
              <Animated.Text
                style={[styles.countdownNumber, { transform: [{ scale: countdownScale }] }]}
              >
                {countdown}
              </Animated.Text>
            </View>
            <View style={styles.countdownBar}>
              <View
                style={[
                  styles.countdownFill,
                  { width: `${((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}%` },
                ]}
              />
            </View>
            <Pressable style={styles.cancelButton} onPress={cancelCountdown}>
              <Text style={styles.cancelButtonText}>✕ Annuler</Text>
            </Pressable>
          </View>
        )}

        {webviewError ? (
          <Text style={styles.webviewError}>⚠ {webviewError}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  center:           { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  permissionIcon:   { fontSize: 52, marginBottom: 4 },
  loadingText:      { color: '#fef3c7', fontSize: 15, fontWeight: '700', marginTop: 12 },
  errorTitle:       { color: '#fef3c7', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  errorSubtitle:    { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 6 },
  primaryButton:    { borderRadius: 14, backgroundColor: '#0f766e', paddingHorizontal: 24, paddingVertical: 13, minWidth: 200, alignItems: 'center' },
  primaryButtonText:{ color: '#ecfeff', fontSize: 15, fontWeight: '800' },
  ghostButton:      { borderRadius: 12, borderWidth: 1, borderColor: '#475569', paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center' },
  ghostButtonText:  { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  validateButton:   { marginTop: 10, borderRadius: 14, backgroundColor: '#0f766e', paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center' },
  validateButtonText:{ color: '#ecfeff', fontSize: 15, fontWeight: '800' },
  cancelButton:     { borderRadius: 10, borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center', alignSelf: 'center' },
  cancelButtonText: { color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  topBar:           { paddingTop: 54, paddingHorizontal: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#020617' },
  closeButton:      { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(31,22,12,0.78)', borderWidth: 2, borderColor: '#d97706', alignItems: 'center', justifyContent: 'center' },
  closeText:        { color: '#fef3c7', fontSize: 38, fontWeight: '900', lineHeight: 42 },
  headerTextBox:    { flex: 1, borderRadius: 14, backgroundColor: 'rgba(2,44,34,0.72)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)', padding: 10 },
  headerTitle:      { color: '#facc15', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  headerSubtitle:   { color: '#94a3b8', fontSize: 11, fontWeight: '700', marginTop: 2 },
  webview:          { flex: 1, backgroundColor: 'transparent' },
  bottomPanel:      { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28, backgroundColor: '#020617', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', minHeight: 110, justifyContent: 'center' },
  searchBox:        { gap: 10, alignItems: 'center' },
  searchMessage:    { color: '#e2e8f0', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  hintText:         { color: '#f59e0b', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  detectedBox:      { alignItems: 'center', gap: 4 },
  detectedLabel:    { color: '#bbf7d0', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  detectedSub:      { color: '#6ee7b7', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  countdownBox:     { gap: 10 },
  countdownRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  countdownLabel:   { color: '#fef3c7', fontSize: 15, fontWeight: '700' },
  countdownNumber:  { color: '#facc15', fontSize: 38, fontWeight: '900', minWidth: 50, textAlign: 'center' },
  countdownBar:     { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  countdownFill:    { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  validatedScreen:  { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  validatedEmoji:   { fontSize: 72, color: '#facc15', marginBottom: 8 },
  validatedTitle:   { color: '#fef3c7', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  validatedSubtitle:{ color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  webviewError:     { color: '#fca5a5', fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 6 },
});