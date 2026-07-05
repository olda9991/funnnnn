var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var info = document.getElementById('info');
var mode = 'box';
var dragBody = null;
var rtxMode = false;
var freezeMode = false;
var selectedObjs = [];
var dragWasFrozen = false;
var spaceMode = false;
var gravStrength = 1;
var planets = [];
var rocket = null;
var explosions = [];
var stars = [];
var sparks = [];
var floatingTexts = [];
var confetti = [];
var shockwaves = [];

window.SPAWNERS = [
  {name:'box',w:40,h:40,color:'#0ff',shape:'rect'},
  {name:'ball',w:36,h:36,color:'#f0f',shape:'circle'},
  {name:'triangle',w:40,h:40,color:'#ff0',shape:'poly',sides:3},
  {name:'pentagon',w:36,h:36,color:'#0f0',shape:'poly',sides:5},
  {name:'hexagon',w:32,h:32,color:'#f44',shape:'poly',sides:6},
  {name:'octagon',w:30,h:30,color:'#ff8800',shape:'poly',sides:8},
  {name:'coin',w:20,h:20,color:'#ffd700',shape:'circle'},
  {name:'brick',w:50,h:25,color:'#cc4422',shape:'rect'},
  {name:'glass',w:36,h:36,color:'rgba(100,200,255,0.5)',shape:'rect'},
  {name:'bomb',w:30,h:30,color:'#ff0000',shape:'circle'},
  {name:'ice',w:32,h:32,color:'#aaddff',shape:'rect'},
  {name:'metal',w:36,h:36,color:'#888899',shape:'rect'},
];

var COLORS = ['#0ff','#f0f','#ff0','#0f0','#f44','#ff8800','#88f','#ff0088','#00ff88','#8844ff'];
var MESSAGES = ['SMASH!','BOOM!','CRACK!','BREAK!','BAM!','POW!','KABOOM!','SPLIT!','SHATTER!'];

function addExplosion(x,y,c,f){c=c||30;f=f||5;for(var i=0;i<c;i++){var a=Math.random()*6.28,s=0.5+Math.random()*f;explosions.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:20+Math.random()*10,maxLife:30,color:COLORS[Math.floor(Math.random()*COLORS.length)],size:1+Math.random()*3});}}
function addSparks(x,y,c,color){c=c||10;for(var i=0;i<c;i++){var a=Math.random()*6.28,s=0.3+Math.random()*3;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:10+Math.random()*10,maxLife:20,color:color||'#ff0',size:0.5+Math.random()*3});}}
function addFloatingText(x,y,text,color){floatingTexts.push({x,y,text,color:color||'#fff',life:30,maxLife:30,vy:-2,vx:(Math.random()-0.5)*1.5});}
function addShockwave(x,y,r){ /* disabled for smash */ }
function addConfetti(c){c=c||20;for(var i=0;i<c;i++){confetti.push({x:Math.random()*500,y:-10-Math.random()*100,vx:(Math.random()-0.5)*4,vy:1+Math.random()*3,color:COLORS[Math.floor(Math.random()*COLORS.length)],size:2+Math.random()*6,rot:Math.random()*6.28,rotV:(Math.random()-0.5)*0.3});}}
for(var i=0;i<50;i++){stars.push({x:Math.random()*500,y:Math.random()*310,r:0.3+Math.random()*1.5,speed:0.1+Math.random()*0.5,phase:Math.random()*100,color:COLORS[Math.floor(Math.random()*COLORS.length)]});}

// AUDIO
var actx=null;
function initAudio(){try{if(!actx)actx=new(window.AudioContext||webkitAudioContext)()}catch(e){}}
function tone(f,v,d,t){try{initAudio();if(!actx)return;var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.frequency.value=f;o.type=t||'sine';g.gain.value=v||0.1;g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+(d||0.1));o.start();o.stop(actx.currentTime+(d||0.1));}catch(e){}}
function hitSound(v){tone(100+v*500,Math.min(0.15,v*0.02),0.03+v*0.03,'square');if(v>3)tone(50+v*200,0.05,0.05,'sawtooth');}
function explodeSound(){tone(80,0.25,0.3,'sawtooth');setTimeout(function(){tone(45,0.2,0.25,'sawtooth')},50);setTimeout(function(){tone(25,0.15,0.35,'sine')},100);setTimeout(function(){tone(15,0.1,0.5,'sine')},200);}
function spawnSound(){tone(500+Math.random()*500,0.06,0.04,'sine');setTimeout(function(){tone(700+Math.random()*300,0.04,0.03,'sine')},30);}
function smashSound(){tone(180,0.25,0.06,'square');tone(90,0.2,0.08,'sawtooth');setTimeout(function(){tone(60,0.12,0.1,'square')},40);}
function rtxSound(){for(var ri=0;ri<4;ri++){setTimeout(function(f){tone(f,0.08,0.08,'sine')},ri*80,600+ri*300);}}
function windSound(){tone(220,0.06,0.2,'sawtooth');tone(140,0.04,0.3,'sine');setTimeout(function(){tone(100,0.03,0.4,'sine')},50);}
function clearSound(){tone(500,0.12,0.04,'sine');setTimeout(function(){tone(400,0.1,0.04,'sine')},40);setTimeout(function(){tone(300,0.08,0.05,'sine')},80);}
function saveSound(){tone(523,0.1,0.06,'sine');setTimeout(function(){tone(659,0.1,0.06,'sine')},60);setTimeout(function(){tone(784,0.1,0.1,'sine')},120);}
function loadSound(){tone(784,0.1,0.06,'sine');setTimeout(function(){tone(659,0.1,0.06,'sine')},60);setTimeout(function(){tone(523,0.1,0.1,'sine')},120);}
function nukeAlert(){for(var ni=0;ni<8;ni++){setTimeout(function(){tone(150+Math.random()*500,0.12,0.08,'sawtooth')},ni*80);}}
function bounceSound(){tone(300+Math.random()*200,0.04,0.03,'sine');}
function chainSound(){tone(800,0.08,0.05,'sine');setTimeout(function(){tone(600,0.08,0.05,'sine')},50);}
function partySound(){tone(400,0.06,0.04,'sine');setTimeout(function(){tone(500,0.06,0.04,'sine')},40);setTimeout(function(){tone(600,0.06,0.04,'sine')},80);setTimeout(function(){tone(700,0.06,0.04,'sine')},120);}
function boomSound(){tone(60,0.3,0.4,'sawtooth');setTimeout(function(){tone(30,0.2,0.5,'sine')},100);}
function debrisSound(){tone(200+Math.random()*400,0.02,0.02,'sine');}

