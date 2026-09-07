// Insère la configuration de signature "release" dans android/app/build.gradle.
// Ce fichier est régénéré à chaque `npx cap add android`, donc on ne peut pas le modifier
// une fois pour toutes dans le dépôt : ce script le corrige automatiquement à chaque build,
// juste après `cap add android` et avant `./gradlew assembleRelease`.
const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let contenu = fs.readFileSync(gradlePath, 'utf8');

if (contenu.includes('keystoreProperties')) {
  console.log('Signature déjà configurée dans build.gradle, rien à faire.');
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
