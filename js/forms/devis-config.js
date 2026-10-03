/* Simulateur de projet (devis) — contenu des étapes, repris à l'identique du fichier fourni. */
const DW = "Création de site web", DG = "Visibilité Google (fiche Google Business)", DA = "Automatisation & agents IA";
const hasD = (s, d) => (s.domaines || []).includes(d);
const isOrder = s => ["Boutique e-commerce", "Landing page pour un produit"].includes(s.web_type);

window.CONFIG = {
  startEvent: "quote_start", sentEvent: "quote_sent",
  storeKey: "ms-simulation-projet-v1",
  whatsapp: (window.MS_CONFIG || {}).whatsapp,   // numéro défini dans js/config.js
  whatsappDisplay: (window.MS_CONFIG || {}).whatsappDisplay,
  docTitle: "Demande de proposition",
  sendTitle: "Recevez votre proposition détaillée sous 24 h",
  sendText: "Le bouton ouvre WhatsApp avec votre demande déjà rédigée. Appuyez sur Envoyer : nous étudions votre projet et vous adressons une proposition tarifaire sur mesure.",
  nextSteps: [
    ["Vous envoyez", "Votre demande arrive sur notre WhatsApp."],
    ["Nous étudions", "Analyse de votre projet et chiffrage précis."],
    ["Sous 24 h", "Proposition détaillée et appel pour vous l'expliquer."]
  ],
  /* Code interne d'évaluation, lisible uniquement par vous :
     W = site (0 aucun, 1 vitrine/landing, 2 e-com ≤10 produits, 3 e-com 11-50, 4 e-com 50+)
     G = Google (0 aucun, 1 à 4 selon le nombre d'établissements)
     A = nombre d'automatisations cochées */
  ref: s => {
    let w = 0;
    if (hasD(s, DW)) {
      w = s.web_type === "Boutique e-commerce" ? ({"1 à 10": 2, "11 à 50": 3, "51 à 200": 4, "Plus de 200": 4}[s.nb_produits] || 2) : 1;
    }
    const g = hasD(s, DG) ? ({"1": 1, "2 à 3": 2, "4 à 10": 3, "Plus de 10": 4}[s.gbp_nb] || 1) : 0;
    const a = hasD(s, DA) ? (s.auto_sel || []).length : 0;
    return `W${w}G${g}A${a}`;
  },
  steps: [
    { group: "Vous", title: "Faisons connaissance", nav: "Vous",
      intro: "Quelques informations pour vous recontacter et comprendre votre activité.",
      fields: [
        { id: "nom", type: "text", label: "Nom et prénom", req: true },
        { id: "entreprise", type: "text", label: "Entreprise ou marque", ph: "Facultatif si vous démarrez" },
        { id: "secteur", type: "select", label: "Secteur d'activité", req: true,
          options: ["Mode & accessoires", "Beauté & cosmétiques", "Alimentation & épicerie fine", "Restaurant / café", "Santé (cabinet, clinique, pharmacie)", "Immobilier", "Artisanat & décoration", "Électronique & téléphonie", "Services aux entreprises", "Éducation & formation", "Tourisme & hôtellerie", "Autre"] },
        { id: "ville", type: "text", label: "Ville", req: true, ph: "Ex. Casablanca" },
        { id: "tel", type: "tel", label: "Téléphone / WhatsApp", req: true, ph: "06 12 34 56 78", wide: true }
      ] },

    { group: "Vous", title: "De quoi avez-vous besoin ?", nav: "Vos besoins",
      intro: "Cochez un ou plusieurs services. Les questions suivantes s'adaptent à votre choix.",
      fields: [
        { id: "domaines", type: "checks", cards: true, req: true, label: "Services souhaités", short: "Services",
          options: [
            { v: DW, d: "Boutique en ligne avec paiement à la livraison, landing page, site vitrine." },
            { v: DG, d: "Apparaître sur Google Maps, obtenir plus d'avis, publier régulièrement." },
            { v: DA, d: "Confirmer les commandes, répondre aux clients 24 h/24, gagner du temps." }
          ] }
      ] },

    { group: "Votre projet", title: "Votre site web", nav: "Site web", when: s => hasD(s, DW),
      fields: [
        { id: "web_type", type: "radio", label: "Type de site", req: true,
          options: ["Boutique e-commerce", "Landing page pour un produit", "Site vitrine", "Site avec prise de rendez-vous", "Je ne sais pas encore"] },
        { id: "web_existant", type: "radio", label: "Avez-vous déjà un site ?", options: ["Non", "Oui, à refaire", "Oui, à améliorer"] },
        { id: "web_url", type: "url", label: "Adresse du site actuel", ph: "https://", wide: true, when: s => s.web_existant && s.web_existant !== "Non" },
        { id: "nb_produits", type: "radio", label: "Nombre de produits", req: true, options: ["1 à 10", "11 à 50", "51 à 200", "Plus de 200"], when: s => s.web_type === "Boutique e-commerce" },
        { id: "paiement", type: "radio", cards: true, label: "Paiement", default: "Paiement à la livraison (COD)", when: isOrder,
          options: [
            { v: "Paiement à la livraison (COD)", d: "Recommandé au Maroc." },
            { v: "COD + carte bancaire", d: "Pour accepter aussi les paiements en ligne." }
          ] },
        { id: "web_fonctions", type: "checks", label: "Fonctionnalités souhaitées",
          options: ["Commande express en 30 secondes", "Bouton WhatsApp", "Avis clients", "Suivi Meta / TikTok pour les pubs", "Plusieurs langues", "Prise de rendez-vous", "Blog / articles", "Référencement Google"] },
        { id: "identite", type: "radio", label: "Logo et identité visuelle", options: ["J'ai déjà un logo", "Logo à créer"] },
        { id: "contenus", type: "radio", label: "Photos et textes", options: ["J'ai tout", "J'ai les photos, pas les textes", "Tout est à créer"] }
      ] },

    { group: "Votre projet", title: "Votre visibilité sur Google", nav: "Google", when: s => hasD(s, DG),
      fields: [
        { id: "gbp_etat", type: "radio", label: "Avez-vous une fiche Google ?", req: true, options: ["Oui, j'y ai accès", "Oui, mais plus d'accès", "Non", "Je ne sais pas"] },
        { id: "gbp_nb", type: "radio", label: "Nombre d'établissements", options: ["1", "2 à 3", "4 à 10", "Plus de 10"] },
        { id: "gbp_objectifs", type: "checks", label: "Vos objectifs",
          options: ["Plus d'avis clients", "Réponses à tous les avis", "Publications régulières", "Être dans le top 3 local", "Corriger mes informations"] },
        { id: "gbp_posts", type: "radio", label: "Rythme de publication souhaité", options: ["1 post par semaine", "2 à 3 posts par semaine", "Je ne sais pas"] }
      ] },

    { group: "Votre projet", title: "Vos automatisations", nav: "Automatisation", when: s => hasD(s, DA),
      intro: "Cochez ce qui vous ferait gagner du temps. Nous vous conseillerons sur les priorités.",
      fields: [
        { id: "auto_sel", type: "checks", cards: true, req: true, label: "Ce que vous voulez automatiser", short: "Automatisations",
          options: [
            { v: "Confirmation COD par WhatsApp", d: "Moins de colis refusés, zéro appel manuel." },
            { v: "Agent IA WhatsApp 24 h/24", d: "Répond et prend les commandes en darija et en français." },
            { v: "Réponses Instagram et Messenger", d: "Messages privés et commentaires des pubs." },
            { v: "Envoi des colis au livreur", d: "Amana, Ozon, Cathedis… sans ressaisie." },
            { v: "Relance des commandes abandonnées", d: "Récupérer les clients hésitants." },
            { v: "Demande d'avis après livraison", d: "Plus d'avis Google, automatiquement." },
            { v: "Commandes et clients dans Google Sheets", d: "Tout centralisé en temps réel." },
            { v: "Rapports de ventes et de pubs", d: "Vos chiffres chaque jour sur WhatsApp." },
            { v: "Prise de rendez-vous et rappels", d: "Agenda rempli, moins d'absences." },
            { v: "Campagnes WhatsApp clients", d: "Promotions et relance des anciens clients." }
          ] },
        { id: "vol_cmd", type: "radio", label: "Commandes par jour", options: ["Aucune pour l'instant", "1 à 10", "11 à 50", "Plus de 50"] },
        { id: "vol_msg", type: "radio", label: "Messages clients par jour", options: ["Moins de 20", "20 à 100", "Plus de 100"] }
      ] },

    { group: "Pour finir", title: "Délai, budget et rappel", nav: "Délai & budget",
      fields: [
        { id: "delai", type: "radio", label: "Quand souhaitez-vous démarrer ?", req: true, options: ["Dès que possible", "Dans le mois", "Dans 1 à 3 mois", "Pas de date précise"] },
        { id: "budget", type: "radio", label: "Budget envisagé", hint: "Une fourchette nous aide à vous proposer la formule la plus adaptée.",
          options: ["Moins de 3 000 MAD", "3 000 à 6 000 MAD", "6 000 à 12 000 MAD", "12 000 à 25 000 MAD", "Plus de 25 000 MAD", "À définir avec vous"] },
        { id: "contact_pref", type: "radio", label: "Comment préférez-vous être contacté ?", default: "Appel téléphonique", options: ["Appel téléphonique", "Message WhatsApp"] },
        { id: "creneau", type: "radio", label: "Meilleur moment pour vous appeler", options: ["Matin (9 h - 12 h)", "Après-midi (14 h - 18 h)", "Soir (18 h - 20 h)"], when: s => s.contact_pref === "Appel téléphonique" },
        { id: "source", type: "radio", label: "Comment nous avez-vous connus ?", options: ["Publicité Instagram / Facebook", "TikTok", "Google", "Recommandation", "Nous vous avons contacté", "Autre"] },
        { id: "message", type: "textarea", label: "Un mot sur votre projet", ph: "Ex. je vends des sacs faits main et je reçois trop de messages pour tout gérer seule." }
      ] },

    { group: "Pour finir", title: "Votre demande est prête", nav: "Envoi", type: "recap",
      intro: "Vérifiez vos réponses puis envoyez-les. Aucun engagement : la proposition est gratuite." }
  ]
};
