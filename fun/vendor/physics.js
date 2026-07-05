/* Physics engine - Matter.js wrapper */
import Matter from 'matter-js';

export let props = [];
export let engine = null;
export let world = null;
export let canvasRef = null;
export let uiRef = null;
export let ground = null;
export let RESTITUTION = 0.3;
let nextId = 1;

export function setCanvasRefs({ canvas, bgCanvas, ui }){
  canvasRef = canvas;
  uiRef = ui;
}

export function getState(){
  return { props, nextId };
}

let leftWall, rightWall;

export function initPhysics(opts = {}){
  uiRef = opts.ui || uiRef;

  engine = Matter.Engine.create();
  engine.positionIterations = 20;
  engine.velocityIterations = 16;
  engine.constraintIterations = 8;
  engine.enableSleeping = false;

  world = engine.world;
  world.gravity.y = 1;

  const makeStaticBox = (x, y, w, h) => {
    return Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, render: { visible: false } });
  };

  ground = makeStaticBox(0, 0, 4000, 100);
  leftWall = makeStaticBox(-50, 0, 100, 4000);
  rightWall = makeStaticBox(50, 0, 100, 4000);

  Matter.World.add(world, [ground, leftWall, rightWall]);

  const updateBounds = () => {
    if (!canvasRef) return;
    const DPR = window.devicePixelRatio || 1;
    const w = canvasRef.width / DPR;
    const h = canvasRef.height / DPR;
    const groundY = h + 50;
    
    Matter.Body.setPosition(ground, Matter.Vector.create(w / 2, groundY));
    Matter.Body.setVertices(ground, Matter.Vertices.fromPath(`0 ${groundY} ${w} ${groundY} ${w} ${groundY + 100} 0 ${groundY + 100}`));

    const wallThickness = Math.max(80, Math.round(w * 0.12));
    const wallHalfH = h * 3;
    Matter.Body.setPosition(leftWall, Matter.Vector.create(-wallThickness / 2, h / 2));
    Matter.Body.setPosition(rightWall, Matter.Vector.create(w + wallThickness / 2, h / 2));
    Matter.Body.setVertices(rightWall, Matter.Vertices.fromPath(`0 0 ${wallThickness} 0 ${wallThickness} ${wallHalfH} 0 ${wallHalfH}`));
  };

  setTimeout(updateBounds, 0);
  window.addEventListener('resize', updateBounds);
}

export function createBodyForProp(p){
  let body = null;
  const density = Math.max(0.00005, (p.w * p.h) / 1200000);
  const common = { restitution: RESTITUTION, friction: 0.08, frictionAir: 0.01, density };

  if (p.shape === 'circle'){
    const radius = Math.max(4, Math.min(p.w, p.h) / 2);
    body = Matter.Bodies.circle(p.x, p.y, radius, common);
  } else if (p.shape === 'poly' && p.sides && p.sides >= 3){
    const sides = Math.min(8, Math.max(3, p.sides));
    const rx = p.w / 2;
    const ry = p.h / 2;
    const verts = [];
    for (let i = 0; i < sides; i++){
      const ang = (i / sides) * Math.PI * 2;
      verts.push({ x: Math.cos(ang) * rx, y: Math.sin(ang) * ry });
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

export function spawnFromTemplate(idxOrData){
  let t;
  if (typeof idxOrData === 'number'){
    const FALLBACK = { name: 'crate', w: 72, h: 56, color: '#7f5a3a', shape: 'rect' };
    t = (window.SPAWNERS && window.SPAWNERS[idxOrData]) || FALLBACK;
  } else {
    t = idxOrData;
  }

  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const x = (canvasRef.width / DPR) / 2;
  const y = (canvasRef.height / DPR) / 3;
  const mass = (t.w * t.h) / 1000;
  
  const p = {
    id: nextId++,
    x, y,
    w: t.w,
    h: t.h,
    angle: 0,
    color: t.color || '#888888',
    vx: 0,
    vy: 0,
    invMass: mass > 0 ? 1 / mass : 1,
    frozen: false,
    body: null,
    shape: t.shape || 'rect',
    sides: t.sides || undefined
  };
  props.push(p);

  p.body = createBodyForProp(p);
  if (world && p.body) Matter.World.add(world, p.body);
  if (uiRef) uiRef.setCount(props.length);

  return p;
}

export function removeProp(p){
  if (!p) return;
  if (p.body && world){
    Matter.World.remove(world, p.body);
    p.body = null;
  }
  const idx = props.indexOf(p);
  if (idx >= 0) props.splice(idx, 1);
  if (uiRef) uiRef.setCount(props.length);
}

export function stepPhysics(dt){
  if (!engine) return;
  Matter.Engine.update(engine, dt * 1000);
  for (const p of props){
    if (p.body){
      p.x = p.body.position.x;
      p.y = p.body.position.y;
      p.angle = p.body.angle;
      p.frozen = !!p.body.isStatic;
      p.vx = p.body.velocity.x;
      p.vy = p.body.velocity.y;
    }
  }
}

export function clearProps(){
  for (const p of props){
    if (p.body && p.body.world){
      Matter.World.remove(p.body.world, p.body);
    }
  }
  props.length = 0;
  if (uiRef) uiRef.setCount(0);
}
