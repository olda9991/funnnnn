/* Physics engine - Matter.js wrapper (non-module version for extension) */
var props = [];
var engine = null;
var world = null;
var canvasRef = null;
var uiRef = null;
var ground = null;
var RESTITUTION = 0.3;
var nextId = 1;
var leftWall, rightWall;

function setCanvasRefs(refs){
  canvasRef = refs.canvas;
  uiRef = refs.ui;
}

function getState(){
  return { props: props, nextId: nextId };
}

function initPhysics(opts){
  opts = opts || {};
  uiRef = opts.ui || uiRef;

  engine = Matter.Engine.create();
  engine.positionIterations = 20;
  engine.velocityIterations = 16;
  engine.constraintIterations = 8;
  engine.enableSleeping = false;

  world = engine.world;
  world.gravity.y = 1;

  var cw = canvasRef ? canvasRef.width : 500;
  var ch = canvasRef ? canvasRef.height : 310;
  ground = Matter.Bodies.rectangle(cw/2, ch-5, 4000, 20, { isStatic: true, render: { visible: false }, friction: 0.5 });
  leftWall = Matter.Bodies.rectangle(-30, ch/2, 60, 4000, { isStatic: true, render: { visible: false } });
  rightWall = Matter.Bodies.rectangle(cw+30, ch/2, 60, 4000, { isStatic: true, render: { visible: false } });

  Matter.World.add(world, [ground, leftWall, rightWall]);
}

function createBodyForProp(p){
  var body = null;
  var density = Math.max(0.00005, (p.w * p.h) / 1200000);
  var common = { restitution: RESTITUTION, friction: 0.08, frictionAir: 0.01, density: density };

  if (p.shape === 'circle'){
    body = Matter.Bodies.circle(p.x, p.y, Math.max(4, Math.min(p.w, p.h) / 2), common);
  } else if (p.shape === 'poly' && p.sides && p.sides >= 3){
    var sides = Math.min(8, Math.max(3, p.sides));
    var verts = [];
    for (var i = 0; i < sides; i++){
      var ang = (i / sides) * Math.PI * 2;
      verts.push({ x: Math.cos(ang) * p.w/2, y: Math.sin(ang) * p.h/2 });
    }
    body = Matter.Bodies.fromVertices(p.x, p.y, [verts], common, true);
    if (!body) body = Matter.Bodies.rectangle(p.x, p.y, p.w, p.h, common);
  } else {
    body = Matter.Bodies.rectangle(p.x, p.y, p.w, p.h, common);
  }
  body.plugin = body.plugin || {};
  body.plugin.propId = p.id;
  return body;
}

function spawnFromTemplate(idxOrData){
  var t;
  if (typeof idxOrData === 'number'){
    t = (window.SPAWNERS && window.SPAWNERS[idxOrData]) || { name: 'crate', w: 72, h: 56, color: '#7f5a3a', shape: 'rect' };
  } else {
    t = idxOrData;
  }
  var x = (canvasRef ? canvasRef.width : 500) / 2;
  var y = (canvasRef ? canvasRef.height : 400) / 3;
  
  var p = {
    id: nextId++, x: x, y: y, w: t.w, h: t.h, angle: 0, color: t.color || '#888888',
    vx: 0, vy: 0, frozen: false, body: null, shape: t.shape || 'rect', sides: t.sides || undefined
  };
  props.push(p);
  p.body = createBodyForProp(p);
  if (world && p.body) Matter.World.add(world, p.body);
  return p;
}

function stepPhysics(dt){
  if (!engine) return;
  Matter.Engine.update(engine, dt * 1000);
  for (var i = 0; i < props.length; i++){
    var p = props[i];
    if (p.body){
      p.x = p.body.position.x;
      p.y = p.body.position.y;
      p.angle = p.body.angle;
      p.frozen = p.body ? !!p.body.isStatic : false;
    }
  }
}

function clearProps(){
  if (world) {
    for (var i = 0; i < props.length; i++){
      if (props[i].body) {
        try { Matter.Composite.remove(world, props[i].body); } catch(e) {}
      }
    }
  }
  props.length = 0;
}
