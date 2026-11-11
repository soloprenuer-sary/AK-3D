/* Shared behaviour: sample tier switch and newsletter form. */
(function(){
var tier='full';
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var save=navigator.connection&&navigator.connection.saveData;

function setTier(t){
  tier=t;
  var buttons=document.querySelectorAll('.ctl button');
  for(var i=0;i<buttons.length;i++){
    buttons[i].setAttribute('aria-pressed',String(buttons[i].getAttribute('data-tier')===t));
  }
  document.dispatchEvent(new CustomEvent('aktier',{detail:t}));
}

var ctl=document.querySelectorAll('.ctl button');
for(var i=0;i<ctl.length;i++){
  ctl[i].addEventListener('click',function(e){setTier(e.currentTarget.getAttribute('data-tier'))});
}

var news=document.getElementById('news');
if(news){
  news.addEventListener('submit',function(e){
    e.preventDefault();
    document.getElementById('newsmsg').textContent='Thanks. This is a sample, so nothing was sent.';
  });
}

window.AkApp={tier:function(){return tier}};
setTier((reduced||save)?'static':'full');
})();
