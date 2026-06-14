import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

import { useApiResource } from '@/hooks/use-api-resource';
import { addGems } from '@/hooks/use-gems';
import { useAuth } from '@/providers/auth-provider';
import { lootopiaApi } from '@/services/lootopia-api';

const STEP_POINTS_REWARD = 10;
const WEBVIEW_TIMEOUT_MS = 5000;

function buildArHtml(markerPatternUrl?: string | null): string {
  const hasPattern = typeof markerPatternUrl === 'string' && markerPatternUrl.trim().length > 0;
  const safeMarkerUrl = hasPattern ? markerPatternUrl.replace(/"/g, '&quot;') : null;

  const markerStartTag = hasPattern
    ? `<a-marker type="pattern" url="${safeMarkerUrl}">`
    : '<a-marker preset="hiro">';

  const hintMessage = hasPattern
    ? 'Aligne le marqueur de cette étape devant la caméra.'
    : 'Mode test actif : utilise le marker HIRO pour tester la RA.';
return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />

<script src="https://aframe.io/releases/1.3.0/aframe.min.js"></script>
<script src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js"></script>

    <style>
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #000;
        width: 100%;
        height: 100%;
      }

      #hint {
        position: fixed;
        left: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: #e5e7eb;
        background: rgba(2, 6, 23, 0.82);
        border: 1px solid rgba(34, 197, 94, 0.45);
        border-radius: 10px;
        padding: 10px;
        text-align: center;
      }

      #status {
        position: fixed;
        top: 12px;
        left: 12px;
        right: 12px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 900;
        color: #fef3c7;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(250, 204, 21, 0.55);
        border-radius: 10px;
        padding: 10px;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div id="status">📷 Cherche le marker...</div>
    <div id="hint">${hintMessage}</div>

    <a-scene
      embedded
      vr-mode-ui="enabled: false"
      renderer="logarithmicDepthBuffer: true; colorManagement: true;"
      arjs="sourceType: webcam; debugUIEnabled: false;"
    >
      ${markerStartTag}
        <a-box
          position="0 0.5 0"
          scale="1 1 1"
          material="color: #06b6d4; metalness: 0.25; roughness: 0.45;"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 2500"
        ></a-box>

        <a-text
          value="Loot trouvé"
          color="#facc15"
          align="center"
          position="0 1.4 0"
          rotation="-90 0 0"
          width="3"
        ></a-text>
      </a-marker>

      <a-entity camera></a-entity>
    </a-scene>

    <script>
      const marker = document.querySelector('a-marker');
      const status = document.getElementById('status');

      marker.addEventListener('markerFound', () => {
        status.innerText = '✅ Marker détecté !';
        status.style.borderColor = 'rgba(34, 197, 94, 0.8)';
        status.style.color = '#bbf7d0';
      });

      marker.addEventListener('markerLost', () => {
        status.innerText = '📷 Marker perdu, rapproche-toi doucement';
        status.style.borderColor = 'rgba(250, 204, 21, 0.55)';
        status.style.color = '#fef3c7';
      });
    </script>
  </body>
