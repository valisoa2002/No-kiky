import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { buildUssd, isValidCode } from './src/core/recharge';
import { openAndroidDialer } from './src/core/dialer';
import { colors } from './src/theme/colors';

const WELCOME_DURATION_MS = 1600;

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [networkId, setNetworkId] = useState(null);
  const [recognizedCode, setRecognizedCode] = useState('');
  const [dialerStatus, setDialerStatus] = useState('idle');
  const [dialerError, setDialerError] = useState('');
  const handoffBusyRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen((current) => current === 'welcome' ? 'home' : current);
    }, WELCOME_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const chooseNetwork = useCallback((id) => {
    setNetworkId(id);
    setRecognizedCode('');
    setDialerStatus('idle');
    setDialerError('');
    setScreen('scan');
  }, []);

  // Important : cet appel intervient directement APRES un OCR avec un unique
  // candidat de 14 chiffres. Il ouvre le composeur, sans executer l'appel.
  const handleCodeScanned = useCallback(async (code) => {
    if (handoffBusyRef.current) return;
    if (!isValidCode(code)) {
      Alert.alert('Code non valide', 'Le scan doit identifier exactement 14 chiffres.');
      return;
    }

    handoffBusyRef.current = true;
    setRecognizedCode(code);
    setDialerStatus('opening');
    setDialerError('');
    // L'ecran de verification reste accessible quand l'utilisateur revient
    // dans No-kiky depuis l'application Telephone.
    setScreen('confirm');

    try {
      await openAndroidDialer(buildUssd(networkId, code));
      setDialerStatus('opened');
    } catch (error) {
      const message = error?.message || 'Impossible d’ouvrir l’application Telephone.';
      setDialerStatus('error');
      setDialerError(message);
      Alert.alert('Composeur indisponible', `${message}\nVous pouvez corriger le code et reessayer ci-dessous.`);
    } finally {
      handoffBusyRef.current = false;
    }
  }, [networkId]);

  const manualCode = useCallback(() => {
    setRecognizedCode('');
    setDialerStatus('idle');
    setDialerError('');
    setScreen('confirm');
  }, []);

  const goBack = useCallback(() => {
    if (screen === 'confirm') setScreen('scan');
    else if (screen === 'scan') setScreen('home');
  }, [screen]);

  const restart = useCallback(() => {
    setRecognizedCode('');
    setNetworkId(null);
    setDialerStatus('idle');
    setDialerError('');
    setScreen('home');
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home' || screen === 'welcome') return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [screen, goBack]);

  return (
    <SafeAreaView style={[styles.root, screen === 'welcome' && styles.welcomeRoot]}>
      <StatusBar
        barStyle={screen === 'welcome' ? 'light-content' : 'dark-content'}
        backgroundColor={screen === 'welcome' ? colors.greenDark : colors.background}
      />
      {screen === 'welcome' && <WelcomeScreen />}
      {screen === 'home' && <HomeScreen onSelect={chooseNetwork} />}
      {screen === 'scan' && (
        <ScanScreen
          networkId={networkId}
          onBack={goBack}
          onCode={handleCodeScanned}
          onManual={manualCode}
        />
      )}
      {screen === 'confirm' && (
        <ConfirmScreen
          networkId={networkId}
          initialCode={recognizedCode}
          dialerStatus={dialerStatus}
          dialerError={dialerError}
          onBack={goBack}
          onRestart={restart}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  welcomeRoot: { backgroundColor: colors.greenDark },
});
