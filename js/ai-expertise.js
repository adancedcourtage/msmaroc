(function(){
var root=document.getElementById('ia');if(!root)return;
var log=root.querySelector('.ia-log'),av=root.querySelector('.ia-av'),re=root.querySelector('.ia-react'),box=root.querySelector('.ia-chips');
var S=[
['Salam, wach kayn livraison l Rabat ?','Salam ! Iyyeh, kayna livraison l Rabat. Chno l’produit li bghiti ?','🚚'],
['Bghit nconfirmi commande dyali','Mar7ba ! Wakha, ghadi nconfirmiha m3ak. Ghir tfakkar : l’paiement ykoun 3and l’livraison. Wach l’adresse w numéro s7a7in ?','✅'],
['Où est mon colis ?','Votre colis est chez le livreur. Il vous appellera avant de passer. (Exemple : en vrai, le statut vient du transporteur.)','📦'],
['Je veux parler à quelqu’un','Bien sûr. Je transmets à notre équipe : une personne vous répond dès que possible, sans vous faire tout répéter.','🤝'],
['Je voudrais prendre rendez-vous','Avec plaisir. Quel jour vous conviendrait, matin ou après-midi ? Je note votre demande et l’équipe confirme le créneau.','📅']
];
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches,busy=0,first=1,t;
S.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.className='ia-chip';b.textContent=s[0];b.setAttribute('aria-pressed','false');b.onclick=function(){ask(i,b)};box.appendChild(b)});
function el(c,h){var d=document.createElement('div');d.className=c;if(h)d.textContent=h;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
function react(e){re.classList.remove('wave','pop');void re.offsetWidth;re.textContent=e;re.classList.add('pop')}
function ask(i,b){
if(busy)return;busy=1;var s=S[i];
if(first){log.textContent='';first=0}
[].forEach.call(box.children,function(c){c.setAttribute('aria-pressed',c===b?'true':'false')});
el('ia-m u',s[0]);
var m=el('ia-m a');m.innerHTML='<span class="ia-dots" aria-hidden="true"><b></b><b></b><b></b></span>';
t=setTimeout(function(){
m.textContent='';var sr=document.createElement('span'),v=document.createElement('span');sr.className='sr';sr.textContent=s[1];v.setAttribute('aria-hidden','true');m.append(sr,v);
av.classList.add('talk');var n=0;
(function step(){
if(rm||document.hidden)n=s[1].length;else n+=2;
v.textContent=s[1].slice(0,n);log.scrollTop=log.scrollHeight;
if(n<s[1].length)t=setTimeout(step,24);else{av.classList.remove('talk');react(s[2]);busy=0}
})();
},rm?0:900);
}
if('IntersectionObserver'in window)new IntersectionObserver(function(e){root.classList.toggle('on',e[0].isIntersecting)},{threshold:.15}).observe(root);else root.classList.add('on');
document.addEventListener('visibilitychange',function(){root.classList.toggle('paused',document.hidden)});
})();
