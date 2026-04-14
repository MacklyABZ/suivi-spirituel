# Suivi Spirituel PWA

Application React + Vite + PWA pour le suivi quotidien de la vie spirituelle.

## Ce qui est inclus

- Installation comme vraie PWA sur téléphone
- Icônes d'application + manifest
- Cache hors ligne via service worker
- Écran d’accueil mobile-first
- Journal quotidien complet
- Calcul automatique des chapitres bibliques et pages lues
- Rapport texte prêt à copier et partager
- Génération d’image PNG du rapport avec fond visuel
- Historique local avec stockage propre via LocalForage
- Tableau de bord personnel semaine / mois / global
- Objectifs de croissance
- Gestion multi-profils locale
- Vue responsable locale sur le téléphone
- Export JSON et CSV
- Import JSON pour restaurer une sauvegarde
- Partage d’une sauvegarde JSON
- Sauvegarde Google Drive dans `appDataFolder`
- Restauration depuis Google Drive
- Auto-sauvegarde cloud après enregistrement
- PIN local optionnel par profil

## Lancer le projet

```bash
npm install
npm run dev
```

## Construire la version de production

```bash
npm run build
npm run preview
```

## Déploiement Vercel

- Root Directory: `./`
- Framework Preset: `Vite`
- Build Command: `npm ci && npm run build`
- Output Directory: `dist`

## Fichiers utiles à garder sur GitHub

- `package.json`
- `package-lock.json`
- `.gitignore`
- `.npmrc`
- `vite.config.js`
- `index.html`
- `src/`
- `public/`

Ne pas envoyer `node_modules/`.

## Activer Google Drive

1. Ouvrir Google Cloud Console.
2. Créer un projet.
3. Activer **Google Drive API**.
4. Créer un **OAuth Client ID** de type **Web application**.
5. Ajouter le domaine Vercel de production dans les **Authorized JavaScript origins**.
6. Copier le **Client ID** dans l’onglet **Réglages > Cloud Google Drive** de l’application.
7. Cliquer sur **Se connecter avec Google** puis **Sauvegarder maintenant**.

## Installer sur téléphone

1. Déployer le dossier sur un hébergement HTTPS.
2. Ouvrir l’application depuis Chrome ou Safari mobile.
3. Choisir “Ajouter à l’écran d’accueil”.
4. Après installation, l’application peut fonctionner hors ligne.

## Arborescence

- `src/App.jsx` : logique principale
- `src/styles.css` : styles mobile-first
- `vite.config.js` : configuration PWA
- `public/icons/*` : icônes de l’application
