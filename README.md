# Marketing Succès — msmaroc.com

Site statique (HTML/CSS/JS sans build) hébergé sur **Vercel**, avec 3 petites fonctions serverless pour l'espace client.

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
| `api/*.js`, `api/_private/*` | Espace client (login, session, contenu protégé) |
| `vercel.json`, `.vercelignore` | En-têtes, redirections, fichiers exclus du déploiement |

## Changer le numéro WhatsApp / l'e-mail
1. `js/config.js` (formulaires et suivi).
2. Les liens `wa.me/…` et `tel:` écrits en dur dans les `.html` : rechercher l'ancien numéro et le remplacer partout (`grep -rn 212607284660 --include=*.html .`).

## Activer le suivi
Renseigner `ga4` et/ou `metaPixel` dans `js/config.js`. Un bandeau de consentement apparaît alors automatiquement ; rien n'est chargé tant que le visiteur n'accepte pas.

## Déployer
Pousser sur la branche de production du projet Vercel `marketing-success` (ou `vercel --prod`). Aucune étape de build.

## Espace client : variables d'environnement (Vercel → Settings → Environment Variables)
| Variable | Valeur |
|---|---|
| `SESSION_SECRET` | longue chaîne aléatoire (≥ 32 caractères), p. ex. `openssl rand -base64 48` |
| `CLIENT_CODES` | un client par entrée `CODE:Nom du client`, séparées par `,` `;` ou un saut de ligne |

Exemple : `K7P2-ARGAN:Boutique Argan,M4X9-RIAD:Riad Atlas`

### Créer un code d'accès pour un nouveau client
1. Inventer un code (lettres/chiffres, ≥ 8 caractères, difficile à deviner).
2. Ajouter `CODE:Nom du client` à `CLIENT_CODES` dans Vercel, puis **redéployer** (les variables sont lues au démarrage).
3. Envoyer le code au client avec le devis accepté. Pour révoquer : retirer l'entrée et redéployer.

Sécurité : le code est vérifié côté serveur, la session est un cookie `HttpOnly; Secure; SameSite=Strict` signé (7 jours), le contenu du questionnaire n'est servi qu'avec ce cookie, 8 essais / 10 min / IP (best-effort).

## À COMPLÉTER
Rechercher `À COMPLÉTER` dans le code : preuves (captures de réalisations, témoignages nominatifs, délais types, conditions de propriété et de maintenance), adresse postale, réseaux sociaux, informations légales (ICE, RC, IF, forme juridique).
