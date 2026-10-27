import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export default function WelcomeScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 620, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.container} accessibilityLabel="Ouverture de No-kiky">
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoFrame}>
          <Image
            source={require('../../assets/no-kiky-icon.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Logo No-kiky"
          />
        </View>
        <Text style={styles.title}>NO-KIKY</Text>
        <Text style={styles.subtitle}>Rechargez en un scan.</Text>
      </Animated.View>
      <View style={styles.bottom}>
        <ActivityIndicator color="#BFE8C6" size="small" />
        <Text style={styles.loading}>PREPARATION DU SCANNER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.greenDark },
  center: { alignItems: 'center', marginBottom: 32 },
  logoFrame: {
    backgroundColor: '#FFFFFF', width: 168, height: 168, borderRadius: 38,
    padding: 7, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#061A12', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 18, elevation: 10,
  },
  logo: { width: 154, height: 154, borderRadius: 31 },
  title: { color: '#FFFFFF', fontSize: 34, letterSpacing: 3.5, fontWeight: '900', marginTop: 28 },
  subtitle: { color: '#D7EFE0', fontSize: 15, marginTop: 8, letterSpacing: 0.2 },
  bottom: { position: 'absolute', bottom: 46, alignItems: 'center', gap: 12 },
  loading: { color: '#BFE8C6', fontWeight: '700', letterSpacing: 2.0, fontSize: 10 },
});
