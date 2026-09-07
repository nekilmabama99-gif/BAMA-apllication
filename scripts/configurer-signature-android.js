// Insère la configuration de signature "release" dans android/app/build.gradle, ET incrémente
// automatiquement le versionCode (obligatoire pour qu'Android accepte une mise à jour par-dessus
// une version déjà installée — sans ça, chaque nouvel APK resterait bloqué à versionCode 1 et les
// écoles clientes devraient désinstaller l'ancienne version avant chaque mise à jour).
// Ce fichier est régénéré à chaque `npx cap add android`, donc on ne peut pas le modifier
// une fois pour toutes dans le dépôt : ce script le corrige automatiquement à chaque build,
// juste après `cap add android` et avant `./gradlew assembleRelease`.
const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let contenu = fs.readFileSync(gradlePath, 'utf8');

// --- Version (versionCode / versionName) ---------------------------------------------------
// ANDROID_VERSION_CODE : entier unique et croissant (le numéro de build GitHub Actions convient
// parfaitement — il n'est jamais réutilisé). ANDROID_VERSION_NAME : le numéro affiché à l'utilisateur
// (ex. "1.2.0"), sans lien technique avec Android — purement pour l'humain.
const versionCode = process.env.ANDROID_VERSION_CODE;
const versionName = process.env.ANDROID_VERSION_NAME;
if (versionCode) {
  if (!/versionCode\s+\d+/.test(contenu)) {
    console.error('ERREUR : "versionCode" introuvable dans build.gradle — version non mise à jour.');
    process.exit(1);
  }
  contenu = contenu.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  console.log(`versionCode fixé à ${versionCode}.`);
}
if (versionName) {
  if (!/versionName\s+"[^"]*"/.test(contenu)) {
    console.error('ERREUR : "versionName" introuvable dans build.gradle — version non mise à jour.');
    process.exit(1);
  }
  contenu = contenu.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
  console.log(`versionName fixé à "${versionName}".`);
}

// --- Signature release -----------------------------------------------------------------------
if (contenu.includes('keystoreProperties')) {
  console.log('Signature déjà configurée dans build.gradle, rien à faire pour la signature.');
  fs.writeFileSync(gradlePath, contenu);
  process.exit(0);
}

// 1) Lecture de keystore.properties (généré par le workflow à partir des secrets GitHub)
const enTete = `def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;
if (!contenu.includes('android {')) {
  console.error('ERREUR : marqueur "android {" introuvable dans build.gradle — signature non configurée.');
  process.exit(1);
}
contenu = enTete + contenu;

// 2) Rattache signingConfigs.release au buildType "release" — AVANT d'insérer le bloc
// signingConfigs (qui contient lui aussi le texte "release {"), sinon ce remplacement risque de
// s'appliquer au mauvais bloc.
const marqueurRelease = /release\s*\{/;
if (!marqueurRelease.test(contenu)) {
  console.error('ERREUR : bloc "release {" introuvable dans buildTypes — signature non configurée.');
  process.exit(1);
}
contenu = contenu.replace(marqueurRelease, 'release {\n            signingConfig signingConfigs.release');

// 3) Bloc signingConfigs, juste après l'ouverture de "android {"
const signingConfigsBloc = `android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile rootProject.file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
`;
contenu = contenu.replace('android {', signingConfigsBloc);

fs.writeFileSync(gradlePath, contenu);
console.log('build.gradle : configuration de signature release insérée avec succès.');
