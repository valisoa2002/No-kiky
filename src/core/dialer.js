import { Linking, Platform } from 'react-native';
import { toPhoneUrl } from './recharge';

export async function openAndroidDialer(ussd) {
  if (Platform.OS !== 'android') {
    throw new Error('Cette version de No-kiky est destinee a Android.');
  }
  // Linking a tel: URI opens the dialer, not a silent USSD execution.
  await Linking.openURL(toPhoneUrl(ussd));
}
