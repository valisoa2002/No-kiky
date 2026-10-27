# No-kiky — Expo Go + API OCR Node.js

MVP Android React Native **en JavaScript/JSX**, pret pour **Expo Go** : choix Yas/Orange/Airtel, camera, reconnaissance du code de 14 chiffres par un serveur Node.js, verification manuelle et ouverture du composeur Android. Pas de compilation APK, pas d'Android Studio, pas d'ADB.

## Architecture

```text
Telephone Android: Expo Go
       | camera (expo-camera)
       v
 Photo JPEG temporaire
       | POST multipart sur le Wi-Fi local
       v
 PC Windows: Node.js / Express (port 3001)
       | Tesseract.js (OCR, 1 worker)
       v
 14 chiffres reconnus (JSON, sans stocker l'image)
       |
       v
 Expo Go: verification des 14 chiffres
       |
       v
 Composeur Android (confirmation par l'utilisateur)
```

**Important** : les chiffres doivent etre visibles (zone de la carte grattee). La premiere execution de l'API necessite Internet pour recuperer le modele Tesseract; les scans suivants se font localement sur le PC. Le telephone doit pouvoir joindre le PC par Wi-Fi, et la photo transite en HTTP sur le reseau local. Ne publiez pas l'API telle quelle sur Internet : utilisez HTTPS et une authentification en cas de deploiement distant.

## Prerequis

- Node.js **>=22.13** sur le PC, VS Code / terminal.
- Smartphone Android **7+** avec Expo Go compatible SDK 57, et appareil photo.
- **PC et smartphone sur le meme Wi-Fi**, sans isolation client. Autoriser le port 3001 sur le reseau prive dans le pare-feu Windows si demande.
- Pas de VPN qui bloque les connexions LAN.

## 1 — Demarrer le serveur OCR (terminal n°1, a la racine du projet)

```powershell
cd server
npm install
npm start
```

Message attendu : `API OCR No-kiky sur http://0.0.0.0:3001`, puis `OCR initialise. Serveur pret.`. La premiere initialisation telecharge le modele Tesseract; elle peut prendre un peu de temps.

Pour verifier : ouvrez `http://localhost:3001/health` sur le PC, puis `http://IP_DU_PC:3001/health` sur votre smartphone. Le resultat final doit etre `{"status":"ready",...}`. Si `loading`, laissez au processus le temps de preparer le modele ou lisez l'erreur dans le terminal.

**Trouver IP Windows** : ouvrez PowerShell, lancez `ipconfig`, relevez l'adresse `IPv4` de votre connexion Wi-Fi (ex. `192.168.1.25`). **N'utilisez pas `localhost` ni `127.0.0.1` dans la configuration du telephone**.

## 2 — Configurer Expo Go (terminal n°2)

A la racine du projet, **copiez `.env.example` en `.env`** et remplacez l'IP exemple par votre IPv4 reelle :

```powershell
Copy-Item .env.example .env
```

Sous **Git Bash** :

```bash
cp .env.example .env
```

Fichier `.env` :

```ini
EXPO_PUBLIC_OCR_API_URL=http://192.168.1.25:3001
```

L'IP `192.168.1.25` est un **exemple** : utilisez l'IP de votre PC. Les variables `EXPO_PUBLIC_*` sont embarquees dans l'app et **ne doivent jamais contenir de secrets**.

Installez ensuite les dependances :

```powershell
npm install
npx expo install --fix
npm start
```

Ou, pour repartir sans cache : `npm run start:clear`. Dans Expo Go, scannez le QR code du serveur Metro. Si l'application reclame une autre version d'Expo Go, verifiez la compatibilite **SDK 57** de votre application Expo Go Android.

**Si vous avez deja un projet No-kiky SDK 58** : travaillez de preference dans **ce nouveau dossier**. Ne reprenez pas `node_modules`, `package-lock.json`, `android/` ou `ios/` de l'ancien projet. Cette archive ne contient aucune dependance native `rn-mlkit-ocr` ou `expo-dev-client`.

## 3 — Tester

