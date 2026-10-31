# À Deux

Application web privée pour Stéphanie et Antoine : parcours, rituel du jour, mode Soirée, jeux à thèmes, quiz du jour, souvenirs photo, musique, défis de couple, envies communes et journal.

## Organisation

- `public/` : l'application (publiée telle quelle par Netlify, voir `netlify.toml`).
- `netlify/functions/` : les petits services côté serveur.
  - `push.mjs` : abonnement aux notifications (aucune configuration : les clés sont créées automatiquement).
  - `box.mjs` : boîte aux lettres chiffrée pour les envois entre vos deux téléphones (photos, musique, réponses au quiz…). Le serveur ne voit qu'un contenu illisible.
  - `cron.mjs` : tourne toutes les heures. À 7 h (heure de Paris), notification du rendez-vous du matin ; à 17 h, rappel si le quiz n'est pas fait.
  - `questions.mjs` : génération de nouvelles questions par l'IA (jeux et quiz).
- Chaque push sur `main` met le site à jour.

## Relier les deux téléphones

Icône des deux téléphones en haut à droite → choisir son prénom → « Créer un code » → « Envoyer le lien à l'autre ». En ouvrant le lien, l'autre téléphone se relie tout seul.

## Notifications

Sur chaque téléphone : ouvrir l'app installée (sur iPhone : Safari → Partager → « Sur l'écran d'accueil », puis ouvrir depuis l'icône), aller dans Quiz du jour ou Programme de la semaine, puis « Activer les notifications ».

## Activer l'IA (facultatif)

Nécessaire pour générer de nouvelles questions de jeu, et pour que le quiz continue sans répétition au-delà des 300 questions intégrées.

1. Créez une clé API sur https://console.anthropic.com (rubrique API Keys) et ajoutez quelques euros de crédit.
2. Sur Netlify : Site configuration → Environment variables → ajoutez :
   - `ANTHROPIC_API_KEY` : votre clé API
   - `ADEUX_KEY` : un code d'accès de votre choix
3. Deploys → Trigger deploy → Deploy site.
4. Dans l'app, sur chaque téléphone : Jeux → Questions à deux → « Code d'accès IA », saisissez le même code.

Facultatif : `ADEUX_MODEL` (questions de jeu, par défaut `claude-haiku-5-5`) et `ADEUX_QUIZ_MODEL` (quiz, par défaut `claude-sonnet-5-5`).
