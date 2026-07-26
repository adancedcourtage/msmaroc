# Marketing Success — Master Design System

Système de design de référence du site vitrine **Marketing Success** (agence digitale 360°).
Thème : **navy sombre premium**, accents **orange** & **cyan**, esthétique tech / SaaS.
Toutes les valeurs ci-dessous sont la **source de vérité** : elles correspondent aux tokens réels de `css/style.css`. Tout nouvel écran ou asset doit s'y conformer.

---

## 1. Couleurs (tokens)

Définis en variables CSS dans `:root` (`css/style.css`).

| Token | Valeur | Usage |
|---|---|---|
| `--navy-950` | `#05070f` | Fond global du site |
| `--navy-900` | `#080d1f` | Fonds de dégradé, cartes profondes |
| `--navy-800` | `#0c1330` | Cartes (mini-cards, panneaux) |
| `--navy-700` | `#121b42` | Surfaces surélevées, icônes |
| `--navy-600` | `#182352` | Bordures actives, hover |
| `--blue-500` | `#2f6bff` | Halo bleu, accents secondaires |
| `--blue-400` | `#4f8bff` | États clairs du bleu |
| `--cyan-400` | `#22d3ee` | **Accent 1** — eyebrows, liens, data |
| `--orange-500` | `#ff9a1f` | **Accent 2 (clair)** — CTA, highlights |
| `--orange-600` | `#ff7a00` | **Accent 2 (foncé)** — CTA gradient |
| `--white` | `#ffffff` | Titres, texte fort |
| `--grey-300` | `#c4cbe4` | Texte de navigation |
| `--grey-400` | `#93a0c2` | Texte courant / paragraphes |
| `--grey-500` | `#6c7799` | Texte tertiaire, légendes |
| `--line` | `rgba(148,163,209,0.14)` | Bordures fines, séparateurs |

**Dégradés signature**
- Texte accent (`.grad-text`) : `linear-gradient(100deg, #ff9a1f, #ff7a00 40%, #22d3ee)`
- CTA primaire (`.btn-primary`) : `linear-gradient(100deg, #ff7a00, #ff9a1f)`
- Accent icônes / illustrations : `linear-gradient(135deg, #ff7a00, #22d3ee)`

**Halos de fond (hero)**
- Bleu haut-gauche : `radial-gradient(..., rgba(47,107,255,0.35), transparent)`
- Orange haut-droite : `radial-gradient(..., rgba(255,138,30,0.16), transparent)`

---

## 2. Typographie

| Rôle | Police | Graisses |
|---|---|---|
| Titres (h1–h4), boutons, eyebrows, chiffres | **Sora** | 400 / 500 / 600 / 700 / 800 |
| Corps de texte, formulaires | **Inter** | 400 / 500 / 600 / 700 |

- Chargées via Google Fonts (`Sora` + `Inter`), `display=swap`.
- Titres : `letter-spacing: -0.02em`, `line-height: 1.06–1.2`.
- Corps : `line-height: 1.6`, antialiasing activé.

**Échelle typographique (fluide `clamp`)**
| Élément | Taille |
|---|---|
| H1 hero | `clamp(38px, 4.6vw, 60px)` |
| H2 sections | `clamp(26px, 3vw, 36px)` |
| H3 cartes | `19px` |
| Lead / intro | `17–19px` |
| Corps | `14.5–15px` |
| Eyebrow | `12.5px` — uppercase, `letter-spacing: 0.14em`, cyan |
| Tags / légendes | `11.5–13.5px` |

---

## 3. Grille & espacement

- Conteneur : `.wrap` → `max-width: 1240px` (`--maxw`), padding latéral `32px`.
- Rythme vertical des sections : `padding: 120px 0` (desktop).
- En-tête de section : `max-width: 680px`, `margin-bottom: 64px`.
- Grilles types :
  - Hero : `1.05fr / 0.95fr`, gap `64px`.
  - Services : grille responsive de cartes (auto-fit min ~320px).
  - Process : 4 colonnes.
- Rayons : `--radius: 18px` (défaut), cartes `14–18px`, boutons `100px` (pill), puces/tags `100px`.

---

## 4. Composants

| Composant | Classe | Notes |
|---|---|---|
| Bouton primaire | `.btn.btn-primary` | Gradient orange, texte navy, ombre orange, `translateY(-2px)` au hover |
| Bouton fantôme | `.btn.btn-ghost` | Bordure blanche translucide, fond `rgba(255,255,255,.03)` |
| Bouton small | `.btn-sm` | Variante compacte nav |
| Eyebrow | `.eyebrow` | Barre gradient + label cyan uppercase |
| Carte service | `.service-card` | `img-wrap` (170px, cover) + `body` ; hover : `translateY(-6px)` + bordure orange + zoom image `scale(1.06)` |
| Mini-carte | `.mini-card` | Icône + titre + texte ; hover bordure cyan |
| Carte témoignage | `.testi-card` | Étoiles + citation + personne (avatar initiales) |
| FAQ | `.faq-item` / `.faq-q` / `.faq-a` | Accordéon `max-height` animé, `+` qui pivote |
| Formulaire | `input / select / textarea` | Fond navy, bordure `--line`, focus bordure orange |
| Bande CTA | `.cta-band` | Bloc pleine largeur de conversion |
| CTA flottant | `.float-btn` | Bouton WhatsApp rond, bas-droite |

