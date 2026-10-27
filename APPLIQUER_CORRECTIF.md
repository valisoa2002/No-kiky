# No-kiky UX 0.3 — Correctif à appliquer sur votre projet EXISTANT Expo SDK 58

Ce correctif ne contient **pas** `package.json`, `node_modules`, `.env`, `src/core/ocr.js` ni le serveur Node.js : votre installation Expo SDK 58 et votre OCR fonctionnent déjà, donc **ne les modifiez pas**.

## Application du correctif

1. Fermez Metro avec `Ctrl+C` et sauvegardez votre projet (en particulier `App.js`, `ScanScreen.jsx`, `ConfirmScreen.jsx`, `src/core/recharge.js`).
2. Décompressez le ZIP puis copiez **son contenu** directement à la racine du dossier `no-kiky-expo-go` ; acceptez le remplacement des fichiers qui ont le même chemin.
3. Confirmez la présence de :
   - `src/screens/WelcomeScreen.jsx` (nouveau)
   - `assets/no-kiky-icon.png` (logo)
   - `App.js` (nouvelle navigation)
   - `src/core/recharge.js` (commande Orange et opérateurs)
   - `src/screens/ScanScreen.jsx` (ouverture auto)
   - `src/screens/ConfirmScreen.jsx` (secours et retour du téléphone)
   - `src/screens/HomeScreen.jsx` (logo dans l'en-tête)
4. Préservez **votre** `src/core/ocr.js` qui transmet déjà correctement les images à l'API avec `expo/fetch`.
5. Laissez le serveur Node OCR en fonctionnement.
6. Dans Git Bash, depuis le projet :

   ```bash
   npm test
   npx expo start --go -c
   ```

7. Dans Expo Go SDK 58, testez : ouverture -> logo animé environ 1,6 seconde -> Yas/Orange/Airtel -> Scan -> détection exacte de 14 chiffres -> ouverture immédiate du composeur Android. Au retour dans No-kiky, correction manuelle et bouton de relance sont disponibles.

## Codes construits (CODE = 14 chiffres)

- Yas : `#321*CODE#` (officiel)
- Airtel : `*888*CODE#` (indication utilisateur, à vérifier sur une vraie carte)
- Orange : `202*CODE` (exactement le format demandé par l'utilisateur, sans `#` ajouté). La documentation officielle consultée indique plutôt le menu `#123#` ; un bouton de secours copie le code puis ouvre le menu.

## IMPORTANT — sécurité et compatibilité Android

No-kiky ouvre le composeur (`Linking.openURL('tel:...')`), mais **ne passe pas l'appel et n'active pas la recharge sans confirmation humaine**. Vérifiez le code OCR et la carte SIM sur l'écran Téléphone. Le comportement exact du composeur dépend du téléphone : une vérification réelle sur chaque opérateur est nécessaire.

Un unique code de 14 chiffres détecté déclenche le composeur. Un code de 14 chiffres peut malgré tout contenir une erreur OCR ; il n'est pas possible de certifier automatiquement sa validité uniquement à partir de la longueur.

L'écran de bienvenue en JSX fonctionne dans Expo Go. Pour avoir un véritable **splash screen natif avant même le chargement JavaScript** dans une APK, il faudra configurer `expo-splash-screen` lors du build de publication ; Expo Go ne reproduit pas ce comportement natif.

## En cas de conflit avec vos propres modifications

Si vous avez personnellement modifié les fichiers JSX depuis le précédent ZIP, comparez-les d'abord avant de les écraser. Ce correctif est construit à partir de la dernière base No-kiky que nous avons produite et ne voit pas les modifications locales présentes sur votre PC.
