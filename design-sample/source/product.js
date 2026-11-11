/* Product page: option pills, swatches, personalization check, quantity, pincode check. Sample only. */
(function(){
function group(selector,onPick){
  var items=document.querySelectorAll(selector);
  for(var i=0;i<items.length;i++){
    items[i].addEventListener('click',function(e){
      var btn=e.currentTarget;
      var siblings=btn.parentElement.querySelectorAll('[aria-pressed]');
      for(var j=0;j<siblings.length;j++){siblings[j].setAttribute('aria-pressed',String(siblings[j]===btn))}
      if(onPick)onPick(btn);
    });
  }
}

/* photo and 3D tabs */
var tabs=document.querySelectorAll('.tab');
function showTab(id){
  for(var i=0;i<tabs.length;i++){
    var on=tabs[i].id===id;
    tabs[i].setAttribute('aria-selected',String(on));
    tabs[i].setAttribute('tabindex',on?'0':'-1');
    document.getElementById(tabs[i].getAttribute('aria-controls')).hidden=!on;
  }
}
for(var t=0;t<tabs.length;t++){
  tabs[t].addEventListener('click',function(e){showTab(e.currentTarget.id)});
}

/* gallery thumbnails */
group('.thumb');

/* options */
group('[data-group="material"] .pill');
group('[data-group="size"] .pill');
group('.sw',function(btn){document.getElementById('colourName').textContent=btn.getAttribute('data-name')});

/* personalization: letters, numbers and spaces, up to 40 characters */
var personal=document.getElementById('personal');
var count=document.getElementById('count');
var perr=document.getElementById('personalErr');
var allowed=/^[A-Za-z0-9 ]*$/;
personal.addEventListener('input',function(){
  count.textContent=String(personal.value.length);
  var bad=!allowed.test(personal.value);
  personal.setAttribute('aria-invalid',String(bad));
  perr.hidden=!bad;
  perr.textContent=bad?'Use letters, numbers and spaces only.':'';
});

/* quantity */
var qtyEl=document.getElementById('qty');
var qty=1;
function setQty(n){qty=Math.max(1,Math.min(100,n));qtyEl.textContent=String(qty)}
document.getElementById('qtyDown').addEventListener('click',function(){setQty(qty-1)});
document.getElementById('qtyUp').addEventListener('click',function(){setQty(qty+1)});

/* add to cart (sample: no order is placed) */
document.getElementById('add').addEventListener('click',function(){
  var status=document.getElementById('addStatus');
  if(!allowed.test(personal.value)){
    personal.setAttribute('aria-invalid','true');
    perr.hidden=false;
    perr.textContent='Use letters, numbers and spaces only.';
    personal.focus();
    status.textContent='';
    return;
  }
  status.textContent=qty+(qty===1?' item':' items')+' added to cart. Sample only, no order is placed.';
});

/* pincode check */
var pin=document.getElementById('pin');
var pinErr=document.getElementById('pinErr');
var pinOk=document.getElementById('pinOk');
document.getElementById('pinBtn').addEventListener('click',function(){
  if(!/^\d{6}$/.test(pin.value)){
    pinErr.hidden=false;pinErr.textContent='Enter a 6-digit pincode.';
    pinOk.hidden=true;
    return;
  }
  pinErr.hidden=true;
  pinOk.hidden=false;
  pinOk.textContent='Sample check. Live delivery dates appear once the courier is connected.';
});
})();