---

## 5. Animations & interactions

| Règle | Valeur |
|---|---|
| Scroll reveal | `.reveal` → `opacity:0; translateY(24px)` puis `.reveal.visible` (IntersectionObserver, JS) ; transition `0.7s ease` |
| Hover cartes | `transform` + changement de bordure, `0.3s` |
| Hover boutons | `translateY(-2px)` + ombre renforcée, `0.25s` |
| Nav | fond qui s'opacifie au scroll (`header.scrolled`), lien actif souligné gradient |
| Hero | canvas `#network-canvas` — réseau de particules animé (JS) |
| FAQ | `max-height 0 → auto` en `0.35s ease` |
| Accessibilité | `@media (prefers-reduced-motion: reduce)` désactive animations/transitions et force `.reveal` visible |

---

## 6. Bibliothèque d'assets

Arborescence actuelle : `assets/` (site statique, tout regroupé).

| Fichier | Type | Rôle / emplacement | Format |
|---|---|---|---|
| `logo.svg` | Vectoriel | Logo — header, footer, favicon | SVG |
| `hero.png` | Généré IA | Visuel hero (dashboard 3D) — section Hero | PNG 16:9 |
| `banniere.png` | Généré IA | Visuel « Pourquoi nous » | PNG |
| `creation-sites.png` | Généré IA | Service 01 — Développement web | PNG 16:9 |
| `automatisation-ia.png` | Généré IA | Service 02 — Automatisation & IA | PNG 16:9 |
| `app-metier.svg` | **Illustration vectorielle** | Service 03 — Applications métier (smartphone + calendrier + carte fidélité) | SVG 640×360 |
| `communication-impression.svg` | **Illustration vectorielle** | Service 04 — Communication (kakémono + cartes de visite + nuancier) | SVG 640×360 |
| `informatique-maintenance.svg` | **Illustration vectorielle** | Service 05 — Informatique (baie serveur + bouclier + cloud) | SVG 640×360 |
| `videosurveillance.svg` | **Illustration vectorielle** | Service 06 — Vidéosurveillance (mur de flux + caméra dôme) | SVG 640×360 |

**Convention des illustrations SVG de service** (à réutiliser pour tout nouveau service) :
- Canevas `640×360` (16:9), affiché en `object-fit: cover` sur 170px de haut.
- Fond : dégradé `#0c1330 → #05070f` + trame de points `rgba(148,163,209,0.10)`.
- 2 halos radiaux : un bleu/cyan, un orange, en coins opposés.
- Panneaux « glassmorphism » : fond `rgba(12,19,48,0.85)`, bordure `rgba(148,163,209,0.20)`.
- Accents : gradient `#ff7a00 → #22d3ee`, aplats orange `#ff9a1f`, data cyan `#22d3ee`.
- **Pas de texte** dans l'illustration (le titre est porté par la carte).

---

## 6 bis. Système d'icônes (SVG sur mesure)

Toutes les icônes sont des **SVG inline dessinés à la main** (aucune police d'icônes, aucun emoji), classe `.svg-ic` sur un `viewBox="0 0 24 24"`.

- **Style** : trait (line), `fill:none`, `stroke:currentColor`, `stroke-width:1.7`, `stroke-linecap/linejoin:round`.
- **Couleur** pilotée par la couleur du conteneur : cyan (`--cyan-400`) sur fond navy (mini-cards), blanc sur dégradé bleu→cyan (bloc « Pourquoi nous »).
- **Jeu actuel (7)** : éclair (Électricité), boussole (Consulting), toque (Formation), cible (Expertise), chronomètre (Réactivité), bouclier-check (Fiabilité), courbe ascendante (Résultats).
- **Micro-interactions** : `scale(1.14)` au survol ; la cible pulse en continu (`.ring-pulse`), le chronomètre tourne au survol (`.watch .hand`), la courbe se trace au survol (`.trend .trend-line`).
- **Nouvelle icône** : réutiliser `viewBox 0 0 24 24`, trait 1.7, coins arrondis, `currentColor` — ne jamais remettre d'emoji.

## 6 ter. SVG animés

Les 4 illustrations de service embarquent des animations **CSS internes au fichier SVG** (fonctionnent même chargées via `<img>`), toutes désactivées sous `prefers-reduced-motion` :
- `videosurveillance.svg` : voyants REC clignotants, cône de vision qui respire.
- `informatique-maintenance.svg` : voyants serveur échelonnés, nœuds réseau qui pulsent.
- `app-metier.svg` : anneau de progression qui se charge, cellule d'agenda qui pulse.

## 7. Règles d'or

1. **Fond toujours navy** (`--navy-950`) — jamais de fond clair.
2. **Un seul accent chaud par zone** : orange pour l'action, cyan pour la donnée / l'info.
3. **Titres en Sora**, corps en Inter — pas d'autre police.
4. **Rayons généreux** (14–18px) et **pills** pour les actions.
5. **Bordures fines** `--line` plutôt que des ombres dures ; les ombres sont réservées aux CTA et éléments flottants (teintées orange).
6. **Respecter `prefers-reduced-motion`** sur toute nouvelle animation.
7. Tout nouvel asset raster doit viser le **format WebP** en production (les PNG actuels sont à convertir lors de l'optimisation finale).