</html>`;
}

export default function ArStepScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; huntId?: string }>();

  const stepId = Number(params.id ?? 0);
  const huntId = Number(params.huntId ?? 0);

  const { session } = useAuth();

  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [webviewError, setWebviewError] = useState<string | null>(null);
  const [webviewLoaded, setWebviewLoaded] = useState(false);

  // const [renderMode, setRenderMode] = useState<'webview' | 'native'>(
  //   Platform.OS === 'ios' ? 'native' : 'webview'
  // );

  const [renderMode, setRenderMode] = useState<'webview' | 'native'>('webview');

  const [permission, requestPermission] = useCameraPermissions();

  const loadStep = useCallback(async () => {
    if (!huntId || !stepId) {
      throw new Error("Identifiant d'étape invalide.");
    }

    const steps = await lootopiaApi.getHuntSteps(huntId);
    const found = steps.find((step) => step.id === stepId);

    if (!found) {
      throw new Error('Étape introuvable pour cette chasse.');
    }

    return found;
  }, [huntId, stepId]);

  const {
    data: step,
    loading: stepLoading,
    error: stepError,
  } = useApiResource(loadStep);

  const arMarkerUrl = step?.arMarkerUrl ?? null;
  const htmlSource = useMemo(() => buildArHtml(arMarkerUrl), [arMarkerUrl]);

  useEffect(() => {
    if (!permission || permission.granted) return;
    void requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (renderMode !== 'webview' || webviewLoaded) return;

    const timeout = setTimeout(() => {
      setRenderMode('native');
      setWebviewError(
        'Mode WebView indisponible sur cet appareil. Bascule automatique en caméra native.'
      );
    }, WEBVIEW_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [renderMode, webviewLoaded]);

  const handleValidate = async () => {
    if (!session?.userId) {
      Alert.alert('Erreur', 'Tu dois être connecté.');
      return;
    }

    if (!stepId) {
      Alert.alert('Erreur', "Étape invalide.");
      return;
    }

    try {
      setValidating(true);

      const participation = await lootopiaApi.completeStep(
        session.userId,
        stepId,
        STEP_POINTS_REWARD
      );

      if (participation.isLastStep) {
        await addGems(session.userId, 10);
      }

      setValidated(true);

      const huntCompleteMsg = participation.isLastStep ? '\n\n💎 +10 gemmes gagnées !' : '';
      Alert.alert(
        'Étape validée',
        `Participation #${participation.id} enregistrée (${participation.pointsEarned} points).${huntCompleteMsg}`,
        [
          {
            text: 'Continuer',
            onPress: () => router.replace(`/hunt-play/${huntId}`),
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur de validation', message);
    } finally {
      setValidating(false);
    }
  };

  const openInBrowser = async () => {
    if (!arMarkerUrl) return;

    try {
      await WebBrowser.openBrowserAsync(arMarkerUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir le marqueur dans le navigateur.");
    }
  };

  const retryWebView = () => {
    setWebviewLoaded(false);
    setWebviewError(null);
    setRenderMode('webview');
  };

  if (stepLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#facc15" />
        <Text style={styles.loadingText}>Préparation de la scène RA...</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#facc15" />
        <Text style={styles.loadingText}>Vérification permission caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Permission caméra nécessaire pour la RA.</Text>

        <Pressable style={styles.backButton} onPress={() => void requestPermission()}>
          <Text style={styles.backButtonText}>Autoriser la caméra</Text>
        </Pressable>

        <Pressable style={styles.secondaryBackButton} onPress={() => router.replace(`/hunt-play/${huntId}`)}>
          <Text style={styles.secondaryBackButtonText}>Retour au jeu</Text>
        </Pressable>
      </View>
    );
  }

  if (stepError || !step) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur : {stepError ?? 'Étape indisponible'}</Text>

        <Pressable style={styles.backButton} onPress={() => router.replace(`/hunt-play/${huntId}`)}>
          <Text style={styles.backButtonText}>Retour au jeu</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable style={styles.closeButton} onPress={() => router.replace(`/hunt-play/${huntId}`)}>
          <Text style={styles.closeText}>‹</Text>
        </Pressable>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>
            {renderMode === 'webview' ? 'MODE RA AR.JS' : 'CAMÉRA NATIVE'}
          </Text>
          <Text style={styles.headerSubtitle}>Étape {step.orderNumber}</Text>
        </View>
      </View>

      {renderMode === 'webview' ? (
<WebView
  source={{
    html: htmlSource,
    baseUrl: 'https://lootopia-app.lemonmushroom-0ccbe539.polandcentral.azurecontainerapps.io',
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
  androidHardwareAccelerationDisabled={false}
  mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
  onLoadEnd={() => setWebviewLoaded(true)}
  onError={(event) => {
    setWebviewError(event.nativeEvent.description || 'Erreur inconnue WebView');
    setRenderMode('native');
  }}
  onHttpError={(event) => {
    setWebviewError(`Erreur HTTP WebView : ${event.nativeEvent.statusCode}`);
    setRenderMode('native');
  }}
/>
      ) : (
        <View style={styles.nativeCameraWrap}>
          <CameraView style={StyleSheet.absoluteFillObject} facing="back" />

          <View style={styles.nativeCameraOverlay}>
            <Text style={styles.nativeCameraTitle}>Mode caméra native actif</Text>
            <Text style={styles.nativeCameraText}>
              La WebView AR.js peut être instable selon l’appareil. Tu peux continuer la mission ici.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.bottomPanel}>
        {webviewError ? <Text style={styles.webviewError}>WebView : {webviewError}</Text> : null}

        <View style={styles.modeSwitchRow}>
          <Pressable
            style={[styles.modeSwitchButton, renderMode === 'native' && styles.modeSwitchButtonActive]}
            onPress={() => setRenderMode('native')}
          >
            <Text style={styles.modeSwitchText}>Caméra native</Text>
          </Pressable>

          <Pressable
            style={[styles.modeSwitchButton, renderMode === 'webview' && styles.modeSwitchButtonActive]}
            onPress={retryWebView}
          >
            <Text style={styles.modeSwitchText}>Tester AR.js</Text>
          </Pressable>
        </View>

        {arMarkerUrl ? (
          <Pressable style={styles.secondaryButton} onPress={() => void openInBrowser()}>
            <Text style={styles.secondaryButtonText}>Ouvrir le marqueur</Text>
          </Pressable>
        ) : (
          <View style={styles.fallbackHintBox}>
            <Text style={styles.fallbackHintText}>
              Aucun arMarkerUrl fourni par l’API : test avec le marker HIRO.
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.validateButton, (validating || validated) && styles.buttonDisabled]}
          onPress={() => void handleValidate()}
          disabled={validating || validated}
        >
          {validating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.validateButtonText}>
              {validated ? 'Étape déjà validée' : "J’ai trouvé le marqueur, valider"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#fef3c7',
    fontWeight: '800',
  },
  errorText: {
    color: '#fecaca',
    textAlign: 'center',
    fontWeight: '700',
  },
  backButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#0f766e',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#ecfeff',
    fontWeight: '700',
  },
  secondaryBackButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryBackButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#020617',
  },
  closeButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(31,22,12,0.78)',
    borderWidth: 3,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fef3c7',
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 42,
  },
  headerTextBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(2,44,34,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
    padding: 10,
  },
  headerTitle: {
    color: '#facc15',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    marginTop: 2,
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeCameraWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeCameraOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    padding: 10,
    gap: 4,
  },
  nativeCameraTitle: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '800',
  },
  nativeCameraText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  fallbackHintBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(120,53,15,0.35)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  fallbackHintText: {
    color: '#fef3c7',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPanel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 10,
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  webviewError: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(14,116,144,0.35)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#bae6fd',
    fontWeight: '700',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeSwitchButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeSwitchButtonActive: {
    borderColor: '#22d3ee',
    backgroundColor: '#164e63',
  },
  modeSwitchText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  validateButton: {
    borderRadius: 12,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});