/* Flat 2D printer illustration. Used for the hero (scroll-linked layers) and the looping print section. */
(function(){
var NS='http://www.w3.org/2000/svg';
var N=30,LH=6.4,BED=430,CX=320,T=0.5,HOLD=2.4;
var INK='#0B0B0C',FRAME='#E4E1D7',FRAME2='#D6D2C6',DARK='#17171A',VIO='#5B2BE0',VIO2='#7A52EC',ORANGE='#FF6A1F',LIME='#D8FF3A';

function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a){e.setAttribute(k,String(a[k]))}if(p)p.appendChild(e);return e}
function prof(t){var r=44+30*Math.sin(Math.PI*Math.pow(t,0.8));if(t>0.8)r+=(t-0.8)*70;if(t<0.08)r-=(0.08-t)*120;return r}
function loopP(c){var period=N*T+HOLD,ph=c%period;return ph>=N*T?N:ph/T}

function build(host,label,mode){
  var svg=el('svg',{viewBox:'0 0 640 560',role:'img','aria-label':'Illustration of a 3D printer building a vase layer by layer'});
  host.appendChild(svg);
  el('ellipse',{cx:320,cy:482,rx:236,ry:13,fill:INK,opacity:0.12},svg);
  el('rect',{x:112,y:456,width:416,height:18,rx:8,fill:FRAME2,stroke:INK,'stroke-width':2},svg);
  el('rect',{x:150,y:442,width:340,height:14,rx:4,fill:DARK},svg);
  el('rect',{x:170,y:430,width:300,height:12,rx:4,fill:'#FFFFFF',stroke:INK,'stroke-width':1.5},svg);

  var lg=el('g',{},svg),layers=[];
  for(var i=0;i<N;i++){layers.push(el('rect',{x:CX,y:BED,width:0,height:0,rx:2,fill:i%2?VIO2:VIO},lg))}

  el('rect',{x:118,y:96,width:24,height:356,rx:6,fill:FRAME,stroke:INK,'stroke-width':2.5},svg);
  el('rect',{x:498,y:96,width:24,height:356,rx:6,fill:FRAME,stroke:INK,'stroke-width':2.5},svg);
  el('rect',{x:118,y:86,width:404,height:16,rx:6,fill:FRAME,stroke:INK,'stroke-width':2.5},svg);
  el('rect',{x:118,y:138,width:404,height:18,rx:6,fill:FRAME2,stroke:INK,'stroke-width':2.5},svg);

  el('rect',{x:94,y:86,width:26,height:8,rx:4,fill:DARK},svg);
  el('circle',{cx:96,cy:60,r:30,fill:DARK,stroke:INK,'stroke-width':2},svg);
  el('circle',{cx:96,cy:60,r:12,fill:LIME,stroke:INK,'stroke-width':1.5},svg);
  var fil=el('path',{fill:'none',stroke:ORANGE,'stroke-width':3,'stroke-linecap':'round'},svg);

  el('path',{d:'M552 336 C566 380 590 400 552 430',fill:'none',stroke:INK,'stroke-width':3},svg);
  el('rect',{x:524,y:300,width:58,height:40,rx:8,fill:DARK,stroke:INK,'stroke-width':2},svg);
  el('rect',{x:534,y:316,width:38,height:6,rx:3,fill:'#34343A'},svg);
  var fillBar=el('rect',{x:534,y:316,width:0,height:6,rx:3,fill:LIME},svg);

  var rod=el('rect',{x:300,y:156,width:6,height:0,fill:DARK},svg);
  var carriage=el('rect',{x:286,y:120,width:68,height:36,rx:8,fill:DARK},svg);
  var head=el('g',{},svg);
  el('polygon',{points:'-8,-16 8,-16 0,0',fill:ORANGE,stroke:INK,'stroke-width':1.5},head);
  el('rect',{x:-15,y:-34,width:30,height:18,rx:4,fill:DARK},head);
  el('rect',{x:-24,y:-62,width:48,height:30,rx:6,fill:VIO,stroke:INK,'stroke-width':2},head);

  function draw(P,clock){
    var complete=P>=N,k=complete?N:Math.floor(P),f=complete?0:P-k;
    var hx=CX,ty=218;
    for(var i=0;i<N;i++){
      var w=prof(i/(N-1)),x=CX,wd=0;
      if(i<k){x=CX-w;wd=2*w}
      else if(i===k&&!complete){
        wd=2*w*f;
        x=(i%2===0)?CX-w:CX+w-wd;
        hx=(i%2===0)?CX-w+wd:CX+w-wd;
        ty=BED-(i+0.5)*LH;
      }
      var L=layers[i];
      L.setAttribute('x',x.toFixed(2));
      L.setAttribute('y',(BED-(i+1)*LH+1).toFixed(2));
      L.setAttribute('width',wd.toFixed(2));
      L.setAttribute('height',(LH-1.2).toFixed(2));
    }
    if(mode==='hero'&&!complete)hx+=Math.sin(clock*1.7)*1.2;
    head.setAttribute('transform','translate('+hx.toFixed(2)+','+ty.toFixed(2)+')');
    carriage.setAttribute('x',(hx-34).toFixed(2));
    rod.setAttribute('x',(hx-3).toFixed(2));
    rod.setAttribute('height',Math.max(0,ty-62-156).toFixed(2));
    fil.setAttribute('d','M96 90 C96 126 '+hx.toFixed(2)+' 100 '+hx.toFixed(2)+' 120');
    fillBar.setAttribute('width',(38*Math.min(1,P/N)).toFixed(2));
    if(label)label.textContent=complete?'Complete':'Layer '+(k+1)+' of '+N;
  }
  return draw;
}

function create(host,opts){
  opts=opts||{};
  var mode=opts.mode||'loop';
  var draw=build(host,opts.label||null,mode);
  var st={tier:'full',visible:false,target:0.55,cur:0.55,clock:0,last:0,raf:0};
  function stillP(){return mode==='hero'?0.55*N:N}
  function frame(now){
    if(!st.last)st.last=now;
    var dt=Math.min(0.05,(now-st.last)/1000);st.last=now;st.clock+=dt;
    var P;
    if(mode==='hero'){st.cur+=(st.target-st.cur)*0.08;P=st.cur*N}
    else{P=loopP(st.clock)}
    draw(P,st.clock);
    st.raf=requestAnimationFrame(frame);
  }
  function refresh(){
    if(st.tier==='full'&&st.visible){
      if(!st.raf){st.last=0;st.raf=requestAnimationFrame(frame)}
    }else{
      if(st.raf){cancelAnimationFrame(st.raf);st.raf=0}
      if(st.tier!=='full'){
        if(mode==='hero')st.cur=0.55;
        draw(stillP(),st.clock);
      }
    }
  }
  return {
    setTier:function(t){st.tier=t;refresh()},
    setVisible:function(v){st.visible=v;refresh()},
    setTarget:function(p){st.target=p}
  };
}
window.AkPrinter={create:create};
})();
