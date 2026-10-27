import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { extractCodeCandidates } from "./recharge";

const DEFAULT_TIMEOUT_MS = 25000;
const EXPO_API_URL = process.env.EXPO_PUBLIC_OCR_API_URL;

export function getOcrApiUrl() {
  return String(EXPO_API_URL || "")
    .trim()
    .replace(/\/+$/, "");
}

function apiErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "Le serveur OCR met trop de temps a repondre. Reessayez.";
  }
  if (String(error?.message || "").includes("Network request failed")) {
    return "Impossible de joindre le serveur OCR. Verifiez que le PC et le telephone sont sur le meme Wi-Fi et que le port 3001 est accessible.";
  }
  return error?.message || "Echec de la reconnaissance OCR.";
}

async function recognizeFromServer(imageUri, apiUrl, timeoutMs) {
  if (!/^https?:\/\//i.test(apiUrl)) {
    throw new Error(
      "Adresse OCR non configuree. Ajoutez EXPO_PUBLIC_OCR_API_URL dans .env avec l'adresse IP de votre PC.",
    );
  }

  // Expo SDK 58 : expo/fetch attend un objet File/Blob natif,
  // et non l'ancien objet React Native { uri, name, type }.
  const photo = new File(imageUri);
  if (!photo.exists) {
    throw new Error("La photo capturee est introuvable. Reessayez le scan.");
  }
  const image = new FormData();
  image.append("image", photo); // Le champ doit rester 'image' (Multer).

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await expoFetch(`${apiUrl}/api/ocr`, {
      method: "POST",
      body: image,
      signal: controller.signal,
      // Laisser fetch choisir le Content-Type multipart/form-data avec boundary.
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `Erreur OCR HTTP ${response.status}`);
    }
    if (!payload || !Array.isArray(payload.codes)) {
      throw new Error("Reponse OCR invalide du serveur.");
    }

    // Validation defensive : ne jamais accepter une chaine tronquee/modifiee.
    return [
      ...new Set(
        payload.codes.flatMap((code) => extractCodeCandidates(String(code))),
      ),
    ];
  } catch (error) {
    throw new Error(apiErrorMessage(error));
  } finally {
    clearTimeout(timeout);
  }
}

export async function readCodesAndDeleteImage(imageUri, options = {}) {
  try {
    return await recognizeFromServer(
      imageUri,
      options.apiUrl || getOcrApiUrl(),
      options.timeoutMs || DEFAULT_TIMEOUT_MS,
    );
  } finally {
    // Pas de sauvegarde definitive de la photo dans l'app.
    try {
      const file = new File(imageUri);
      if (file.exists) file.delete();
    } catch (_) {
      // Android effacera le cache si le nettoyage immediat echoue.
    }
  }
}
