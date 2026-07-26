# Marketing Success — Site vitrine

Site vitrine one-page pour **Marketing Success**, agence digitale 360° (développement web, automatisation & IA, applications métier, communication, informatique, vidéosurveillance, électricité, consulting, formation).

## Aperçu

Site statique (HTML / CSS / JS, sans dépendance de build). Thème sombre « navy » avec accents orange & cyan, hero animé (réseau de particules), animations au scroll, FAQ accordéon, menu mobile, formulaire de contact avec validation.

**Optimisé conversion** : compteurs animés, barre de progression de lecture, double canal de contact (e-mail **+ WhatsApp** pré-rempli), bouton WhatsApp flottant, micro-interactions premium, données structurées JSON-LD (`ProfessionalService` + `FAQPage` pour les rich snippets Google), pages légales complètes (mentions légales + confidentialité RGPD), et animation du hero mise en pause hors-écran (économie CPU/batterie).

## Structure

```
Marketing_Success/
├── index.html          # Page principale
├── 404.html            # Page d'erreur (auto-utilisée par GitHub Pages)
├── mentions-legales.html
├── confidentialite.html
├── robots.txt          # Indexation moteurs de recherche
├── sitemap.xml         # Plan du site (SEO)
├── css/
│   └── style.css       # Styles (charte, responsive, animations, icônes)
├── js/
│   └── main.js         # FAQ, menu, reveal, canvas, compteurs, progression, formulaire (email + WhatsApp)
├── assets/
│   ├── logo.svg        # Logo (vectoriel)
│   ├── hero.webp       # Visuel hero (généré IA, optimisé WebP)
│   ├── banniere.webp   # Visuel « Pourquoi nous » (WebP)
│   ├── creation-sites.webp       # Service 01 (WebP)
│   ├── automatisation-ia.webp    # Service 02 (WebP)
│   ├── app-metier.svg            # Service 03 (illustration vectorielle animée)
│   ├── communication-impression.svg  # Service 04 (illustration vectorielle)
│   ├── informatique-maintenance.svg  # Service 05 (illustration vectorielle animée)
│   ├── videosurveillance.svg         # Service 06 (illustration vectorielle animée)
│   └── sources/                  # Originaux PNG haute def (non référencés, hors ligne critique)
├── DESIGN_SYSTEM.md    # Master Design System (charte, tokens, composants, icônes, règles)
└── README.md
```

> **Performance** : les visuels raster sont servis en **WebP** (~250 Ko au total contre ~6,6 Mo en PNG, soit -96 %). Les originaux PNG sont conservés dans `assets/sources/` (dérivés WebP = compression avec perte, non régénérables). Pour un dépôt léger, les exclure du versioning via `.gitignore` plutôt que les supprimer.

## Lancer en local

```bash
cd Marketing_Success
python3 -m http.server 4173
# puis ouvrir http://localhost:4173
```

## Déploiement (GitHub Pages)

1. Pousser ce dossier à la racine d'un dépôt GitHub.
2. Dans **Settings → Pages**, sélectionner la branche `main` et le dossier `/root`.
3. Le site sera publié sur `https://<utilisateur>.github.io/<repo>/`.

## Visuels des services

Les services **01 et 02** utilisent des visuels générés par IA (`.png`, 16:9). Les services **03 à 06** utilisent désormais des **illustrations vectorielles SVG sur mesure** (scènes complètes 640×360, glassmorphism, halos et accents de la charte) — nettes à toute résolution, légères, et animables. La convention de ces illustrations est documentée dans `DESIGN_SYSTEM.md` (§6).

Pour remplacer une illustration SVG par une image raster IA plus tard :

1. Générer une image ~16:9, la nommer p.ex. `app-metier.png` dans `assets/` (idéalement en WebP).
2. Dans `index.html`, remplacer le `.svg` correspondant par le nouveau fichier (balise `<img>` de la section services).

## À personnaliser avant mise en ligne

Ces éléments sont des **valeurs de démonstration** à remplacer par les vraies données de l'entreprise :

1. **Numéro WhatsApp** — constante `WA_NUMBER` en haut de `js/main.js` (format international sans `+`, ex. `33612345678`), **et** les liens `wa.me/33000000000` dans `index.html` (bouton flottant) + `mentions-legales.html`.
2. **Téléphone** — toutes les occurrences de `tel:+33000000000` (header, contact, footer, pages légales).
3. **E-mail** — `contact@marketingsuccess.fr` (déjà cohérent partout) ; adapter si besoin.
4. **Réseaux sociaux** — liens `#` des icônes LinkedIn / Instagram / Facebook dans le footer, et champ `sameAs` du JSON-LD (`index.html`).
5. **Mentions légales & confidentialité** — remplir les champs `[à compléter]` dans `mentions-legales.html` et `confidentialite.html` (forme juridique, SIRET, adresse, hébergeur, durées).
6. **Domaine** — remplacer `https://www.marketingsuccess.fr/` dans la balise `canonical`, le JSON-LD, l'Open Graph, `robots.txt` et `sitemap.xml`.
7. **⚠️ Témoignages** — les 3 avis de la section « Avis » (Sophie L., Karim M., Yassine B.) sont **fictifs** et servent de gabarit. Les remplacer par de vrais témoignages clients, ou retirer la section : publier de faux avis nominatifs est trompeur (et interdit par la DGCCRF / RGPD image).
8. **Envoi du formulaire** — déjà branché (FormSubmit.co, sans compte). Il suffit que `CONTACT_EMAIL` (haut de `js/main.js`) soit une **vraie boîte mail** : à la première demande envoyée, FormSubmit y adresse un e-mail de confirmation à valider une fois, puis tous les leads arrivent automatiquement.

### Envoi du formulaire
Backend d'envoi **déjà opérationnel, sans compte** : le formulaire poste en AJAX vers **FormSubmit.co** (`https://formsubmit.co/ajax/<CONTACT_EMAIL>`), avec états chargement / succès / erreur — **aucun lead perdu**. Activation automatique : à la première soumission, FormSubmit envoie un e-mail de confirmation à `CONTACT_EMAIL` (à valider une seule fois), ensuite tous les messages arrivent directement dans cette boîte. Pour changer la destination : modifier la seule constante `CONTACT_EMAIL` en haut de `js/main.js`. Repli client mail (`mailto:`) disponible en mettant `FORM_ENDPOINT = ''`. Un 2ᵉ bouton **WhatsApp** ouvre en parallèle une conversation pré-remplie. Aucune donnée sensible n'est mise en query string.

## Charte & design system

La charte complète (tokens couleurs, typographie, composants, grille, animations, convention des illustrations) est documentée dans **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** — source de vérité pour toute évolution.
