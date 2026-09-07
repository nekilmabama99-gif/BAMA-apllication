# Gestion Établissement — version Android (100% hors-ligne)

## Principe

Comme pour la version Windows/Mac/Linux (Electron), l'app Android embarque
directement `www/index.html` — aucune donnée n'est chargée depuis internet
au démarrage ni pendant l'usage. Une fois l'APK installé sur le téléphone
ou la tablette, plus aucune connexion n'est nécessaire, jamais.

**Il n'y a rien à faire sur Play Store** : cette app se distribue en
"sideload" — l'APK se copie et s'installe directement (clé USB, Bluetooth,
carte SD...), comme n'importe quel fichier.

## Option A — La plus simple : laisser GitHub compiler l'APK pour toi

1. Créer un dépôt GitHub (gratuit) et y pousser ce dossier
   (`capacitor-app/`).
2. **Configurer la signature une seule fois** (voir section "Signature de
   l'application" plus bas) — sans ça, la compilation échouera volontairement
   plutôt que de produire un APK non signé.
3. Le fichier `.github/workflows/build-android.yml` inclus se déclenche
   automatiquement à chaque `git push` et compile l'APK sur les machines de
   GitHub — tu n'as besoin ni d'Android Studio ni du SDK Android sur ton
   propre ordinateur.
4. Une fois le build terminé (onglet "Actions" du dépôt), télécharger
   l'APK depuis les "Artifacts".

## Signature de l'application (IMPORTANT — à faire une seule fois)

Comme pour Windows/Mac, un APK doit être signé pour être installable
proprement. Une clé de signature Android t'a été fournie séparément
(`gestion-etablissement-release.keystore`) — **garde ce fichier et son mot
de passe en lieu sûr** (ex. gestionnaire de mots de passe, clé USB à part) :
si tu le perds, tu ne pourras plus jamais publier de mise à jour signée de
la même façon, et tes utilisateurs devront désinstaller l'ancienne version
avant d'installer la nouvelle.

Dans le dépôt GitHub → **Settings → Secrets and variables → Actions → New
repository secret**, crée ces 4 secrets :

| Nom du secret | Valeur |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Le contenu du fichier `.keystore` encodé en base64 (fourni à part) |
| `ANDROID_KEYSTORE_PASSWORD` | Le mot de passe du keystore (fourni à part) |
| `ANDROID_KEY_ALIAS` | `gestionetablissement` |
| `ANDROID_KEY_PASSWORD` | Le mot de passe de la clé (fourni à part) |

⚠️ **Important si tu regénères un jour cette clé toi-même** : avec le format de
keystore moderne (PKCS12, celui par défaut depuis Java récent), le mot de
passe du keystore et le mot de passe de la clé doivent être **identiques**
— sinon la signature échoue avec une erreur de déchiffrement, même si les
mots de passe sont individuellement corrects. `ANDROID_KEYSTORE_PASSWORD`
et `ANDROID_KEY_PASSWORD` doivent donc toujours contenir la même valeur.

Une fois ces 4 secrets enregistrés, chaque `git push` compile automatiquement
un APK signé avec ta propre clé (et non plus la clé de test générique
d'Android) — plus professionnel, et moins susceptible d'être signalé par
Android/Play Protect à l'installation.

## Option B — Compiler toi-même, en local

Nécessite [Node.js](https://nodejs.org), un JDK 17, et le SDK Android
(le plus simple : installer [Android Studio](https://developer.android.com/studio),
qui installe tout automatiquement). Place aussi le fichier
`gestion-etablissement-release.keystore` à la racine du dossier `android/`
(créé par `npx cap add android`) et un fichier `android/keystore.properties`
avec ce contenu :

```
storeFile=gestion-etablissement-release.keystore
storePassword=<le mot de passe du keystore>
keyAlias=gestionetablissement
keyPassword=<le mot de passe de la clé>
```

```
npm install
npx cap add android
npx cap sync android
node scripts/configurer-signature-android.js
cd android
./gradlew assembleRelease
```

L'APK signé se trouve ensuite dans
`android/app/build/outputs/apk/release/app-release.apk`.

## Installer l'APK sur un téléphone/tablette (aucune connexion nécessaire)

1. Copier le fichier `.apk` sur l'appareil (clé USB/câble, carte SD...).
2. Sur l'appareil : Paramètres → Sécurité → autoriser
   "Installation d'apps provenant de sources inconnues" (le nom exact varie
   selon la version d'Android — l'appareil le proposera automatiquement au
   moment d'ouvrir le fichier `.apk`).
3. Ouvrir le fichier `.apk` depuis un gestionnaire de fichiers → Installer.

## Une remarque sur le stockage des données

L'app utilise `localStorage`, comme sur ordinateur — les données restent
sur l'appareil, propres à cette installation. Pense à utiliser la fonction
de sauvegarde/export déjà présente dans l'app (`exportBackup`) si tu veux
transférer les données d'un appareil à un autre, ou en garder une copie de
sécurité.

## Mettre à jour l'application plus tard

Remplace `www/index.html` par la nouvelle version, puis relance la
compilation (Option A ou B). Un utilisateur peut réinstaller le nouvel APK
par-dessus l'ancien sans perdre ses données, tant que le nom de package
(`appId` dans `capacitor.config.json`) ne change pas.

## Licence du logiciel

Cette version embarque le système de licence par clé publique/privée déjà
en place dans `index.html`. Utilise `generateur-licences.html` (fourni à
part, à garder chez toi) pour produire les clés de licence.

**Important pour Android** : le verrouillage d'une licence à un poste précis
(ajouté récemment côté Windows/Mac/Linux) repose sur un identifiant que seule
la version Electron sait lire. Dans l'app Android, cet identifiant n'existe
pas — laisse donc toujours le champ "Identifiant machine" **vide** dans
`generateur-licences.html` pour toute licence destinée à un téléphone ou une
tablette, sinon l'activation échouera systématiquement.