1. Sur le smartphone, dans le navigateur, verifiez `http://IP_DU_PC:3001/health` (`ready`).
2. Ouvrez No-kiky dans **Expo Go** et selectionnez un reseau.
3. Autorisez la camera, placez une carte grattee dans le cadre, appuyez sur **Scanner maintenant**.
4. L'API renvoie une liste de numeros a **14 chiffres exactement**; No-kiky n'accepte automatiquement que **un seul** resultat et ouvre la page de verification.
5. Corrigez manuellement si besoin, puis appuyez sur **Ouvrir le telephone**. La composition n'est jamais declenchee automatiquement.
6. Option : activez **Auto : ON** pour tenter un scan toutes les 5 secondes. Desactive automatiquement en cas d'erreur reseau.

### Commandes operateurs

| Reseau | Commande generee | Remarque                                                                                             |
| ------ | ---------------- | ---------------------------------------------------------------------------------------------------- |
| Yas    | `#321*<CODE>#`   | Commande directe                                                                                     |
| Airtel | `*888*<CODE>#`   | Prefixe fourni par l'utilisateur. Tester la commande complete sur une vraie carte ; secours `*888#`. |
| Orange | `#123#`          | Menu interactif : code copie dans le presse-papiers si disponible, puis saisi dans le menu.          |

**Attention** : certains composeurs n'acceptent pas le pre-remplissage des USSD ou fonctionnent differemment avec une double SIM. Verifiez sur l'appareil cible. Un code a 14 chiffres peut etre mal reconnu : inspectez soigneusement avant de confirmer.

### Tests de logique

```powershell
npm test
cd server
npm test
```

## Depannage

**`Network request failed`** : telephone et PC sur le meme Wi-Fi ? `http://IP_DU_PC:3001/health` accessible sur le telephone ? Pare-feu Windows port 3001 ? Mauvaise IP dans `.env` ? Redemarrez Expo avec `npm run start:clear` apres modification.

**`Adresse OCR non configuree`** : la variable `EXPO_PUBLIC_OCR_API_URL` manque du `.env`. Elle doit commencer par `http://` ou `https://`.

**`OCR indisponible`** : le modele Tesseract n'a pas ete telecharge; verifiez la connexion Internet du PC au premier lancement, puis relancez `npm start` cote serveur.

**`Aucun code detecte`** : photo floue, reflet, carte trop loin, chiffres mal grattes, code coupe sur plusieurs lignes. Activez la torche, rapprochez et recadrez; saisie manuelle disponible.

**`Project is incompatible with this version of Expo Go`** : le SDK de l'application doit correspondre a celui d'Expo Go. Notre archive utilise SDK 57. Ne melangez pas avec l'ancien dossier SDK 58.

**Pare-feu Windows** : autorisez Node.js sur les reseaux **Prives**, ou ajoutez une regle entrante locale pour TCP/3001. Ne desactivez pas le pare-feu globalement.

## Vie privee et limitations

- L'image est envoyee a l'API **sur votre PC en reseau local**; ce n'est donc **pas un OCR hors connexion reseau**. Le traitement Tesseract lui-meme s'effectue localement sur le PC.
- Le serveur utilise une image en memoire, sans ecriture sur disque, et ne journalise ni le code ni le texte OCR. Le modele de langue est telecharge lors de la premiere execution.
- L'image capturee est effacee du cache Expo dans la mesure du possible, meme en cas d'erreur.
- Aucune garantie de reconnaissance a 100 %. La verification visuelle avant la recharge reste obligatoire.
- Pour la production (plusieurs utilisateurs ou des PC distants), ajoutez **HTTPS, authentification, limitation de debit plus robuste**, controle des fichiers et supervision.

## Sources techniques

- Expo Camera SDK 57 : https://docs.expo.dev/versions/v57.0.0/sdk/camera/
- Expo Clipboard SDK 57 : https://docs.expo.dev/versions/v57.0.0/sdk/clipboard/
- Expo Go SDK matching : https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- Expo Linking : https://docs.expo.dev/linking/into-other-apps/
- Tesseract.js : https://github.com/naptha/tesseract.js
