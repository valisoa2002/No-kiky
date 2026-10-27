# No-kiky : lancement express avec Expo Go

**Etape 1 — Terminal VS Code n°1 (API OCR)**

```bash
cd server
npm install
npm start
```

Le modele Tesseract `eng` est recupere au premier lancement. Attendez le message `OCR initialise. Serveur pret.`

**Etape 2 — Adresse IP du PC**

Dans PowerShell, `ipconfig` ; copier l'**Adresse IPv4** du Wi-Fi, par exemple `192.168.1.25`.

Dans le dossier racine du projet, sous **Git Bash** :

```bash
cp .env.example .env
```

Modifier `.env` avec votre IP :

```ini
EXPO_PUBLIC_OCR_API_URL=http://192.168.1.25:3001
```

**Etape 3 — Tester depuis Android**

Avant Expo Go, ouvrez dans le navigateur Android :

```text
http://192.168.1.25:3001/health
```

Il faut voir `"status":"ready"`. Si le navigateur ne se connecte pas, verifiez le meme Wi-Fi et le pare-feu Windows (TCP/3001, reseau prive).

**Etape 4 — Terminal VS Code n°2 (app)**

```bash
npm install
npx expo install --fix
npm start
```

Ouvrez le QR code avec l'app **Expo Go**, puis selectionnez Yas, Orange ou Airtel. Cliquez sur **Scanner maintenant**.

**Ni `adb`, ni `npx expo run:android`, ni EAS Build n'est necessaire.**

**Attention** : code a 14 chiffres, verification obligatoire sur l'ecran avant ouverture de Telephone. Le prefixe Airtel `*888*CODE#` doit etre valide sur une carte reelle.

Source : voir `README.md` pour les details et les tests.
