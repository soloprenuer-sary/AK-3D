/* Shop page: sidebar filters, interactive product cards, quick view, quick add. Sample data only. */
(function(){
var CATS=['Home decor','Desk and gadgets','Figurines and miniatures','Gifts and personalized','Spare parts','Hobby and cosplay'];
var AVAIL=[['all','All'],['stock','In stock'],['mto','Made to order']];
var MATS=['PLA+','PETG','ABS / ASA','Resin'];
var COL={black:'#17171A',white:'#F3F1EA',orange:'#FF6A1F',violet:'#5B2BE0',lime:'#D8FF3A'};
var PRODUCTS=[
 {n:'Layered vase',c:'Home decor',s:true,m:'PLA+',k:['violet','lime','black']},
 {n:'Desk cable organiser',c:'Desk and gadgets',s:true,m:'PETG',k:['black','white','orange']},
 {n:'Phone stand',c:'Desk and gadgets',s:true,m:'PLA+',k:['lime','violet','black']},
 {n:'Miniature knight',c:'Figurines and miniatures',s:false,m:'Resin',k:['white','black']},
 {n:'Name plate',c:'Gifts and personalized',s:false,m:'PLA+',k:['orange','violet','lime','black']},
 {n:'Planter with drainage',c:'Home decor',s:true,m:'PLA+',k:['orange','white','violet']},
 {n:'Replacement knob',c:'Spare parts',s:true,m:'ABS / ASA',k:['black','white']},
 {n:'Dice tower',c:'Hobby and cosplay',s:false,m:'PETG',k:['violet','black','orange']},
 {n:'Keychain set',c:'Gifts and personalized',s:true,m:'PLA+',k:['lime','orange','violet']},
 {n:'Wall hook trio',c:'Home decor',s:true,m:'PETG',k:['black','lime']},
 {n:'Cosplay badge',c:'Hobby and cosplay',s:false,m:'Resin',k:['orange','black']},
 {n:'Shelf bracket',c:'Spare parts',s:true,m:'PETG',k:['white','black']}
];
var state={cat:'All',avail:'all',mats:[],sort:'featured'};
var cart=0;
var fine=window.matchMedia&&window.matchMedia('(hover:hover) and (pointer:fine)').matches;
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function make(tag,attrs,text){
  var e=document.createElement(tag);
  if(attrs){for(var k in attrs){e.setAttribute(k,attrs[k])}}
  if(text!==undefined)e.textContent=text;
  return e;
}
function $(id){return document.getElementById(id)}

var toastTimer=0;
function toast(msg){
  var t=$('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('show')},1800);
}
function addToCart(name){
  cart+=1;
  var b=$('cartBtn');b.textContent=String(cart);b.setAttribute('aria-label','Cart, '+cart+(cart===1?' item':' items'));
  toast(name+' added to cart (sample)');
}

function passes(p,ignoreCat){
  if(!ignoreCat&&state.cat!=='All'&&p.c!==state.cat)return false;
  if(state.avail==='stock'&&!p.s)return false;
  if(state.avail==='mto'&&p.s)return false;
  if(state.mats.length&&state.mats.indexOf(p.m)<0)return false;
  return true;
}

/* sidebar */
function renderCats(){
  var box=$('cats');box.innerHTML='';
  var total=PRODUCTS.filter(function(p){return passes(p,true)}).length;
  [['All',total]].concat(CATS.map(function(c){
    return [c,PRODUCTS.filter(function(p){return p.c===c&&passes(p,true)}).length];
  })).forEach(function(row){
    var b=make('button',{type:'button',class:'cat-btn','aria-pressed':String(state.cat===row[0])});
    b.appendChild(make('span',null,row[0]));
    b.appendChild(make('span',{class:'n'},String(row[1])));
    b.addEventListener('click',function(){state.cat=row[0];update()});
    box.appendChild(b);
  });
}
function renderAvail(){
  var box=$('avail');box.innerHTML='';
  AVAIL.forEach(function(a){
    var b=make('button',{type:'button',class:'pill','aria-pressed':String(state.avail===a[0])},a[1]);
    b.addEventListener('click',function(){state.avail=a[0];update()});
    box.appendChild(b);
  });
}
function renderMats(){
  var box=$('mats');box.innerHTML='';
  MATS.forEach(function(m){
    var l=make('label',{class:'mat-row'});
    var i=make('input',{type:'checkbox'});
    i.checked=state.mats.indexOf(m)>=0;
    i.addEventListener('change',function(){
      var at=state.mats.indexOf(m);
      if(i.checked&&at<0)state.mats.push(m);
      if(!i.checked&&at>=0)state.mats.splice(at,1);
      update();
    });
    l.appendChild(i);l.appendChild(make('span',null,m));
    box.appendChild(l);
  });
}
function renderActive(){
  var box=$('active');box.innerHTML='';
  function chip(label,clear){
    var c=make('span',{class:'achip'},label);
    var x=make('button',{type:'button','aria-label':'Remove filter '+label},'×');
    x.addEventListener('click',clear);c.appendChild(x);box.appendChild(c);
  }
  if(state.cat!=='All')chip(state.cat,function(){state.cat='All';update()});
  if(state.avail!=='all')chip(state.avail==='stock'?'In stock':'Made to order',function(){state.avail='all';update()});
  state.mats.forEach(function(m){chip(m,function(){state.mats.splice(state.mats.indexOf(m),1);update()})});
}

/* cards */
var HEART='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
var EYE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0B0C" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

function card(p){
  var art=make('article',{class:'pc'});
  var media=make('div',{class:'pc-media'});
  var face=make('div',{class:'pc-art'});
  var obj=make('div',{class:'pc-obj'});
  obj.style.setProperty('--c',COL[p.k[0]]);
  face.appendChild(obj);media.appendChild(face);
  media.appendChild(make('a',{class:'pc-link',href:'product.html','aria-label':p.n+', view details'}));
  media.appendChild(make('span',{class:'tag'+(p.s?' accent':'')},p.s?'In stock':'Made to order'));

  var heart=make('button',{type:'button',class:'pc-round pc-heart','aria-pressed':'false','aria-label':'Save '+p.n});
  heart.innerHTML=HEART;
  heart.addEventListener('click',function(){
    var on=heart.getAttribute('aria-pressed')!=='true';
    heart.setAttribute('aria-pressed',String(on));
    toast(on?p.n+' saved (sample)':p.n+' removed from saved');
  });
  media.appendChild(heart);

  var qv=make('button',{type:'button',class:'pc-round pc-qv','aria-label':'Quick view '+p.n});
  qv.innerHTML=EYE;
  qv.addEventListener('click',function(){openQuick(p,obj)});
  media.appendChild(qv);

  var sw=make('div',{class:'pc-sw',role:'group','aria-label':'Colours for '+p.n});
  p.k.forEach(function(key,i){
    var b=make('button',{type:'button','aria-label':key,'aria-pressed':String(i===0)});
    b.style.background=COL[key];
    b.addEventListener('click',function(){
      var all=sw.querySelectorAll('button');
      for(var j=0;j<all.length;j++)all[j].setAttribute('aria-pressed',String(all[j]===b));
      obj.style.setProperty('--c',COL[key]);
    });
    b.addEventListener('mouseenter',function(){obj.style.setProperty('--c',COL[key])});
    sw.appendChild(b);
  });
  sw.addEventListener('mouseleave',function(){
    var cur=sw.querySelector('[aria-pressed="true"]');
    if(cur)obj.style.setProperty('--c',cur.style.background);
  });
  media.appendChild(sw);

  var add=make('button',{type:'button',class:'pc-add'},'Quick add');
  var addTimer=0;
  add.addEventListener('click',function(){
    addToCart(p.n);
    add.textContent='Added ✓';add.classList.add('done');
    clearTimeout(addTimer);addTimer=setTimeout(function(){add.textContent='Quick add';add.classList.remove('done')},1400);
  });
  media.appendChild(add);

  if(fine&&!reduced){
    media.addEventListener('pointermove',function(e){
      var r=media.getBoundingClientRect();
      var x=(e.clientX-r.left)/r.width-0.5,y=(e.clientY-r.top)/r.height-0.5;
      media.style.setProperty('--ry',(x*7).toFixed(2)+'deg');
      media.style.setProperty('--rx',(-y*7).toFixed(2)+'deg');
    });
    media.addEventListener('pointerleave',function(){
      media.style.setProperty('--rx','0deg');media.style.setProperty('--ry','0deg');
    });
  }
  art.appendChild(media);

  var info=make('div',{class:'pc-info'});
  var left=make('div');
  var name=make('a',{class:'pc-name',href:'product.html'},p.n);
  left.appendChild(name);
  left.appendChild(make('span',{class:'pc-meta'},p.m+' · '+p.c));
  info.appendChild(left);
  info.appendChild(make('span',{class:'pc-price'},'₹[price]'));
  art.appendChild(info);
  return art;
}

/* quick view dialog */
var qvEl=$('qv'),qvProduct=null;
function openQuick(p,obj){
  qvProduct=p;
  $('qvName').textContent=p.n;
  $('qvMeta').textContent=p.m+' · '+p.c+(p.s?'':' · Ready in [X] working days');
  var tag=$('qvTag');tag.textContent=p.s?'In stock':'Made to order';tag.className='tag'+(p.s?' accent':'');
  var qo=$('qvObj');qo.style.setProperty('--c',obj.style.getPropertyValue('--c'));
  var box=$('qvSw');box.innerHTML='';
  p.k.forEach(function(key){
    var b=make('button',{type:'button',class:'sw','aria-label':key,'aria-pressed':String(COL[key]===qo.style.getPropertyValue('--c'))});
    b.style.background=COL[key];
    b.addEventListener('click',function(){
      var all=box.querySelectorAll('.sw');
      for(var j=0;j<all.length;j++)all[j].setAttribute('aria-pressed',String(all[j]===b));
      qo.style.setProperty('--c',COL[key]);
    });
    box.appendChild(b);
  });
  if(typeof qvEl.showModal==='function')qvEl.showModal();else qvEl.setAttribute('open','');
}
$('qvClose').addEventListener('click',function(){qvEl.close()});
qvEl.addEventListener('click',function(e){if(e.target===qvEl)qvEl.close()});
$('qvAdd').addEventListener('click',function(){if(qvProduct)addToCart(qvProduct.n);qvEl.close()});

/* grid and state */
function render(){
  var list=PRODUCTS.filter(function(p){return passes(p,false)});
  if(state.sort==='name')list=list.slice().sort(function(a,b){return a.n.localeCompare(b.n)});
  if(state.sort==='stock')list=list.slice().sort(function(a,b){return (b.s?1:0)-(a.s?1:0)});
  var grid=$('grid');grid.innerHTML='';
  list.forEach(function(p){grid.appendChild(card(p))});
  $('count').textContent=list.length+(list.length===1?' product':' products');
  $('empty').classList.toggle('show',list.length===0);
}
function update(){renderCats();renderAvail();renderMats();renderActive();render()}
function clearAll(){state={cat:'All',avail:'all',mats:[],sort:'featured'};$('sort').value='featured';update()}

$('sort').addEventListener('change',function(){state.sort=$('sort').value;render()});
$('clear').addEventListener('click',clearAll);
$('clear2').addEventListener('click',clearAll);
$('filtersBtn').addEventListener('click',function(){
  var open=$('side').classList.toggle('open');
  $('filtersBtn').setAttribute('aria-expanded',String(open));
});
update();
})();
