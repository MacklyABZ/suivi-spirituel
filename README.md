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
- Partage via Web Share API / WhatsApp
- PIN local optionnel par profil

## Limite importante

La vraie synchronisation cloud n’est pas activée ici, car elle nécessite un backend ou un service comme Firebase / Supabase avec des clés de configuration. La structure actuelle est prête pour du stockage local solide et pour l’import/export de sauvegardes.

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

