# Site vitrine Gabriel Sebban — mise en ligne

Ce dossier est la version **prête à publier** du site (fichiers structurés pour
Google, polices séparées, robots.txt et sitemap.xml inclus).

## Ce qu'il reste à faire avant la mise en ligne

1. **Choisir et acheter le nom de domaine** (.fr recommandé, ~8 €/an chez OVH ou Gandi).
2. **Remplacer `VOTRE-DOMAINE.fr`** dans 3 fichiers : `index.html`, `robots.txt`, `sitemap.xml`
   (une recherche-remplacement suffit — ou demande à Claude).
3. **Compléter les pages légales** (`mentions-legales.html`, `conditions-essai.html`) :
   SIRET, adresse, nom de l'hébergeur — puis retirer le bandeau « Brouillon ».
4. **Activer le formulaire** : au tout premier envoi, FormSubmit envoie un e-mail de
   confirmation à gabrielsebban3@gmail.com — cliquer le lien, une seule fois.

## Publier sur GitHub Pages (gratuit)

1. Créer un dépôt GitHub dédié (par exemple `site-vitrine`), y mettre le contenu de ce dossier.
2. Dans le dépôt : Settings → Pages → Source : branche `main`, dossier `/ (root)` → Save.
3. Le site est en ligne en ~2 minutes sur `https://<compte>.github.io/<dépôt>/`.
4. Brancher le domaine : Settings → Pages → Custom domain → `votre-domaine.fr`,
   puis chez le registrar (OVH/Gandi) ajouter les enregistrements DNS indiqués par GitHub.
   Cocher « Enforce HTTPS » une fois le domaine vérifié.

## Après la mise en ligne

- Créer la **fiche Google Business Profile** (gratuit) : « Gabriel Sebban — création
  de sites internet pour artisans », zone Paris, téléphone, lien vers le site.
- Déclarer le site dans **Google Search Console** et y envoyer `sitemap.xml`.
- Tester l'aperçu du lien dans WhatsApp (image + titre) : il doit afficher `img/og.jpg`.

## Différences avec la version démo (claude.ai)

- `index.html` a ici un vrai en-tête HTML (`<head>`, `lang="fr"`, canonical, Open Graph
  absolu) — la version claude.ai est enveloppée par la plateforme et n'en a pas besoin.
- `robots.txt` exclut `/demos/` de Google (ce sont des entreprises fictives,
  on ne veut pas qu'elles sortent dans les résultats de recherche).
