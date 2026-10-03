/* Mini-démos des offres : orchestre uniquement la frappe et la boucle ; le mouvement est en CSS. */
(function(){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var LOOP=9400;
  function demo(v){
    var tx=[].slice.call(v.querySelectorAll('.tx[data-at]')),timers=[],on=false,seen=false;
    tx.forEach(function(e){e._t=e.textContent});
    function later(f,ms){timers.push(setTimeout(f,ms))}
    function type(e){
      var i=0,ms=+e.dataset.ms||55;e.classList.add('typing');
      (function step(){e.textContent=e._t.slice(0,++i);
        if(i<e._t.length)later(step,ms);else later(function(){e.classList.remove('typing')},500)})();
    }
    function stop(){timers.forEach(clearTimeout);timers=[];v.classList.remove('is-playing');
      tx.forEach(function(e){e.textContent=e._t;e.classList.remove('typing')})}
    function cycle(){
      stop();tx.forEach(function(e){e.textContent=''});
      void v.offsetWidth;v.classList.add('is-playing');
      tx.forEach(function(e){later(function(){type(e)},+e.dataset.at)});
      later(cycle,LOOP);
    }
    function sync(){var w=seen&&!document.hidden;if(w&&!on){on=true;cycle()}else if(!w&&on){on=false;stop()}}
    new IntersectionObserver(function(en){seen=en[0].isIntersecting;sync()},{threshold:.35}).observe(v);
    document.addEventListener('visibilitychange',sync);
  }
  [].forEach.call(document.querySelectorAll('.vis[data-demo]'),demo);
})();
