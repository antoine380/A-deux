# À Deux

Application web privée pour Stéphanie et Antoine : parcours, rituel du jour, mode Soirée, jeux à thèmes, envies communes et journal.

- Site statique publié tel quel par Netlify (voir `netlify.toml`). Chaque push sur `main` met le site à jour.
- Les données restent dans le navigateur de chaque téléphone.
- Les deux téléphones se relient par un code de couple (icône en haut à droite) pour jouer ensemble.

## Activer les questions générées par l'IA

Le bouton « Générer de nouvelles questions » (jeu Questions à deux) passe par la fonction `netlify/functions/questions.mjs`, qui appelle l'API Claude. La clé reste côté serveur, elle n'est jamais envoyée aux téléphones.

1. Créez une clé API sur https://console.anthropic.com (rubrique API Keys) et ajoutez quelques euros de crédit. Une génération de 12 questions coûte une fraction de centime.
2. Sur Netlify : Site configuration → Environment variables → ajoutez :
   - `ANTHROPIC_API_KEY` : votre clé API
   - `ADEUX_KEY` : un code d'accès de votre choix (il empêche des inconnus d'utiliser votre crédit)
3. Deploys → Trigger deploy → Deploy site, pour que les variables soient prises en compte.
4. Dans l'app, sur chaque téléphone : Jeux → Questions à deux → « Code d'accès IA », saisissez le même code que `ADEUX_KEY`.

Facultatif : `ADEUX_MODEL` pour choisir un autre modèle (par défaut `claude-haiku-5-5`).