// BREAK OBJECT INTO PIECES (Teardown-style)
function breakObject(p, silent) {
  if (!p || !p.body || !world) return;
  if (p.debris) return; // Already debris
  
  var ox = p.x, oy = p.y, ow = p.w, oh = p.h, oc = p.color;
  var shape = p.shape;
  var sides = p.sides;
  
  // Remove original
  Matter.World.remove(world, p.body);
  var pi = props.indexOf(p);
  if (pi >= 0) props.splice(pi, 1);
  
  // Spawn 4-10 smaller pieces
  var n = 4 + Math.floor(Math.random() * 7);
  if (ow < 25 || oh < 25) n = 2 + Math.floor(Math.random() * 4);
  
  for (var i = 0; i < n; i++) {
    var fw = Math.max(4, ow * (0.2 + Math.random() * 0.4));
    var fh = Math.max(4, oh * (0.2 + Math.random() * 0.4));
    var fx = ox + (Math.random()-0.5) * ow * 0.6;
    var fy = oy + (Math.random()-0.5) * oh * 0.6;
    
    var body = Matter.Bodies.rectangle(fx, fy, fw, fh, {restitution:0.15, friction:0.5, density:0.001});
    Matter.Body.setVelocity(body, {x: (Math.random()-0.5)*12, y: -3-Math.random()*8});
    Matter.Body.setAngularVelocity(body, (Math.random()-0.5)*0.8);
    Matter.World.add(world, body);
    props.push({
      id: nextId++, x: fx, y: fy, w: fw, h: fh, angle: 0,
      color: oc, vx: 0, vy: 0, frozen: false,
      body: body, shape: 'rect', debris: true
    });
  }
  
  if (!silent) {
    addExplosion(ox, oy, 15, 5);
    addShockwave(ox, oy, 40);
    addFloatingText(ox-20, oy-20, MESSAGES[Math.floor(Math.random()*MESSAGES.length)], '#f44');
  }
  hitSound(2);
}

