# PWA Timer Notifications

Une application web progressive (PWA) minimaliste avec un minuteur et des notifications.

## Description

Cette PWA vous permet de créer un minuteur simple, qui continuera de fonctionner même si l'application n'est pas au premier plan ou si l'appareil est en veille. À la fin du compte à rebours, une notification est déclenchée pour alerter l'utilisateur.

## Fonctionnalités

- Interface intuitive et responsive
- Minuteur précis fonctionnant en arrière-plan
- Notifications à la fin du compte à rebours
- Fonctionne hors-ligne
- Installation en tant qu'application sur les appareils compatibles

## Prérequis

- Un serveur web pour héberger l'application (ou un serveur de développement local)
- Un navigateur moderne compatible avec les PWA (Chrome, Firefox, Edge, Safari)

## Installation pour le développement

1. Clonez ce dépôt :

   ```
   git clone https://github.com/Christopher973/PWA_TP6.git
   cd PWA_TP6
   ```

2. Lancez un serveur local pour tester l'application. Par exemple, avec Node.js :

```
   avec l'extension live server
```

3. Ouvrez votre navigateur et accédez à `http://localhost:5500`

## Déploiement

1. Uploadez tous les fichiers vers votre hébergement web
2. Assurez-vous que votre serveur est configuré pour servir les fichiers statiques correctement
3. Si vous utilisez HTTPS (recommandé pour les PWA), vérifiez que votre certificat est valide

## Structure des fichiers

- `index.html` : Structure de base de l'application
- `style.css` : Styles et mise en page responsive
- `app.js` : Logique côté client et communication avec le Service Worker
- `sw.js` : Service Worker pour le cache, les fonctionnalités hors-ligne et les notifications
- `manifest.json` : Configuration de la PWA pour l'installation

## Utilisation

1. Ouvrez l'application dans votre navigateur
2. Définissez le temps souhaité en minutes et secondes
3. Cliquez sur "Démarrer" pour lancer le minuteur
4. Vous pouvez arrêter le minuteur à tout moment avec "Arrêter"
5. Utilisez "Réinitialiser" pour remettre le minuteur à zéro
6. Lors de la première utilisation, autorisez les notifications lorsque demandé

## Installation sur un appareil

Pour installer l'application sur votre appareil (mobile ou desktop) :

1. Ouvrez l'application dans Chrome, Edge ou un autre navigateur compatible
2. Dans le menu du navigateur, sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"
3. Suivez les instructions à l'écran

## Développement et personnalisation

### Modifier le design

Pour personnaliser l'apparence, modifiez le fichier `style.css`.

### Modifier les fonctionnalités du minuteur

La logique principale du minuteur se trouve dans les fichiers :

- `app.js` pour l'interface utilisateur
- `sw.js` pour la logique en arrière-plan

### Modifier les icônes

Remplacez les fichiers dans le dossier `images/` par vos propres icônes, puis mettez à jour le fichier `manifest.json`.

## Compatibilité

L'application a été testée et fonctionne sur :

- Chrome 80+
- Firefox 76+
- Safari 14+
- Edge 80+
