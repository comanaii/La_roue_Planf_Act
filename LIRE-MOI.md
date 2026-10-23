# La roue de la Planif — version initiale

## Installation dans le dépôt existant
1. Décompresser l’archive.
2. Ajouter le dossier `roue-planif` à la racine du dépôt `comanaii/game_pass_angie`, sans remplacer les autres sites.
3. Activer ou réactiver GitHub Pages dans Settings > Pages en sélectionnant la branche et le dossier contenant les sites. Si le dépôt utilise déjà une action de déploiement, conserver sa configuration et y inclure ce dossier.
4. Ouvrir le chemin `/roue-planif/` depuis l’adresse GitHub Pages indiquée par GitHub.

Aucune compilation ni installation. Ouvrir via un serveur web, par exemple GitHub Pages, pour que le chargement du script d’aide fonctionne.

## Google Sheets
1. Se connecter à Google avec planifact@gmail.com.
2. Créer un Google Sheet vide. Extensions > Apps Script.
3. Remplacer le code par le contenu de `apps-script/Code.gs`.
4. Enregistrer et exécuter `initialiser` une fois. Autoriser les accès nécessaires au classeur.
5. Déployer > Nouveau déploiement > Application Web. Exécuter en tant que soi-même ; accès Tout le monde.
6. Copier l’adresse terminée par `/exec` dans `GOOGLE_SCRIPT_URL` de `config.js`.
7. Remettre `config.js` sur GitHub. Tous les collègues utilisent alors la même configuration.
8. Tester un tirage et vérifier sa présence dans l’onglet Tirages du Google Sheet.

Le raccordement Google n’a pas été activé ou testé avec un compte réel. Si une erreur de synchronisation survient, elle est affichée et aucun succès n’est annoncé.
Les essais faits en mode local ne sont pas importés automatiquement dans Google Sheets.

## Fonctionnement et limites
- 17 profils, 18 défis, un tirage par prénom et par jour (heure de Paris).
- Défi accompli ou joker. Historique des tirages.
- Sans URL Google : données uniquement dans le navigateur.
- Avec Google : historique et unicité du tirage gérés par Apps Script avec verrou.
- Le choix du prénom n’est PAS une authentification : chacun peut choisir un autre prénom et agir sur son défi.
- La version fournie ne satisfait donc pas encore une restriction d’accès sécurisée aux 17 personnes.
- GitHub Pages peut être public. L’adresse Apps Script est visible dans le code et permet de lire ou d’ajouter les données. N’y conserver aucune donnée sensible.
- Le catalogue des défis est dans `app.js`, variable `challenges`. Les catégories doivent rester exactement Mission du jour / Petit gage / Mot interdit.
- Version de départ : les textes des défis seront retravaillés avec Yann.

## Fichiers
index.html : page ; styles.css : présentation ; app.js : jeu ; config.js : raccordement commun ; apps-script/Code.gs : service Google Sheets.
JavaScript est le langage utilisé pour le site (pas Java).