document.addEventListener('click', function(e) {
  var btn = e.target.closest('.tbtn,button');
  if (!btn) return;
  if (btn.id === 'clear-all') {
    for (var i = props.length-1; i >= 0; i--) { if (props[i].body && world) try { Matter.World.remove(world, props[i].body); } catch(ex) {} }
    props.length = 0;
    for (var k in {trailParticles:0,explosions:0,sparks:0,floatingTexts:0,chains:0,confetti:0,shockwaves:0,lightning:0,blackholes:0,magnets:0}) { try { eval(k+'=[]') } catch(ex) {} }
    clearSound(); info.textContent='Cleared!'; return;
  }
  if (btn.id === 'nuke-btn') {
    nukeAlert();
    for (var ni = props.length-1; ni >= 0; ni--) { if (!props[ni].debris) breakObject(props[ni]); }
    addExplosion(250,150,80,12); addShockwave(250,150,300); explodeSound();     info.textContent='NUKED!'; return;
  }
  if (btn.id === 'save1-btn' || btn.id === 'save2-btn' || btn.id === 'save3-btn') {
    var slot = btn.id.replace('save','').replace('-btn','');
    try { var d=[]; for(var i=0;i<props.length;i++){var p=props[i];if(!p.body)continue;d.push({x:p.x,y:p.y,w:p.w,h:p.h,color:p.color,shape:p.shape,sides:p.sides,debris:p.debris,vx:p.body.velocity.x,vy:p.body.velocity.y,angle:p.body.angle});} localStorage.setItem('tdsave'+slot,JSON.stringify(d)); addFloatingText(250,130,'SAVED SLOT '+slot+'!','#0f0'); saveSound(); } catch(e){}
    return;
  }
  if (btn.id === 'load1-btn' || btn.id === 'load2-btn' || btn.id === 'load3-btn') {
    var slot = btn.id.replace('load','').replace('-btn','');
    try { var r=localStorage.getItem('tdsave'+slot);if(!r){addFloatingText(250,130,'SLOT '+slot+' EMPTY','#ff0');return;} var d=JSON.parse(r);
    for(var i=props.length-1;i>=0;i--){if(props[i].body&&world)try{Matter.World.remove(world,props[i].body)}catch(ex){}}
    props=[];
    for(var i=0;i<d.length;i++){var o=d[i];var b=Matter.Bodies.rectangle(o.x,o.y,o.w,o.h,{restitution:0.15,friction:0.5,density:o.debris?0.001:0.002});Matter.Body.setVelocity(b,{x:o.vx||0,y:o.vy||0});Matter.Body.setAngle(b,o.angle||0);Matter.World.add(world,b);props.push({id:nextId++,x:o.x,y:o.y,w:o.w,h:o.h,angle:o.angle||0,color:o.color,vx:0,vy:0,frozen:false,body:b,shape:o.shape||'rect',sides:o.sides,debris:o.debris});}
    addFloatingText(250,130,'LOADED SLOT '+slot+'!','#0ff'); loadSound(); } catch(e){ addFloatingText(250,130,'LOAD FAILED','#f00'); }
    return;
  }
  if (btn.id === 'resetrot-btn') {
    var targets = dragBody ? [dragBody] : selectedObjs.map(function(o){return o.body;});
    var count = 0;
    for (var rri = 0; rri < targets.length; rri++) {
      if (targets[rri]) { Matter.Body.setAngle(targets[rri], 0); Matter.Body.setAngularVelocity(targets[rri], 0); count++; }
    }
    if (count > 0) addFloatingText(250, 130, 'ANGLE RESET ('+count+')', '#0ff');
    else info.textContent = 'Select or hold an object first';
    return;
  }
  if (btn.id === 'freeze-btn') {
    // If dragging, toggle based on ORIGINAL state (before drag), not current drag state
    if (dragBody) {
      dragWasFrozen = !dragWasFrozen;
      dragBody.isStatic = dragWasFrozen;
      btn.textContent = dragWasFrozen ? 'Frozen' : 'Freeze';
      addFloatingText(dragBody.position.x, dragBody.position.y-20, dragWasFrozen ? 'FROZEN!' : 'UNFROZEN!', dragWasFrozen ? '#0ff' : '#ff0');
      return;
    }
    if (selectedObjs.length > 0) {
      var allFrozen2 = true;
      for (var sfi = 0; sfi < selectedObjs.length; sfi++) {
        if (!selectedObjs[sfi].body || !selectedObjs[sfi].body.isStatic) { allFrozen2 = false; break; }
      }
      var newState = !allFrozen2;
      for (var si = 0; si < selectedObjs.length; si++) {
        if (selectedObjs[si].body) selectedObjs[si].body.isStatic = newState;
      }
      btn.textContent = newState ? 'Frozen' : 'Freeze';
      addFloatingText(250, 130, newState ? 'SELECTED FROZEN!' : 'SELECTED UNFROZEN!', newState ? '#0ff' : '#ff0');
    } else {
      // No selection, freeze/unfreeze all non-debris
      var anyFrozen = false;
      for (var fi = 0; fi < props.length; fi++) {
        if (props[fi].body && !props[fi].debris && props[fi].body.isStatic) { anyFrozen = true; break; }
      }
      for (var fi = 0; fi < props.length; fi++) {
        if (props[fi].body && !props[fi].debris) props[fi].body.isStatic = !anyFrozen;
      }
      btn.textContent = anyFrozen ? 'Freeze' : 'Frozen';
      addFloatingText(250, 140, anyFrozen ? 'ALL UNFROZEN!' : 'ALL FROZEN!', anyFrozen ? '#ff0' : '#0ff');
    }
    return;
  }
  if (btn.id === 'rtx-btn') {
    rtxMode = !rtxMode;
    btn.textContent = rtxMode ? 'RTX:ON' : 'RTX:OFF';
    btn.style.borderColor = rtxMode ? '#0ff' : '';
    info.textContent = rtxMode ? 'RTX MODE ON - glow + reflections!' : 'RTX OFF';
    if (rtxMode) rtxSound();
    return;
  }
  if (btn.id === 'confetti-btn') { addConfetti(50); return; }
  if (btn.id === 'gravity-toggle') { if(engine){engine.gravity.y=engine.gravity.y===0?1:0;var g=engine.gravity.y>0;tone(g?200:100,0.08,0.1,'sine');} info.textContent=engine&&engine.gravity.y>0?'Gravity ON':'Gravity OFF'; return; }
  if (btn.id === 'wind-toggle') { if(engine){var gx=engine.gravity.x;engine.gravity.x=gx===0?0.6:(gx===0.6?-0.6:0)} info.textContent=engine?'Wind: '+(engine.gravity.x>0?'RIGHT':engine.gravity.x<0?'LEFT':'OFF'):''; windSound(); return; }
  if (btn.id === 'space-btn') {
    spaceMode = !spaceMode;
    btn.textContent = spaceMode ? 'Space' : 'Space';
    btn.style.borderColor = spaceMode ? '#0ff' : '';
    if (spaceMode) {
      if (engine) engine.gravity.y = 0;
      document.getElementById('grav-slider').value = 0;
      document.getElementById('grav-val').textContent = '0.0';
      gravStrength = 0;
      // Add more stars
      for (var asi = 0; asi < 30; asi++) {
        stars.push({x:Math.random()*540, y:Math.random()*360, r:0.5+Math.random()*2, speed:0.05+Math.random()*0.2, phase:Math.random()*100, color:'#fff'});
      }
    } else {
      if (engine) engine.gravity.y = gravStrength;
    }
    info.textContent = spaceMode ? 'SPACE MODE - zero gravity! Planets attract objects' : 'Space mode off';
    return;
  }
  if (btn.id === 'planet-btn') {
    var pr = 20 + Math.random() * 20;
    var px2 = 270 + (Math.random()-0.5)*200;
    var py2 = 180 + (Math.random()-0.5)*100;
    var pcolor = 'hsl('+Math.floor(Math.random()*360)+',80%,60%)';
    var pbody = Matter.Bodies.circle(px2, py2, pr, {isStatic:true, restitution:0.5, friction:0.8});
    Matter.World.add(world, pbody);
    planets.push({x:px2, y:py2, radius:pr, strength:0.002+Math.random()*0.004, color:pcolor, body:pbody});
    addFloatingText(px2, py2-pr-10, 'PLANET!','#0ff');
    return;
  }
  if (btn.id === 'rocket-btn') {
    var rp = spawnFromTemplate({name:'rocket', w:10, h:28, color:'#ff8800', shape:'rect'});
    if (rp && rp.body) {
      Matter.Body.setPosition(rp.body, {x:200+Math.random()*140, y:80});
      Matter.Body.setVelocity(rp.body, {x:(Math.random()-0.5)*1.5, y:-10-Math.random()*3});
      addExplosion(270,330,15,4);
      addFloatingText(250,310,'LAUNCH!','#ff0');
      rocket = rp;
      rocket.life = 120; // frames until explosion
    }
    return;
  }
  if (btn.id === 'load-png-btn') {
    var input = document.getElementById('png-input');
    input.value = '';
    input.onchange = function(ev) {
      var file = ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev2) {
        var img = new Image();
        img.onload = function() {
          var maxDim = 100;
          var sc = Math.min(maxDim/img.width, maxDim/img.height, 1);
          var cw2 = Math.floor(img.width * sc);
          var ch2 = Math.floor(img.height * sc);
          var tc = document.createElement('canvas');
          tc.width = cw2; tc.height = ch2;
          var tctx = tc.getContext('2d');
          tctx.imageSmoothingEnabled = false;
          tctx.drawImage(img, 0, 0, cw2, ch2);
          window._pngData = {data:tctx.getImageData(0,0,cw2,ch2), w:cw2, h:ch2};
          // Sample color
          var d = window._pngData.data; var tr=0,tg=0,tb=0,c=0;
          for(var pi=0;pi<d.data.length;pi+=4){if(d.data[pi+3]>128){tr+=d.data[pi];tg+=d.data[pi+1];tb+=d.data[pi+2];c++;}}
          window._pngColor = c>0?'rgb('+Math.floor(tr/c)+','+Math.floor(tg/c)+','+Math.floor(tb/c)+')':'#0ff';
          addFloatingText(270,180,'PNG LOADED!','#0ff');
          info.textContent = 'PNG loaded! Click to spawn as physics object';
        };
        img.src = ev2.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
    return;
  }
  if (btn.id === 'window-btn') {
    try {
      chrome.windows.create({url:'popup.html', type:'popup', width:580, height:650, focused:true});
    } catch(e) {
      info.textContent = 'Window mode not available';
    }
    return;
  }
  if (btn.id === 'grav-slider' || btn.target === document.getElementById('grav-slider')) {
    // handled by input event below
  }
  if (btn.id === 'custom-btn') {
    var panel = document.getElementById('custom-panel');
    if (panel) {
      var isOpen = panel.style.display !== 'none';
      panel.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) {
        mode = 'custom';
        document.querySelectorAll('.tbtn').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        document.getElementById('cust-w').oninput = function(){document.getElementById('cust-wv').textContent=this.value;};
        document.getElementById('cust-h').oninput = function(){document.getElementById('cust-hv').textContent=this.value;};
        info.textContent = 'Custom mode - adjust sliders, click to spawn';
      } else {
        mode = 'box';
        info.textContent = 'Custom panel closed';
      }
    }
    return;
  }
  
  var m = btn.dataset.mode;
  if (m) { mode=m; shockwaves=[]; document.querySelectorAll('.tbtn').forEach(function(b){b.classList.remove('active')}); btn.classList.add('active'); info.textContent=m.charAt(0).toUpperCase()+m.slice(1)+' mode'; }
});

