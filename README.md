# Marketing Succès — msmaroc.com

Site statique (HTML/CSS/JS sans build) hébergé sur **Cloudflare Pages**, avec 3 petites fonctions (Pages Functions) pour l'espace client.

## Structure
| Fichier | Rôle |
|---|---|
| `index.html` | Accueil (hero, 3 offres, Maroc, méthode, réalisations, histoire, FAQ, CTA final) |
| `devis.html` | Simulateur de devis (CTA principal de tout le site) |
| `espace-client.html` | Connexion par code puis cahier des charges (noindex) |
| `mentions-legales.html`, `confidentialite.html`, `404.html` | Pages annexes |
| `css/site.css` | Design system : tokens (couleurs, typo, espacements) + composants |
| `css/forms.css` | Style des formulaires (scopé sous `.msf`) |
| `js/config.js` | **Configuration unique** : numéro WhatsApp, e-mail, IDs GA4 / Meta Pixel |
| `js/track.js` | Événements : `whatsapp_click`, `quote_start`, `quote_sent`, `brief_start`, `brief_sent` |
| `js/form-engine.js` | Moteur partagé des deux formulaires |
| `js/forms/devis-config.js` | Questions du simulateur |
| `functions/api/*.js`, `functions/_private/*` | Espace client (login, session, contenu protégé), jamais publiés comme fichiers statiques |
| `_headers` | En-têtes HTTP (sécurité, cache, noindex) |
| `.deployignore`, `scripts/build.sh` | Copie des fichiers publiables dans `dist/` |
| `wrangler.toml` | Configuration Cloudflare Pages |

## Changer le numéro WhatsApp / l'e-mail
1. `js/config.js` (formulaires et suivi).
2. Les liens `wa.me/…` et `tel:` écrits en dur dans les `.html` : rechercher l'ancien numéro et le remplacer partout (`grep -rn 212607284660 --include=*.html .`).

## Activer le suivi
Renseigner `ga4` et/ou `metaPixel` dans `js/config.js`. Un bandeau de consentement apparaît alors automatiquement ; rien n'est chargé tant que le visiteur n'accepte pas.

## Déployer
Cloudflare Pages, projet `marketing-success`, connecté au dépôt Git :
- Commande de build : `sh scripts/build.sh`
- Répertoire de sortie : `dist`
Déploiement manuel possible : `sh scripts/build.sh && npx wrangler pages deploy`.

Tester en local : créer `.dev.vars` (ignoré par git) avec `SESSION_SECRET`, `CLIENT_CODES` et `MS_DEV=1`, puis `sh scripts/build.sh && npx wrangler pages dev`.

## Espace client : variables d'environnement (Cloudflare → Pages → Settings → Variables and Secrets)
| Variable | Valeur |
|---|---|
| `SESSION_SECRET` | longue chaîne aléatoire (≥ 32 caractères), p. ex. `openssl rand -base64 48` (type « Secret ») |
| `CLIENT_CODES` | un client par entrée `CODE:Nom du client`, séparées par `,` `;` ou un saut de ligne (type « Secret ») |

Exemple : `q8Fm3ZkT7xWc:Boutique Argan,Rb4NsE9yLp2H:Riad Atlas`

### Créer un code d'accès pour un nouveau client
1. Générer un code **aléatoire d'au moins 10 caractères** (les codes plus courts sont ignorés), par exemple `openssl rand -base64 9 | tr -d '/+='`.
2. Ajouter `CODE:Nom du client` à `CLIENT_CODES` dans Cloudflare, puis **redéployer** (les variables sont lues au démarrage).
3. Envoyer le code au client avec le devis accepté. Pour révoquer : retirer l'entrée et redéployer. Les sessions ouvertes avec ce code cessent alors de fonctionner.

Sécurité : le code est vérifié côté serveur, la session est un cookie `HttpOnly; Secure; SameSite=Strict` signé (7 jours), le contenu du questionnaire n'est servi qu'avec ce cookie, 8 essais / 10 min / IP (best-effort).

## À COMPLÉTER
Rechercher `À COMPLÉTER` dans le code : preuves (captures de réalisations, témoignages nominatifs, délais types, conditions de propriété et de maintenance), adresse postale, réseaux sociaux, informations légales (ICE, RC, IF, forme juridique).

## Après le premier déploiement : à tester
- `curl -I https://msmaroc.com/functions/_private/cahier-config.txt` doit répondre 404, jamais le contenu.
- Se connecter à `/espace-client.html` avec un vrai code ; vérifier le cookie `ms_client` (HttpOnly, Secure).
- Limite connue : le limiteur d'essais de connexion est en mémoire (par instance serverless). Pour une protection durable, ajouter une règle de rate limiting Cloudflare (WAF, 1 règle gratuite) sur `/api/login`.
