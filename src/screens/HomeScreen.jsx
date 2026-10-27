import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NETWORKS, OPERATOR_ORDER } from '../core/recharge';
import { colors } from '../theme/colors';

export default function HomeScreen({ onSelect }) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={styles.logo}><Image source={require('../../assets/no-kiky-icon.png')} style={styles.brandLogoImage} resizeMode="contain" /></View>
        <Text style={styles.brand}>no-kiky</Text>
        <View style={styles.pill}><Text style={styles.pillText}>ANDROID</Text></View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>RECHARGE INTELLIGENTE</Text>
        <Text style={styles.heroTitle}>{"Votre cr\u00e9dit,\nen un scan."}</Text>
        <Text style={styles.heroSubtitle}>
          Grattez votre carte, scannez les 14 chiffres et ouvrez le téléphone sans les ressaisir.
        </Text>
        <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Scanner OCR via Wi-Fi  -  Expo Go</Text></View>
      </View>

      <Text style={styles.sectionLabel}>01  CHOISIR VOTRE RESEAU</Text>
      <Text style={styles.sectionHint}>Sélectionnez l'opérateur de votre carte.</Text>

      {OPERATOR_ORDER.map((id) => {
        const network = NETWORKS[id];
        return (
          <Pressable
            key={network.id}
            onPress={() => onSelect(network.id)}
            accessibilityRole="button"
            accessibilityLabel={`Choisir ${network.label}`}
            style={({ pressed }) => [styles.operatorCard, pressed && styles.pressed]}
          >
            <View style={[styles.operatorIcon, { backgroundColor: network.color }]}>
              <Text style={styles.operatorLetter}>{network.letter}</Text>
            </View>
            <View style={styles.operatorInfo}>
              <Text style={styles.operatorName}>{network.label}</Text>
              <Text style={styles.operatorHint}>{network.hint}</Text>
            </View>
            <Text style={styles.arrow}>{'>'}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.footer}>
        No-kiky ne lance jamais une recharge sans votre confirmation dans Android.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 23, paddingTop: 26, paddingBottom: 42 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  brandLogoImage: { width: 38, height: 38, borderRadius: 12 },
  brand: { fontWeight: '900', letterSpacing: -0.8, fontSize: 21, color: colors.ink },
  pill: { marginLeft: 'auto', backgroundColor: colors.mint, borderRadius: 24, paddingHorizontal: 11, paddingVertical: 7 },
  pillText: { color: colors.green, fontSize: 10, letterSpacing: 1, fontWeight: '800' },
  hero: { backgroundColor: colors.greenDark, borderRadius: 24, padding: 24, marginBottom: 28 },
  heroLabel: { color: '#9EDAB6', letterSpacing: 1.8, fontSize: 10, fontWeight: '800', marginBottom: 14 },
  heroTitle: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -1.4, lineHeight: 43 },
  heroSubtitle: { color: '#D2E9DA', fontSize: 14, lineHeight: 21, marginTop: 15 },
  heroBadge: { backgroundColor: '#27553E', alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, marginTop: 21 },
  heroBadgeText: { color: '#D7F6E3', fontWeight: '700', fontSize: 12 },
  sectionLabel: { color: colors.green, letterSpacing: 1.1, fontWeight: '900', fontSize: 11 },
  sectionHint: { color: colors.muted, fontSize: 14, marginTop: 7, marginBottom: 15 },
  operatorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 17, padding: 14, marginBottom: 11,
  },
  pressed: { opacity: 0.7 },
  operatorIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  operatorLetter: { fontSize: 23, fontWeight: '900', color: '#FFFFFF' },
  operatorInfo: { flex: 1, marginLeft: 14 },
  operatorName: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  operatorHint: { color: colors.muted, fontSize: 12, marginTop: 3 },
  arrow: { color: colors.muted, fontSize: 22, fontWeight: '300', paddingHorizontal: 6 },
  footer: { color: colors.muted, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 16 },
});