canvas.addEventListener('mousedown', function(e) {
  var r = canvas.getBoundingClientRect();
  var mx = e.clientX - r.left, my = e.clientY - r.top;
  var isRightClick = e.button === 2;
  
  if (mode === 'explode') { addExplosion(mx,my,40,8); tone(80,0.2,0.3,'sawtooth');
    for(var i=0;i<props.length;i++){if(props[i].body){var dx=props[i].x-mx,dy=props[i].y-my,d=Math.sqrt(dx*dx+dy*dy);if(d<200&&d>1)Matter.Body.applyForce(props[i].body,props[i].body.position,{x:dx/d*(200-d)*0.0004,y:dy/d*(200-d)*0.0004});}}
    return; }
  
  if (mode === 'smash') {
    // Smash - breaks into debris, NO explosion/shockwave
    shockwaves = []; // Clear any leftover shockwaves
    var objs = selectedObjs.length > 0 ? selectedObjs : [];
    if (objs.length === 0) {
      for (var smi = 0; smi < props.length; smi++) {
        if (props[smi].body && !props[smi].debris) {
          var smb = props[smi].body.bounds;
          if (mx >= smb.min.x && mx <= smb.max.x && my >= smb.min.y && my <= smb.max.y) {
            objs = [props[smi]]; break;
          }
        }
      }
    }
    for (var smi2 = objs.length-1; smi2 >= 0; smi2--) {
      var o = objs[smi2];
      if (o && o.body && world) {
        var ox = o.x, oy = o.y, ow = o.w, oh = o.h, oc = o.color;
        Matter.World.remove(world, o.body);
        var idx = props.indexOf(o);
        if (idx >= 0) props.splice(idx, 1);
        // Spawn debris fragments - no explosion/shockwave
        var n = 4 + Math.floor(Math.random() * 9); // 4-12 debris
        for (var di = 0; di < n; di++) {
          var fw = Math.max(3, ow * (0.1 + Math.random() * 0.25));
          var fh = Math.max(3, oh * (0.1 + Math.random() * 0.25));
          var fb = Matter.Bodies.rectangle(ox, oy, fw, fh, {restitution:0.1, friction:0.5, density:0.001});
          Matter.Body.setVelocity(fb, {x: (Math.random()-0.5)*10, y: -3-Math.random()*6});
          Matter.Body.setAngularVelocity(fb, (Math.random()-0.5)*0.6);
          Matter.World.add(world, fb);
          props.push({
            id: nextId++, x: ox, y: oy, w: fw, h: fh, angle: 0,
            color: oc, vx: 0, vy: 0, frozen: false,
            body: fb, shape: 'rect', debris: true
          });
        }
      }
    }
    if (objs.length > 0) {
      selectedObjs = [];
      smashSound();
    }
    return;
  }
  
  // Right-click or normal click on object = drag
  for (var i = props.length-1; i >= 0; i--) {
    if (props[i].body) {
      var b = props[i].body.bounds;
      if (mx >= b.min.x && mx <= b.max.x && my >= b.min.y && my <= b.max.y) {
        if (isRightClick) {
          // Right-click = drag (preserve frozen state)
          dragBody = props[i].body;
          dragWasFrozen = dragBody.isStatic;
          dragBody.isStatic = true;
          addSparks(mx,my,5,'#fff');
        } else {
          // Left-click = select (Ctrl = toggle multi-select)
          var idx2 = selectedObjs.indexOf(props[i]);
          if (e.ctrlKey || e.shiftKey) {
            if (idx2 >= 0) selectedObjs.splice(idx2, 1);
            else selectedObjs.push(props[i]);
          } else {
            selectedObjs = [props[i]];
          }
          var selCount = selectedObjs.length;
          addFloatingText(mx, my-15, 'SELECTED! ('+selCount+')', '#0ff');
          var fbtn = document.getElementById('freeze-btn');
          if (fbtn) fbtn.textContent = 'Freeze';
        }
        return;
      }
    }
  }
  
  // Click on empty space = deselect all
  selectedObjs = [];
  var fbtn2 = document.getElementById('freeze-btn');
  if (fbtn2) fbtn2.textContent = 'Freeze';
  
  // Spawn object
  var names = ['box','ball','triangle','pentagon','hexagon','octagon','coin','brick','glass','bomb','ice','metal'];
  var idx = names.indexOf(mode);
  if (mode === 'custom') {
    var cw = parseInt(document.getElementById('cust-w').value) || 30;
    var ch = parseInt(document.getElementById('cust-h').value) || 30;
    var cc = document.getElementById('cust-color').value || '#0ff';
    if (window._pngData) {
      cw = window._pngData.w; ch = window._pngData.h;
      cc = window._pngColor || cc;
    }
    var p = spawnFromTemplate({name:'custom', w:cw, h:ch, color:cc, shape:'rect'});
    if (p && p.body) { Matter.Body.setPosition(p.body, {x:mx, y:my}); Matter.Body.setVelocity(p.body, {x:0, y:0}); if(window._pngData) p.pngData = window._pngData; }
    addSparks(mx,my,4,cc); spawnSound();
  } else if (idx >= 0) {
    var p = spawnFromTemplate(idx);
    if (p && p.body) {
      Matter.Body.setPosition(p.body, {x:mx, y:my});
      Matter.Body.setVelocity(p.body, {x:0, y:0});
    }
    addSparks(mx,my,4,p?p.color:'#fff');
    spawnSound();
  }
});

canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

canvas.addEventListener('mousemove', function(e) {
  if (!dragBody) return;
  var r = canvas.getBoundingClientRect();
  Matter.Body.setPosition(dragBody, {x: e.clientX - r.left, y: e.clientY - r.top});
});

canvas.addEventListener('mouseup', function() { if(dragBody){dragBody.isStatic=dragWasFrozen;dragBody=null;dragWasFrozen=false} });
canvas.addEventListener('mouseleave', function() { if(dragBody){dragBody.isStatic=dragWasFrozen;dragBody=null;dragWasFrozen=false} });

document.addEventListener('keydown', function(e) {
  var map={'1':'box','2':'ball','3':'triangle','4':'pentagon','5':'hexagon','6':'octagon','7':'coin','8':'brick','9':'glass','0':'bomb','q':'ice','w':'metal','a':'explode','s':'smash','c':'clear-all','x':'nuke-btn','r':'rtx-btn','e':'etd-btn','g':'gravity-toggle','f':'wind-toggle','p':'confetti-btn','z':'save1-btn','l':'load1-btn','v':'save2-btn','b':'load2-btn','n':'save3-btn','m':'load3-btn','t':'freeze-btn','y':'resetrot-btn','u':'space-btn','i':'planet-btn','o':'rocket-btn'};
  var btn2 = document.getElementById(map[e.key]);
  if (btn2) btn2.click();
  if (e.key === ' ') {
    for (var si = 0; si < props.length; si++) {
      if (props[si].body) Matter.Body.applyForce(props[si].body,props[si].body.position,{x:(Math.random()-0.5)*0.1,y:-0.1});
    }
  }
});

// Collision handler
if (engine) {
  Matter.Events.on(engine, 'collisionStart', function(event) {
    for (var ci = 0; ci < event.pairs.length; ci++) {
      var vel = Math.sqrt(Math.pow(event.pairs[ci].bodyA.velocity.x-event.pairs[ci].bodyB.velocity.x,2)+Math.pow(event.pairs[ci].bodyA.velocity.y-event.pairs[ci].bodyB.velocity.y,2));
      if (vel > 4) {
        var cx = (event.pairs[ci].bodyA.position.x+event.pairs[ci].bodyB.position.x)/2;
        var cy = (event.pairs[ci].bodyA.position.y+event.pairs[ci].bodyB.position.y)/2;
        addSparks(cx,cy,5+Math.floor(vel),'#ff0');
        hitSound(Math.min(1,vel*0.05));
        if (vel > 6 && Math.random() < 0.1) addSparks(cx,cy,2,'#ff0');
        // Break objects on hard collision
        for (var pi = 0; pi < props.length; pi++) {
          if (!props[pi].debris && (props[pi].body === event.pairs[ci].bodyA || props[pi].body === event.pairs[ci].bodyB)) {
            if (vel > 7) breakObject(props[pi], true); // Silent break
          }
        }
      }
    }
  });
}

