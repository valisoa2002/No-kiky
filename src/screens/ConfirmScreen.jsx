import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ActionButton from '../components/ActionButton';
import { buildUssd, isValidCode, NETWORKS, sanitizeCode } from '../core/recharge';
import { openAndroidDialer } from '../core/dialer';
import { colors } from '../theme/colors';

export default function ConfirmScreen({ networkId, initialCode, dialerStatus = 'idle', dialerError = '', onBack, onRestart }) {
  const network = NETWORKS[networkId];
  const [code, setCode] = useState(initialCode || '');
  const [busy, setBusy] = useState(false);
  const valid = isValidCode(code);
  const command = valid ? buildUssd(networkId, code) : '';

  useEffect(() => setCode(initialCode || ''), [initialCode, networkId]);

  async function openCommand(ussd, copyCode = false) {
    if (busy) return;
    setBusy(true);
    try {
      if (copyCode) {
        await Clipboard.setStringAsync(code, { android: { isSensitive: true } });
      }
      await openAndroidDialer(ussd);
    } catch (_error) {
      Alert.alert(
        'Impossible d\u2019ouvrir le telephone',
        'Verifiez qu\u2019une application Telephone est installee et reessayez.',
      );
    } finally {
      setBusy(false);
    }
  }

  function handleRecharge() {
    if (!valid || busy) return;
    // Le bouton reste disponible pour re-ouvrir le composeur apres le scan,
    // ou pour envoyer un code corrige ou saisi a la main.
    void openCommand(command);
  }

  function handleOrangeMenuFallback() {
    if (!valid || busy) return;
    // #123# est le menu officiel Orange; son parcours est interactif.
    void openCommand('#123#', true);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityLabel="Retour au scan" style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>03  VERIFIER / REESSAYER</Text>
      </View>

      <View style={styles.hero}>
        <View style={[styles.operatorIcon, { backgroundColor: network.color }]}>
          <Text style={styles.operatorLetter}>{network.letter}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>OPERATEUR SELECTIONNE</Text>
          <Text style={styles.heroTitle}>{network.label}</Text>
        </View>
      </View>

      {dialerStatus === 'opened' && (
        <View style={styles.statusSuccess}>
          <Text style={styles.statusSuccessTitle}>Composeur ouvert automatiquement</Text>
          <Text style={styles.statusSuccessText}>Vérifiez le code et la SIM dans le téléphone, puis confirmez la recharge. Le résultat de l'opération n'est pas connu par No-kiky.</Text>
        </View>
      )}
      {dialerStatus === 'error' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Ouverture automatique indisponible</Text>
          <Text style={styles.warningText}>{dialerError || 'Corrigez le code puis essayez de nouveau.'}</Text>
        </View>
      )}
      <Text style={styles.fieldTitle}>Code de recharge</Text>
      <Text style={styles.fieldHint}>Corrigez les chiffres si la lecture OCR est incorrecte.</Text>
      <TextInput
        style={[styles.input, valid ? styles.inputValid : null]}
        value={code}
        onChangeText={(value) => setCode(sanitizeCode(value))}
        placeholder="14 chiffres"
        keyboardType="number-pad"
        maxLength={30}
        selectTextOnFocus
        accessibilityLabel="Code de recharge a 14 chiffres"
      />
      <Text style={[styles.validation, valid ? styles.validationOk : null]}>
        {valid ? '14 chiffres valides en longueur' : `${code.length}/14 chiffres`}
      </Text>

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>COMMANDE PREPAREE</Text>
        <Text selectable style={styles.previewCommand}>{valid ? command : '---'}</Text>
        <Text style={styles.previewHint}>
          {networkId === 'orange'
            ? 'Format 202*CODE fourni pour les tests. Si le composeur refuse la commande, utilisez le menu officiel #123#.'
            : 'Vérifiez le code et choisissez la SIM avant la confirmation.'}
        </Text>
      </View>

      {(networkId === 'airtel' || networkId === 'orange') && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Commande directe à tester sur votre SIM</Text>
          <Text style={styles.warningText}>
            {networkId === 'orange'
              ? 'Orange : 202*CODE est le format que vous avez fourni. La procédure officielle documentée utilise le menu #123#.'
              : 'Airtel : *888*CODE# utilise votre préfixe. En cas de refus, utilisez le menu *888#.'}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <ActionButton
          label={dialerStatus === 'opened' ? 'Rouvrir le téléphone' : 'Ouvrir le téléphone'}
          onPress={handleRecharge}
          disabled={!valid}
          loading={busy}
        />
        {networkId === 'orange' && (
          <ActionButton
            secondary
            label="Copier le code et ouvrir le menu #123#"
            onPress={handleOrangeMenuFallback}
            disabled={!valid || busy}
          />
        )}
        {networkId === 'airtel' && (
          <ActionButton
            secondary
            label="Ouvrir plutot le menu *888#"
            onPress={() => void openCommand('*888#')}
            disabled={!valid || busy}
          />
        )}
        <ActionButton label="Scanner une autre carte" onPress={onRestart} secondary />
        <Text style={styles.disclaimer}>
          No-kiky ne connait pas le resultat de la recharge. Verifiez le message de confirmation envoye par votre operateur.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statusSuccess: { backgroundColor: colors.mint, borderRadius: 14, padding: 15, marginBottom: 18 },
  statusSuccessTitle: { color: colors.green, fontSize: 14, fontWeight: '800' },
  statusSuccessText: { color: colors.ink, fontSize: 12, lineHeight: 19, marginTop: 6 },
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 46 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { backgroundColor: colors.surface, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 23, fontWeight: '600', color: colors.ink },
  headerTitle: { color: colors.green, marginLeft: 16, fontSize: 12, letterSpacing: 1.3, fontWeight: '900' },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 28 },
  operatorIcon: { width: 53, height: 53, alignItems: 'center', justifyContent: 'center', borderRadius: 15, marginRight: 14 },
  operatorLetter: { color: '#FFFFFF', fontWeight: '900', fontSize: 26 },
  heroEyebrow: { fontSize: 10, color: colors.muted, letterSpacing: 1.1, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: 4 },
  fieldTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  fieldHint: { fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 5, marginBottom: 13 },
  input: { backgroundColor: colors.surface, borderRadius: 15, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 17, fontSize: 21, letterSpacing: 1.1, fontWeight: '800', color: colors.ink },
  inputValid: { borderColor: colors.green },
  validation: { textAlign: 'right', marginTop: 9, color: colors.muted, fontSize: 12 },
  validationOk: { color: colors.green },
  previewCard: { backgroundColor: colors.greenDark, borderRadius: 18, padding: 19, marginTop: 28 },
  previewLabel: { color: '#97CDB0', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  previewCommand: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: 12 },
  previewHint: { color: '#D5EADD', lineHeight: 18, fontSize: 12, marginTop: 12 },
  warningCard: { backgroundColor: colors.warningBg, padding: 15, borderRadius: 13, marginTop: 16 },
  warningTitle: { color: colors.warning, fontWeight: '800', fontSize: 13 },
  warningText: { color: colors.warning, fontSize: 12, lineHeight: 19, marginTop: 6 },
  actions: { marginTop: 20 },
  disclaimer: { fontSize: 11, color: colors.muted, lineHeight: 17, textAlign: 'center', marginTop: 15 },
});
