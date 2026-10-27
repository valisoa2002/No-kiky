// Reconnaissance OCR totalement locale via Google ML Kit (modele Latin embarque).
// Cette implementation fonctionne uniquement dans une APK native Expo/EAS
// contenant le module expo-mlkit-ocr : elle ne fonctionne PAS dans Expo Go.
import { File } from 'expo-file-system';
import { recognizeText, isSupported } from 'expo-mlkit-ocr';
import { extractCodeCandidates } from './recharge';

export async function readCodesAndDeleteImage(imageUri) {
  if (!imageUri) throw new Error('La photo de la carte est manquante.');

  try {
    if (!isSupported()) {
      throw new Error("La reconnaissance locale n'est pas prise en charge sur cet appareil.");
    }

    // ML Kit s'execute sur le smartphone ; aucun fetch, URL ou serveur externe.
    const result = await recognizeText(imageUri);
    return extractCodeCandidates(result?.text ?? '');
  } catch (error) {
    throw new Error(error?.message || 'Echec de la lecture OCR locale.');
  } finally {
    // Ne conserver ni image ni code de recharge dans le stockage permanent.
    try {
      const image = new File(imageUri);
      if (image.exists) image.delete();
    } catch (_) {
      // Le cache Android sera nettoye par le systeme si cette suppression echoue.
    }
  }
}
