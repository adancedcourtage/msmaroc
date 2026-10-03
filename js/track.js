/* Suivi des conversions. N'injecte GA4 / Meta Pixel que si leurs IDs sont renseignés dans js/config.js.
   Événements : whatsapp_click, quote_start, quote_sent, brief_start, brief_sent. */
(function () {
  var C = window.MS_CONFIG || {};
  var FB_MAP = { whatsapp_click: 'Contact', quote_sent: 'Lead', brief_sent: 'CompleteRegistration' };

  function startTrackers() {
  if (C.ga4) {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.ga4);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', C.ga4);
  }
  if (C.metaPixel) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', C.metaPixel);
    window.fbq('track', 'PageView');
  }
  }

  /* Consentement (loi 09-08) : rien n'est chargé sans accord explicite. Sans ID configuré, aucun bandeau n'apparaît. */
  function consentBanner() {
    var b = document.createElement('div');
    b.className = 'consent';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookies de mesure d’audience');
    b.innerHTML = '<p>Nous utilisons des outils de mesure d’audience et de suivi publicitaire pour améliorer le site et nos campagnes. Acceptez-vous ?</p>' +
      '<div><button type="button" class="btn ghost small" data-c="no">Refuser</button><button type="button" class="btn primary small" data-c="yes">Accepter</button></div>';
    b.addEventListener('click', function (e) {
      var c = e.target.getAttribute && e.target.getAttribute('data-c');
      if (!c) return;
      try { localStorage.setItem('ms-consent', c); } catch (x) {}
      b.remove();
      if (c === 'yes') startTrackers();
    });
    document.body.appendChild(b);
  }
  if (C.ga4 || C.metaPixel) {
    var stored = null;
    try { stored = localStorage.getItem('ms-consent'); } catch (x) {}
    if (stored === 'yes') startTrackers();
    else if (!stored) { if (document.body) consentBanner(); else document.addEventListener('DOMContentLoaded', consentBanner); }
  }

  window.MSTrack = function (name, params) {
    params = params || {};
    try { if (window.gtag) window.gtag('event', name, params); } catch (e) {}
    try {
      if (window.fbq) {
        if (FB_MAP[name]) window.fbq('track', FB_MAP[name], params);
        else window.fbq('trackCustom', name, params);
      }
    } catch (e) {}
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a && !a.closest('.msf')) window.MSTrack('whatsapp_click', { location: a.getAttribute('data-loc') || location.pathname });
  });
})();
