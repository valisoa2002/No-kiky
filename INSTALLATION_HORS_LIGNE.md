# No-kiky v0.4 - correctif OCR entierement hors ligne (Android)

## But

Remplacer exclusivement la partie OCR distante par une reconnaissance locale via `expo-mlkit-ocr` (Google ML Kit Text Recognition v2 avec modele Android **embarque**). Le projet doit deja etre sous **Expo SDK 58**, avec le correctif UX v0.3 applique.

**L'application ne necessite plus aucune connexion Wi-Fi, Internet ni serveur local pour scanner.** La recharge USSD requiert neanmoins un signal cellulaire et une SIM de l'operateur.

## 1. Sauvegarder le projet

Copiez l'integralite de votre dossier No-kiky en dehors du projet courant. Gardez votre `package.json`, `app.json`, `eas.json` et les fichiers d'identite/signature Android actuels.

## 2. Installer le nouveau moteur natif

A la racine de votre projet, sous Git Bash :

```bash
npm uninstall rn-mlkit-ocr
npx expo install expo-mlkit-ocr
```

Ne desinstallez pas `expo-camera` ni `expo-file-system`. Les commandes npm peuvent necessiter une connexion Internet pendant l'installation, une seule fois.

## 3. Ajouter le plugin Expo sans casser le JSON

Dans le tableau `expo.plugins` existant de `app.json`, ajoutez UNIQUEMENT :

```json
["expo-mlkit-ocr", { "iosEngine": "auto" }]
```

Par exemple, si `expo-camera` est deja present :

```json
"plugins": [
  ["expo-camera", { "cameraPermission": "Autoriser No-kiky a scanner les cartes", "recordAudioAndroid": false }],
  ["expo-mlkit-ocr", { "iosEngine": "auto" }]
]
```

**Important :** ce sont les elements du tableau `plugins` qui sont listes ; n'ajoutez pas un objet `android` tout seul comme plugin, sinon `PluginError: unexpected object` reapparaitra.

`expo-build-properties` et `usesCleartextTraffic: true` peuvent etre supprimes **si** aucune autre fonctionnalite ne depend de requetes HTTP locales. La variable `EXPO_PUBLIC_OCR_API_URL` dans `.env` peut etre retiree si elle ne sert qu'a l'ancien OCR. L'ancien serveur `server/` n'a plus besoin d'etre lance.

Le chemin du logo dans `app.json` doit pointer vers votre vrai fichier. Le fichier `EXEMPLE_app.json_NE_PAS_ECRASER.json` est un EXEMPLE : ne remplacez pas votre `app.json` par ce fichier au risque de perdre votre propre configuration.

## 4. Appliquer les deux fichiers JavaScript

Copiez le contenu du patch aux memes chemins dans votre projet :

- `src/core/ocr.js` : nouvelle fonction `readCodesAndDeleteImage` avec `recognizeText(imageUri)` local.
- `src/screens/ScanScreen.jsx` : retire la reference au serveur OCR et indique le traitement hors ligne.

Les autres ecrans, le splash screen JSX, les operateurs et la redirection vers le composeur sont conserves.

Le module est natif : Expo Go ne peut pas executer cette version. Il faut obligatoirement construire une APK Android via EAS Build.

## 5. Verifier la configuration

```bash
npx expo config --full
npx expo-doctor@latest
npm test
```

Si votre repertoire `android/` provient d'un ancien `expo prebuild` sans personnalisation native, sauvegardez-le puis retirez-le avant EAS Build : cela permet a EAS de regenerer les fichiers natifs avec ML Kit (CNG). Si vous avez fait des modifications natives manuelles, ne les supprimez pas sans les reporter : faites plutot une synchronisation controlee.

## 6. Compiler sans Android Studio

Dans le `eas.json` existant, utilisez un profil `preview` avec `distribution: "internal"`, `developmentClient: false` et `android.buildType: "apk"` (voir exemple fourni). Puis :

```bash
eas build --platform android --profile preview
```

EAS Build utilise Internet **uniquement lors de la compilation cloud et du telechargement de l'APK** ; l'application installee n'en a pas besoin pour fonctionner.

Si Android refuse l'installation, recuperer la raison avec ADB portable ou verifier les conflits de signature. Ne pas changer `android.package` sans raison.

## 7. Test de validation hors ligne

1. Installer et ouvrir l'APK une fois.
2. Activer le mode avion temporairement : l'ecran de bienvenue, la camera et l'OCR doivent fonctionner. Ne PAS lancer une recharge en mode avion.
3. Desactiver le mode avion. Couper Wi-Fi et donnees mobiles mais laisser la SIM et le reseau cellulaire actifs.
4. Scanner une carte : un seul code valide de 14 chiffres doit ouvrir le composeur Android. L'utilisateur doit verifier les chiffres et la SIM avant confirmation.
5. Verifier les commandes Yas, Airtel, Orange sur les cartes reelles, y compris la commande Orange `202*CODE` fournie par l'utilisateur, qui reste a confirmer avec l'operateur.

## Remarques de fiabilite et securite

- Google ML Kit dans `expo-mlkit-ocr` utilise la dependance Android `com.google.mlkit:text-recognition:16.0.1` **bundled**, pas la version GMS telechargee au premier lancement.
- Une photo de recharge est sensible : l'image est supprimee du cache apres traitement dans la mesure du possible et non envoyee sur Internet par ce module.
- Les chiffres peuvent etre mal reconnus. On n'execute **pas** d'appel ni de recharge automatiquement : seule l'application Telephone est ouverte pour confirmation.
- Le format `202*CODE` pour Orange est conserve tel quel d'apres votre demande, mais doit etre valide sur une carte reelle.
- La compatibilite de ce module tiers avec **votre** build Expo SDK 58 doit etre confirmee par une compilation EAS et un test sur votre telephone. Ce patch n'est pas un APK deja compile.