// Gravity slider
document.getElementById('grav-slider').addEventListener('input', function() {
  var val = this.value / 10;
  document.getElementById('grav-val').textContent = val.toFixed(1);
  if (engine) { engine.gravity.y = val; }
});

initPhysics({canvas:canvas});

// Render loop
var lastTime = Date.now()/1000;
function loop() {
  var now = Date.now()/1000;
  var dt = Math.min(now-lastTime,0.05);
  lastTime = now;
  stepPhysics(dt);
  
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,500,310);
  
  // Stars
  for (var si = 0; si < stars.length; si++) {
    var st = stars[si]; var alpha = 0.2+0.8*Math.sin(now*st.speed+st.phase);
    ctx.fillStyle = st.color; ctx.globalAlpha = alpha*0.4;
    ctx.beginPath(); ctx.arc(st.x,st.y,st.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0,345); ctx.lineTo(540,345); ctx.stroke();
  ctx.fillStyle = 'rgba(30,30,50,0.3)'; ctx.fillRect(0,347,540,8);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,345); ctx.lineTo(540,345); ctx.stroke();
  
  // Shockwaves
  for (var swi = shockwaves.length-1; swi >= 0; swi--) {
    var sw = shockwaves[swi]; sw.radius += 4; sw.life--;
    var swAlpha = sw.life/sw.maxLife;
    ctx.strokeStyle = '#0ff'; ctx.globalAlpha = swAlpha*0.3;
    ctx.beginPath(); ctx.arc(sw.x,sw.y,sw.radius,0,Math.PI*2); ctx.stroke();
    if (sw.life <= 0) shockwaves.splice(swi,1);
  }
  ctx.globalAlpha = 1;
  
  // Objects
  var objCount = 0, debrisCount = 0;
  for (var i2 = 0; i2 < props.length; i2++) {
    var p2 = props[i2];
    if (!p2.body) continue;
    if (p2.debris) debrisCount++; else objCount++;
    
    ctx.save(); ctx.translate(p2.x,p2.y); ctx.rotate(p2.angle||0);
    ctx.fillStyle = p2.color||'#888';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    
    if (p2.pngData) {
      // Render PNG texture
      if (p2.pngData.data) {
        try {
          var tempC = document.createElement('canvas');
          tempC.width = p2.pngData.w; tempC.height = p2.pngData.h;
          var tempCTX = tempC.getContext('2d');
          tempCTX.putImageData(p2.pngData.data, 0, 0);
          ctx.drawImage(tempC, -p2.w/2, -p2.h/2, p2.w, p2.h);
        } catch(ex) { ctx.fillRect(-p2.w/2,-p2.h/2,p2.w,p2.h); }
      }
    } else if (p2.debris) {
      ctx.fillRect(-p2.w/2,-p2.h/2,p2.w,p2.h);
    } else {
      if (p2.shape === 'circle') { var rr=Math.max(1,Math.min(p2.w,p2.h)/2); ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
      else if (p2.shape === 'poly' && p2.sides) { ctx.beginPath(); for (var s=0;s<=p2.sides;s++){var a2=(s/p2.sides)*6.28;var px=Math.cos(a2)*p2.w/2;var py=Math.sin(a2)*p2.h/2;if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);} ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { ctx.fillRect(-p2.w/2,-p2.h/2,p2.w,p2.h); ctx.strokeRect(-p2.w/2,-p2.h/2,p2.w,p2.h); }
    }
    ctx.restore();
  }
  
  // Sparks
  for (var spi = sparks.length-1; spi >= 0; spi--) {
    var sp = sparks[spi]; sp.x+=sp.vx; sp.y+=sp.vy; sp.vx*=0.92; sp.vy*=0.92; sp.life--;
    var a3 = sp.life/sp.maxLife;
    ctx.fillStyle = sp.color; ctx.globalAlpha = a3;
    ctx.beginPath(); ctx.arc(sp.x,sp.y,Math.max(0,sp.size*a3),0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    if (sp.life <= 0) sparks.splice(spi,1);
  }
  
  // Explosions
  for (var ei = explosions.length-1; ei >= 0; ei--) {
    var ex = explosions[ei]; ex.x+=ex.vx; ex.y+=ex.vy; ex.vx*=0.97; ex.vy*=0.97; ex.life--;
    var a4 = ex.life/ex.maxLife;
    ctx.fillStyle = ex.color; ctx.globalAlpha = a4;
    ctx.beginPath(); ctx.arc(ex.x,ex.y,Math.max(0,ex.size*a4),0,Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    if (ex.life <= 0) explosions.splice(ei,1);
  }
  
  // Floating texts
  for (var fti = floatingTexts.length-1; fti >= 0; fti--) {
    var ft = floatingTexts[fti]; ft.y+=ft.vy; ft.vy-=0.02; ft.life--;
    var a5 = ft.life/ft.maxLife;
    ctx.fillStyle = ft.color; ctx.globalAlpha = a5; ctx.font = '12px mono';
    ctx.fillText(ft.text,ft.x-20,ft.y);
    ctx.globalAlpha = 1;
    if (ft.life <= 0) floatingTexts.splice(fti,1);
  }
  
  // Confetti
  for (var cfi = confetti.length-1; cfi >= 0; cfi--) {
    var cf = confetti[cfi]; cf.x+=cf.vx; cf.y+=cf.vy; cf.vy+=0.1; cf.rot+=cf.rotV;
    ctx.save(); ctx.translate(cf.x,cf.y); ctx.rotate(cf.rot);
    ctx.fillStyle = cf.color; ctx.globalAlpha = 0.8;
    ctx.fillRect(-cf.size/2,-cf.size/2,cf.size,cf.size);
    ctx.restore(); ctx.globalAlpha = 1;
    if (cf.y > 320) confetti.splice(cfi,1);
  }
  
  // Planet gravity attraction + physics
  for (var pli = 0; pli < planets.length; pli++) {
    var pl = planets[pli];
    // Update planet position from physics body
    if (pl.body) { pl.x = pl.body.position.x; pl.y = pl.body.position.y; }
    
    for (var pj = 0; pj < props.length; pj++) {
      if (props[pj].body && props[pj] !== pl) {
        var pdx = pl.x - props[pj].x, pdy = pl.y - props[pj].y, pd = Math.sqrt(pdx*pdx + pdy*pdy);
        if (pd > pl.radius && pd < 300) Matter.Body.applyForce(props[pj].body, props[pj].body.position, {x: pdx/pd * pl.strength * (300-pd)/300 * 50, y: pdy/pd * pl.strength * (300-pd)/300 * 50});
      }
    }
    // Draw planet with glow
    ctx.save();
    ctx.shadowColor = pl.color; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.radius, 0, 6.28);
    var grad2 = ctx.createRadialGradient(pl.x-pl.radius*0.3, pl.y-pl.radius*0.3, 2, pl.x, pl.y, pl.radius);
    grad2.addColorStop(0, '#fff'); grad2.addColorStop(0.2, pl.color); grad2.addColorStop(0.7, '#222'); grad2.addColorStop(1, '#000');
    ctx.fillStyle = grad2; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
    ctx.shadowBlur = 0;
    // Atmosphere ring
    ctx.strokeStyle = 'rgba('+[parseInt(pl.color.slice(1,3),16),parseInt(pl.color.slice(3,5),16),parseInt(pl.color.slice(5,7),16)].join(',')+',0.15)';
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pl.x, pl.y, pl.radius+5, 0, 6.28); ctx.stroke();
    ctx.restore();
    // Label
    ctx.fillStyle = '#555'; ctx.font = '6px mono'; ctx.fillText('PLANET', pl.x-14, pl.y+pl.radius+12);
  }
  
  // Rocket trail + ground impact
  if (rocket && rocket.body) {
    rocket.life = (rocket.life || 120) - 1;
    var rv = rocket.body;
    var rspd = Math.sqrt(rv.velocity.x*rv.velocity.x + rv.velocity.y*rv.velocity.y);
    // Trail
    if (rspd > 1) {
      var rx2 = rocket.x + (Math.random()-0.5)*6;
      var ry2 = rocket.y + rocket.h/2 + Math.random()*5;
      explosions.push({x:rx2, y:ry2, vx:(Math.random()-0.5)*2, vy:1+Math.random()*3, life:12, maxLife:15, color:'#ff8800', size:2+Math.random()*3});
      explosions.push({x:rx2-2+Math.random()*4, y:ry2-2, vx:(Math.random()-0.5)*1, vy:0.5+Math.random()*2, life:8, maxLife:12, color:'#ff0', size:1+Math.random()*2});
    }
    // Explode on ground hit or timeout
    if (rocket.y > 350 || rocket.life <= 0 || (rspd < 0.5 && rocket.y > 300)) {
      addExplosion(rocket.x, rocket.y, 30, 8);
      addShockwave(rocket.x, rocket.y, 80);
      explodeSound();
      // Remove rocket
      if (rocket.body && world) Matter.World.remove(world, rocket.body);
      var ri2 = props.indexOf(rocket); if (ri2 >= 0) props.splice(ri2, 1);
      rocket = null;
    }
  }
  
  // CINEMATIC SKY
  if (!spaceMode) {
    var skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, 'rgba(15,25,60,0.25)');
    skyGrad.addColorStop(0.15, 'rgba(25,45,90,0.2)');
    skyGrad.addColorStop(0.35, 'rgba(40,70,140,0.12)');
    skyGrad.addColorStop(0.55, 'rgba(60,100,180,0.08)');
    skyGrad.addColorStop(0.75, 'rgba(80,130,210,0.04)');
    skyGrad.addColorStop(1, 'rgba(0,0,30,0)');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, 540, 360);
    // Horizon glow
    var hGrad = ctx.createLinearGradient(0, 260, 0, 360);
    hGrad.addColorStop(0, 'rgba(200,150,100,0)');
    hGrad.addColorStop(0.4, 'rgba(220,170,120,0.03)');
    hGrad.addColorStop(0.7, 'rgba(255,200,150,0.04)');
    hGrad.addColorStop(1, 'rgba(255,220,180,0.06)');
    ctx.fillStyle = hGrad; ctx.fillRect(0, 260, 540, 100);
    // Stars twinkling in upper sky
    for (var ssi = 0; ssi < 15; ssi++) {
      var sx4 = (ssi * 37 + now * 5) % 540;
      var sy4 = 5 + (ssi * 13) % 50;
      var sa = 0.2 + 0.3 * Math.sin(now * 2 + ssi * 4.7);
      ctx.fillStyle = 'rgba(255,255,255,'+sa+')'; ctx.beginPath(); ctx.arc(sx4, sy4, 0.5+Math.sin(now+ssi)*0.3, 0, 6.28); ctx.fill();
    }
    // Clouds with depth layers
    for (var ci = 0; ci < 18; ci++) {
      var cx2 = ((now * (8+ci%3*3) + ci * 180) % 600) - 30;
      var cy2 = 15 + ci * 7 + Math.sin(now * 0.08 + ci * 0.5) * 10;
      var cw2 = 25+Math.sin(now*0.06+ci)*15 + ci*2;
      var ch2 = 4+Math.sin(now*0.04+ci)*2 + ci*0.3;
      ctx.fillStyle = 'rgba(255,255,255,'+(0.005+ci*0.001)+')';
      ctx.beginPath(); ctx.ellipse(cx2, cy2, cw2, ch2, 0, 0, 6.28); ctx.fill();
    }
    // Sun with rays
    var sunX = 380 + Math.sin(now * 0.02) * 120;
    var sunY = 40 + Math.sin(now * 0.03 + 1) * 25;
    for (var sri = 0; sri < 12; sri++) {
      var srAng = now * 0.1 + sri * 0.523;
      ctx.strokeStyle = 'rgba(255,200,100,'+(0.008+0.004*Math.sin(now*0.5+sri))+')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sunX, sunY); ctx.lineTo(sunX+Math.cos(srAng)*120, sunY+Math.sin(srAng)*80); ctx.stroke();
    }
    var sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, 50);
    sunGrad.addColorStop(0, 'rgba(255,255,220,0.12)'); sunGrad.addColorStop(0.3, 'rgba(255,220,150,0.08)');
    sunGrad.addColorStop(0.6, 'rgba(255,180,100,0.04)'); sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(sunX, sunY, 50, 0, 6.28); ctx.fill();
  }
  
  // CINEMATIC SPACE
  if (spaceMode) {
    var spaceGrad = ctx.createRadialGradient(270, 180, 5, 270, 180, 500);
    spaceGrad.addColorStop(0, 'rgba(0,0,40,0.12)'); spaceGrad.addColorStop(0.4, 'rgba(0,0,15,0.06)');
    spaceGrad.addColorStop(0.8, 'rgba(5,0,10,0.02)'); spaceGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spaceGrad; ctx.fillRect(0,0,540,360);
    // Nebulas
    for (var ni3 = 0; ni3 < 5; ni3++) {
      var nx = 50 + ni3 * 120 + Math.sin(now * 0.05 + ni3 * 1.3) * 60;
      var ny = 60 + ni3 * 55 + Math.cos(now * 0.04 + ni3 * 0.9) * 40;
      var nebGrad = ctx.createRadialGradient(nx, ny, 5, nx, ny, 100+ni3*20);
      nebGrad.addColorStop(0, 'hsla('+(ni3*72+now*10)+',70%,60%,0.025)');
      nebGrad.addColorStop(0.5, 'hsla('+(ni3*72+now*10+60)+',60%,40%,0.015)');
      nebGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebGrad; ctx.beginPath(); ctx.arc(nx, ny, 100+ni3*20, 0, 6.28); ctx.fill();
    }
    // Shooting stars
    if (Math.random() < 0.005) {
      var ssx = Math.random()*540, ssy = Math.random()*180;
      var ssAng = 0.5 + Math.random() * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ssx, ssy); ctx.lineTo(ssx+30, ssy+20); ctx.stroke();
    }
  }

  
  // RTX CINEMATIC
  if (rtxMode) {
    // God rays filter
    ctx.fillStyle = 'rgba(255,200,100,0.005)';
    for (var gri = 0; gri < 5; gri++) {
      var grx = 200 + gri * 60 + Math.sin(now * 0.3 + gri) * 20;
      ctx.beginPath(); ctx.moveTo(grx-5, 0); ctx.lineTo(grx-50, 360); ctx.lineTo(grx+50, 360); ctx.lineTo(grx+5, 0); ctx.fill();
    }
    // Sky/space glow integration
    if (!spaceMode) {
      var skyGlow = ctx.createRadialGradient(270, 0, 10, 270, 0, 400);
      skyGlow.addColorStop(0, 'hsla('+(now*15%360)+',80%,70%,0.05)');
      skyGlow.addColorStop(0.4, 'hsla('+((now*15+90)%360)+',80%,60%,0.03)');
      skyGlow.addColorStop(0.8, 'hsla('+((now*15+180)%360)+',60%,40%,0.01)');
      skyGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = skyGlow; ctx.fillRect(0,0,540,360);
    }
    if (spaceMode) {
      var spaceGlow = ctx.createRadialGradient(270, 180, 10, 270, 180, 450);
      spaceGlow.addColorStop(0, 'hsla('+(now*12%360)+',100%,70%,0.05)');
      spaceGlow.addColorStop(0.3, 'hsla('+((now*12+120)%360)+',100%,60%,0.03)');
      spaceGlow.addColorStop(0.6, 'hsla('+((now*12+240)%360)+',80%,40%,0.02)');
      spaceGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = spaceGlow; ctx.fillRect(0,0,540,360);
    }
    
    // Screen-wide effects
    var shakeAmp = 0;
    for (var ri = 0; ri < props.length; ri++) {
      if (props[ri].body && !props[ri].debris) {
        var px = props[ri].x, py = props[ri].y, pw = props[ri].w, ph = props[ri].h;
        var pulse = 0.5 + 0.5 * Math.sin(now * 3 + ri * 0.7);
        var hue = (now * 25 + ri * 50) % 360;
        var spd2 = 0;
        
        if (props[ri].body) {
          spd2 = Math.sqrt(Math.pow(props[ri].body.velocity.x,2)+Math.pow(props[ri].body.velocity.y,2));
          if (spd2 > 5) shakeAmp = Math.max(shakeAmp, Math.min(6, spd2 * 0.12));
        }
        
        ctx.save(); ctx.translate(px, py);
        
        // 1. Cinematic outer corona
        ctx.shadowColor = 'hsla('+hue+',100%,70%,1)'; ctx.shadowBlur = 60 + 50 * pulse;
        ctx.fillStyle = 'hsla('+hue+',100%,60%,'+(0.03 + 0.02 * pulse)+')';
        ctx.fillRect(-pw/2-12, -ph/2-12, pw+24, ph+24);
        ctx.shadowColor = 'hsla('+((hue+90)%360)+',100%,60%,1)'; ctx.shadowBlur = 30 + 25 * pulse;
        ctx.fillRect(-pw/2-6, -ph/2-6, pw+12, ph+12);
        
        // 2. Multi-ring with chromatic aberration
        for (var ring = 0; ring < 4; ring++) {
          var ringR = 1 + ring * 0.25 + 0.15 * Math.sin(now * 1.5 + ri + ring * 0.5);
          var rHue = (hue + ring * 90 + now * 5) % 360;
          ctx.shadowColor = 'hsla('+rHue+',100%,60%,1)';
          ctx.shadowBlur = 20 + 12 * pulse - ring * 3;
          ctx.strokeStyle = 'hsla('+rHue+',100%,70%,'+(0.12 - ring*0.025 + 0.08*pulse)+')';
          ctx.lineWidth = 2 + ring * 0.3;
          ctx.strokeRect(-pw/2*ringR-1, -ph/2*ringR-1, pw*ringR+2, ph*ringR+2);
        }
        
        // 3. Volumetric light rays
        ctx.shadowBlur = 0;
        for (var ray = 0; ray < 12; ray++) {
          var ra = now * 0.3 + ray * 0.523 + ri * 0.2;
          var rLen = 0.3 + 0.3 * Math.sin(now * 1.2 + ray * 0.7);
          ctx.strokeStyle = 'hsla('+((hue+ray*30)%360)+',100%,70%,'+(0.05+0.04*Math.sin(now+ray*0.5))+')';
          ctx.lineWidth = 0.8 + Math.sin(now + ray) * 0.5;
          var rx = Math.cos(ra) * (Math.max(pw,ph)*0.8);
          var ry = Math.sin(ra) * (Math.max(pw,ph)*0.8);
          ctx.beginPath(); ctx.moveTo(rx*0.15, ry*0.15); ctx.lineTo(rx*1.4, ry*1.4); ctx.stroke();
        }
        
        // 4. Neon corners with pulsing glow
        var cs = 12 + 6 * Math.sin(now * 2 + ri * 0.6);
        ctx.shadowColor = '#'+['0ff','f0f','ff0','0f8'][ri%4]; ctx.shadowBlur = 30 + 25 * pulse;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(-pw/2, -ph/2+cs); ctx.lineTo(-pw/2, -ph/2); ctx.lineTo(-pw/2+cs, -ph/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pw/2-cs, -ph/2); ctx.lineTo(pw/2, -ph/2); ctx.lineTo(pw/2, -ph/2+cs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-pw/2, ph/2-cs); ctx.lineTo(-pw/2, ph/2); ctx.lineTo(-pw/2+cs, ph/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pw/2-cs, ph/2); ctx.lineTo(pw/2, ph/2); ctx.lineTo(pw/2, ph/2-cs); ctx.stroke();
        
        // 5. Orbital particle system
        ctx.shadowBlur = 0;
        for (var rp = 0; rp < 14; rp++) {
          var ang = now * (0.8 + ri * 0.1) + rp * 0.449 + ri * 0.4;
          var dist = Math.max(pw, ph) * 0.35 + 22 + 12 * Math.sin(now * 1.2 + rp * 0.7 + ri);
          var rpx = Math.cos(ang) * dist, rpy = Math.sin(ang) * dist;
          var rps = 2.5 + Math.sin(now * 3.5 + rp * 1.3 + ri) * 2;
          ctx.fillStyle = 'hsl('+((hue + rp * 26) % 360)+',100%,70%)';
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 1.8 + rp * 0.5);
          ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15 + 12 * Math.sin(now + rp);
          ctx.beginPath(); ctx.arc(rpx, rpy, Math.max(1.5, rps), 0, 6.28); ctx.fill();
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        
        // 6. Holographic scan + data corruption
        for (var sl = 0; sl < ph; sl += 2) {
          var slAlpha = 0.03 + 0.025 * Math.sin(now * 7 + sl * 0.3 + ri * 0.5);
          ctx.fillStyle = 'hsla('+hue+',100%,60%,'+slAlpha+')';
          ctx.fillRect(-pw/2, -ph/2 + sl, pw, 1);
          if (sl % 8 === 0) {
            ctx.fillStyle = 'hsla('+((hue+180)%360)+',100%,60%,'+(slAlpha*0.5)+')';
            ctx.fillRect(-pw/2, -ph/2 + sl, pw, 0.5);
          }
        }
        // Digital glitch corruption
        if (Math.random() < 0.03) {
          var glY = -ph/2 + Math.random() * ph;
          var glH = 1+Math.floor(Math.random()*4);
          ctx.fillStyle = 'rgba(255,255,255,'+(0.15+Math.random()*0.3)+')';
          ctx.fillRect(-pw/2, glY, pw, glH);
          if (Math.random() < 0.3) {
            ctx.fillStyle = 'rgba(255,0,255,'+(0.1+Math.random()*0.2)+')';
            ctx.fillRect(-pw/2 + Math.random()*10, glY, pw*Math.random(), glH);
          }
        }
        // Chromatic aberration on fast objects
        if (spd2 > 3) {
          var ca = Math.min(0.06, spd2 * 0.004);
          ctx.fillStyle = 'rgba(255,0,0,'+ca+')'; ctx.fillRect(-pw/2+2, -ph/2, pw, ph);
          ctx.fillStyle = 'rgba(0,100,255,'+ca+')'; ctx.fillRect(-pw/2-2, -ph/2, pw, ph);
        }
        
        // 7. Hyper motion trails + afterimages
        if (spd2 > 1.5) {
          var vx = props[ri].body.velocity.x, vy = props[ri].body.velocity.y;
          var maxTrail = Math.min(25, Math.floor(spd2 * 2.2));
          for (var sti = 0; sti < maxTrail; sti += 2) {
            var alpha2 = (1 - sti/maxTrail) * 0.08;
            var trailHue = (hue + sti * 5) % 360;
            ctx.fillStyle = 'hsla('+trailHue+',100%,60%,'+alpha2+')';
            ctx.fillRect(-pw/2-sti*Math.sign(vx)*1.2+Math.random()*2-1, -ph/2-sti*Math.sign(vy)*1.2+Math.random()*2-1, pw, ph);
          }
        }
        // Energy field ripple
        var ripple = Math.sin(now * 4 + ri * 0.3) * 0.5 + 0.5;
        if (ripple > 0.8) {
          ctx.strokeStyle = 'hsla('+hue+',100%,80%,'+(ripple-0.8)*0.3+')';
          ctx.lineWidth = 1;
          ctx.strokeRect(-pw/2-3-ripple*5, -ph/2-3-ripple*5, pw+6+ripple*10, ph+6+ripple*10);
        }
        // Ground reflection glow
        if (py < 335) {
          var refDist = 340 - py;
          var refAlpha = Math.max(0, 0.08 * (1 - refDist/200));
          ctx.fillStyle = 'hsla('+hue+',100%,60%,'+refAlpha+')';
          ctx.fillRect(px-pw/2, 345, pw, Math.min(refDist, 20));
          ctx.fillStyle = 'hsla('+((hue+180)%360)+',100%,60%,'+(refAlpha*0.3)+')';
          ctx.fillRect(px-pw/2-2, 346, pw+4, Math.min(refDist*0.5, 8));
        }
        
        ctx.shadowBlur = 0; ctx.restore();
      }
    }
    // Cinematic bloom + lens flare
    var grad = ctx.createRadialGradient(270, 180, 15, 270, 180, 520);
    grad.addColorStop(0, 'rgba(0,255,255,0.09)');
    grad.addColorStop(0.1, 'rgba(255,0,255,0.06)');
    grad.addColorStop(0.25, 'rgba(0,255,128,0.035)');
    grad.addColorStop(0.5, 'rgba(0,200,255,0.015)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(0.82, 'rgba(0,0,0,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 540, 360);
    // Lens flare
    var flX = 250 + Math.sin(now * 0.15) * 150;
    var flY = 80 + Math.cos(now * 0.12) * 60;
    for (var lfi = 0; lfi < 7; lfi++) {
      ctx.fillStyle = 'hsla('+((lfi*50+now*15)%360)+',80%,70%,'+(0.025-lfi*0.003)+')';
      ctx.beginPath(); ctx.arc(flX+lfi*18, flY+lfi*8, 25-lfi*3, 0, 6.28); ctx.fill();
    }
    // Floating dust motes
    for (var dpi = 0; dpi < 12; dpi++) {
      var dx = (dpi * 43 + now * 15) % 540;
      var dy = (dpi * 37 + Math.sin(now * 0.4 + dpi * 0.7) * 25 + 40) % 360;
      ctx.fillStyle = 'rgba(180,200,255,'+(0.004+Math.sin(now*0.6+dpi)*0.004)+')';
      ctx.beginPath(); ctx.arc(dx, dy, 0.5+Math.sin(now*0.5+dpi)*0.5, 0, 6.28); ctx.fill();
    }
    // Atmospheric haze
    ctx.fillStyle = 'rgba(100,150,255,0.005)';
    ctx.fillRect(0, 0, 540, 100);
    // Film grain
    if (Math.random() < 0.55) {
      for (var fgi = 0; fgi < 80; fgi++) {
        ctx.fillStyle = 'rgba(255,255,255,'+(Math.random()*0.01)+')';
        ctx.fillRect(Math.random()*540, Math.random()*360, 1+Math.random()*2, 1+Math.random()*2);
      }
    }
    // Screen shake + flash
    if (shakeAmp > 0.5) {
      ctx.fillStyle = 'rgba(0,0,0,'+(0.025+shakeAmp*0.005)+')';
      ctx.fillRect(0, 0, 540, 360);
      if (shakeAmp > 4) {
        ctx.fillStyle = 'rgba(255,255,255,'+((shakeAmp-4)*0.02)+')';
        ctx.fillRect(0, 0, 540, 360);
      }
    }
    // Heavy cinematic vignette
    var vigGrad = ctx.createRadialGradient(270, 180, 100, 270, 180, 430);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.4, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.7, 'rgba(0,0,0,0.03)');
    vigGrad.addColorStop(0.85, 'rgba(0,0,0,0.1)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, 540, 360);
  }
  
  // Clean up destroyed objects from selection
  selectedObjs = selectedObjs.filter(function(o){ return o && o.body; });
  
  // Draw selection highlights (blue glow, supports multi-select)
  for (var si2 = 0; si2 < selectedObjs.length; si2++) {
    var so = selectedObjs[si2];
    if (so && so.body) {
      ctx.save();
      ctx.translate(so.x, so.y);
      var pulse = 0.7 + 0.3 * Math.sin(now * 4 + si2);
      ctx.strokeStyle = 'rgba(0,150,255,' + pulse + ')';
      ctx.lineWidth = 2 + pulse;
      ctx.shadowColor = '#06f'; ctx.shadowBlur = 20 + 10 * pulse;
      ctx.strokeRect(-so.w/2-4, -so.h/2-4, so.w+8, so.h+8);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
  
  ctx.fillStyle = '#555'; ctx.font = '8px monospace';
  ctx.fillText('OBJ:'+objCount+' DBR:'+debrisCount+' SEL:'+selectedObjs.length+' FX:'+(sparks.length+explosions.length+floatingTexts.length+confetti.length)+(rtxMode?' RTX':''),5,12);
  ctx.fillStyle = '#777'; ctx.font = '8px monospace';
  ctx.fillText('LMB:sel Ctrl:multi RMB:drag T:frz Y:R=0 J:smash E:etd',5,24);
  ctx.fillStyle = '#444'; ctx.font = '6px monospace';
  ctx.fillText('by m & FLUX', 5, 355);
  
  requestAnimationFrame(loop);
}
loop();
