# Marketing Success — Site vitrine

Site vitrine one-page pour **Marketing Success**, agence digitale 360° (développement web, automatisation & IA, applications métier, communication, informatique, vidéosurveillance, électricité, consulting, formation).

## Aperçu

Site statique (HTML / CSS / JS, sans dépendance de build). Thème sombre « navy » avec accents orange & cyan, hero animé (réseau de particules), animations au scroll, FAQ accordéon, menu mobile, formulaire de contact avec validation.

## Structure

```
Marketing_Success/
├── index.html          # Page principale
├── css/
│   └── style.css       # Styles (charte, responsive, animations)
├── js/
│   └── main.js         # FAQ, menu mobile, scroll reveal, nav active, canvas, formulaire
├── assets/
│   ├── logo.svg        # Logo (vectoriel)
│   ├── hero.png        # Visuel hero (généré par IA)
│   ├── banniere.png    # Visuel « Pourquoi nous » (généré par IA)
│   ├── creation-sites.png        # Service 01 (IA)
│   ├── automatisation-ia.png     # Service 02 (IA)
│   ├── app-metier.svg            # Service 03 (placeholder)
│   ├── communication-impression.svg  # Service 04 (placeholder)
│   ├── informatique-maintenance.svg  # Service 05 (placeholder)
│   └── videosurveillance.svg         # Service 06 (placeholder)
└── README.md
```

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

## Images à finaliser

Les visuels des services **03 à 06** sont des placeholders SVG (icône + libellé aux couleurs de la charte), les crédits de génération IA ayant été épuisés. Pour les remplacer par de vraies images :

1. Générer / fournir 4 images au format ~16:9.
2. Les nommer `app-metier.png`, `communication-impression.png`, `informatique-maintenance.png`, `videosurveillance.png` dans `assets/`.
3. Dans `index.html`, remplacer les `.svg` correspondants par `.png` (4 balises `<img>` de la section services).

## À personnaliser

- Numéro de téléphone (`tel:+33000000000`), email et lien WhatsApp (`wa.me/33000000000`).
- Le formulaire ouvre le client mail (`mailto:`) ; pour un envoi serveur, brancher un service type Formspree / backend dans `js/main.js`.
- Textes des mentions légales et politique de confidentialité (liens en pied de page).
