import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getOcrApiUrl, readCodesAndDeleteImage } from '../core/ocr';
import { NETWORKS } from '../core/recharge';
import ActionButton from '../components/ActionButton';
import { colors } from '../theme/colors';

export default function ScanScreen({ networkId, onBack, onCode, onManual }) {
  const cameraRef = useRef(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [torch, setTorch] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [scanHint, setScanHint] = useState('Cadrez les chiffres puis appuyez sur Scanner.');
  const network = NETWORKS[networkId];
  const apiUrl = getOcrApiUrl();

  useEffect(() => () => { mountedRef.current = false; }, []);

  const scanPhoto = useCallback(async (automatic = false) => {
    if (!ready || !cameraRef.current || busyRef.current) return;
    if (!apiUrl) {
      Alert.alert(
        'Serveur OCR non configure',
        'Dans le fichier .env, definissez EXPO_PUBLIC_OCR_API_URL=http://IP_DU_PC:3001 puis redemarrez Expo.',
      );
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setScanHint('Lecture OCR en cours ; ouverture du téléphone après détection...');

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });
      if (!picture?.uri) throw new Error('Aucune photo capturee.');

      const codes = await readCodesAndDeleteImage(picture.uri);
      if (!mountedRef.current) return;

      if (codes.length === 1) {
        setAutoMode(false);
        await onCode(codes[0]); // Ouvre automatiquement le composeur Android.
      } else {
        const msg = codes.length > 1
          ? 'Plusieurs numeros reconnus. Isolez une seule suite de 14 chiffres.'
          : 'Aucun code a 14 chiffres detecte. Approchez la carte et augmentez la lumiere.';
        setScanHint(msg);
        if (!automatic) {
          Alert.alert(codes.length > 1 ? 'Plusieurs codes' : 'Code introuvable', msg, [
            { text: 'Reessayer', style: 'cancel' },
            { text: 'Saisir manuellement', onPress: onManual },
          ]);
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setAutoMode(false); // Ne pas saturer le serveur si le reseau tombe.
      setScanHint(error.message || 'Erreur de scan');
      if (!automatic) Alert.alert('Echec du scan', error.message || 'Reessayez.');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }, [apiUrl, onCode, onManual, ready]);

  useEffect(() => {
    if (!permission?.granted || !ready || !autoMode) return undefined;
    // Auto-surveillance moderee : une capture maximum toutes les 5 secondes.
    const id = setInterval(() => void scanPhoto(true), 5000);
    return () => clearInterval(id);
  }, [permission?.granted, ready, autoMode, scanPhoto]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityLabel="Retour" style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.headingTop}>02  SCANNER LA CARTE</Text>
          <Text style={styles.headingTitle}>{network.label}</Text>
        </View>
        <View style={[styles.indicator, { backgroundColor: network.color }]} />
      </View>

      <Text style={styles.instruction}>
        Grattez la carte, cadrez les 14 chiffres et scannez. Le composeur s’ouvrira automatiquement après reconnaissance. Vérifiez le code avant de confirmer sur Android.
      </Text>

      {!permission ? (
        <View style={styles.notice}><ActivityIndicator color={colors.green} /></View>
      ) : !permission.granted ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Camera non autorisee</Text>
          <Text style={styles.noticeText}>No-kiky doit acceder a la camera pour lire votre carte.</Text>
          <ActionButton label="Autoriser la camera" onPress={() => void requestPermission()} />
        </View>
      ) : (
        <View style={styles.cameraOuter}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            onCameraReady={() => setReady(true)}
            onMountError={() => setScanHint('La camera ne peut pas demarrer sur cet appareil.')}
          />
          <View pointerEvents="none" style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>PLACEZ LE CODE ICI</Text>
            <View style={styles.codeFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.cameraLabel}>
              <Text style={styles.cameraLabelText}>1234 5678 901234</Text>
            </View>
          </View>
        </View>
      )}

      {permission?.granted && (
        <View style={styles.toolbar}>
          <Pressable style={styles.toolButton} onPress={() => setTorch(v => !v)}>
            <Text style={styles.toolText}>{torch ? 'Lampe : ON' : 'Lampe : OFF'}</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => setAutoMode(v => !v)}>
            <Text style={styles.toolText}>{autoMode ? 'Auto : ON' : 'Auto : OFF'}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statusPanel}>
        {busy ? <ActivityIndicator color={colors.green} size="small" /> : <View style={styles.dot} />}
        <Text style={styles.statusText}>{scanHint}</Text>
      </View>

      <View style={styles.connectionPanel}>
        <Text style={styles.connectionTitle}>API OCR (ordinateur)</Text>
        <Text style={styles.connectionText} selectable>{apiUrl || 'Adresse manquante dans .env'}</Text>
        <Text style={styles.connectionHelp}>Le telephone et le PC doivent etre sur le meme reseau Wi-Fi. Un serveur Node.js doit ecouter sur le port 3001.</Text>
      </View>

      <View style={styles.bottom}>
        <ActionButton
          label="Scanner maintenant"
          onPress={() => void scanPhoto(false)}
          disabled={!permission?.granted || !ready || busy}
          loading={busy}
        />
        <ActionButton label="Saisir le code manuellement" onPress={onManual} secondary />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 23, fontWeight: '600', color: colors.ink },
  heading: { flex: 1, marginLeft: 12 },
  headingTop: { fontSize: 10, letterSpacing: 1, fontWeight: '800', color: colors.green },
  headingTitle: { fontSize: 24, fontWeight: '800', color: colors.ink, marginTop: 2 },
  indicator: { width: 18, height: 18, borderRadius: 9, marginRight: 8 },
  instruction: { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: 18 },
  notice: { minHeight: 200, justifyContent: 'center', paddingHorizontal: 10 },
  noticeTitle: { fontSize: 22, color: colors.ink, fontWeight: '800', textAlign: 'center' },
  noticeText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginVertical: 18 },
  cameraOuter: { height: 295, borderRadius: 22, overflow: 'hidden', backgroundColor: '#0B1812' },
  cameraOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  cameraTitle: { textAlign: 'center', fontSize: 10, letterSpacing: 2, color: '#FFFFFF', fontWeight: '900', marginBottom: 22 },
  codeFrame: { height: 110, width: '100%' },
  corner: { width: 28, height: 28, borderColor: '#B3EBAA', position: 'absolute', borderWidth: 0 },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 7 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 7 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 7 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 7 },
  cameraLabel: { alignSelf: 'center', marginTop: 20, borderRadius: 9, backgroundColor: '#183326', paddingVertical: 8, paddingHorizontal: 12 },
  cameraLabelText: { color: '#FFFFFF', fontSize: 14, letterSpacing: 2, fontWeight: '800' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, gap: 10 },
  toolButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, flex: 1, alignItems: 'center' },
  toolText: { fontSize: 12, color: colors.ink, fontWeight: '800' },
  statusPanel: { flexDirection: 'row', minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  statusText: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  connectionPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 13, padding: 13, marginBottom: 15 },
  connectionTitle: { fontSize: 11, color: colors.ink, fontWeight: '800' },
  connectionText: { fontSize: 12, color: colors.green, marginTop: 5 },
  connectionHelp: { fontSize: 11, lineHeight: 16, color: colors.muted, marginTop: 6 },
  bottom: { marginBottom: 8 },
});
