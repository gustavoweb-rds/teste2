'use strict';

// =============================================
// TURBO RAGDOLL — Physics Browser Game
// Uses Matter.js for 2D physics simulation
// =============================================

const {
  Engine, Bodies, Body, Composite,
  Constraint, Events, Vector
} = Matter;

// =============================================
// CONFIG
// =============================================
const CFG = {
  gravity:      1.6,
  wheelRadius:  26,
  engineTorque: 5.0,    // torque per frame when holding key
  maxWheelAV:   40,     // max wheel angular velocity
  leanTorque:   0.06,   // chassis lean torque
  camSmooth:    0.08,   // camera lerp factor (0–1)
  spawnX:       160,
  spawnY:       524,
};

// Collision filter categories
const CAT_TERRAIN = 0x0001;
const CAT_VEHICLE = 0x0002;
const CAT_RAGDOLL = 0x0004;

// =============================================
// UTILITY — Draw helpers
// =============================================

function drawPolygon(ctx, body, fill, stroke, lw = 1.5) {
  const v = body.vertices;
  ctx.beginPath();
  ctx.moveTo(v[0].x, v[0].y);
  for (let i = 1; i < v.length; i++) ctx.lineTo(v[i].x, v[i].y);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill;     ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function drawCircle(ctx, x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill)   { ctx.fillStyle = fill;     ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

// =============================================
// LEVEL
// =============================================

class Level {
  constructor(world) {
    this.world = world;
    this.bodies   = [];
    this.spikes   = [];
    this.pts      = [];   // terrain outline points [[x,y],...]
    this.endX     = 0;
    this._build();
  }

  // Hand-crafted terrain points — left to right
  _buildPts() {
    return [
      // flat start
      [-400, 580], [520, 580],
      // small bump (warm-up)
      [680, 540],  [840, 580],
      // flat
      [1040, 580],
      // gentle ramp up — was 31°, now ~20°
      [1300, 470], [1480, 455],
      // top plateau
      [1680, 455],
      // ramp down
      [1920, 580],
      // flat — spike area ahead
      [2150, 580],
      // post-spike flat
      [2620, 580],
      // slight downslope
      [2800, 620],
      // big launch ramp — was 40°, now ~28°
      [3100, 460], [3240, 450],
      // long downhill
      [3580, 630],
      // flat
      [3740, 630],
      // rolling bumps ×5 (gentler amplitude)
      [3900, 570], [4060, 630],
      [4220, 565], [4380, 630],
      [4540, 570], [4700, 630],
      // final long flat — finish here
      [4900, 630], [5800, 630],
    ];
  }

  _build() {
    this.pts  = this._buildPts();
    this.endX = this.pts[this.pts.length - 1][0];

    // Ground segment bodies
    for (let i = 0; i < this.pts.length - 1; i++) {
      const [x1, y1] = this.pts[i];
      const [x2, y2] = this.pts[i + 1];
      const seg = this._makeSeg(x1, y1, x2, y2, 26);
      this.bodies.push(seg);
      Composite.add(this.world, seg);
    }

    // Left wall — stops player going backwards
    const wall = Bodies.rectangle(-420, 450, 20, 500, {
      isStatic: true, label: 'wall',
      collisionFilter: { category: CAT_TERRAIN, mask: CAT_VEHICLE | CAT_RAGDOLL }
    });
    Composite.add(this.world, wall);

    // Floating platform above the top plateau
    const plat = Bodies.rectangle(1580, 400, 200, 18, {
      isStatic: true, friction: 0.5, label: 'platform',
      collisionFilter: { category: CAT_TERRAIN, mask: CAT_VEHICLE | CAT_RAGDOLL }
    });
    this.bodies.push(plat);
    Composite.add(this.world, plat);

    // Spikes — terrain at x=2150–2620 is y=580, so spikes sit at y=555
    for (let i = 0; i < 10; i++) {
      const sx = 2170 + i * 48;
      const sp = Bodies.polygon(sx, 555, 3, 22, {
        isStatic: true, angle: Math.PI, label: 'spike',
        friction: 0, restitution: 0,
        collisionFilter: { category: CAT_TERRAIN, mask: CAT_VEHICLE | CAT_RAGDOLL }
      });
      this.spikes.push(sp);
      this.bodies.push(sp);
      Composite.add(this.world, sp);
    }
  }

  _makeSeg(x1, y1, x2, y2, thick) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    return Bodies.rectangle(
      (x1 + x2) / 2, (y1 + y2) / 2,
      len, thick,
      {
        isStatic: true, angle: Math.atan2(dy, dx),
        friction: 0.8, frictionStatic: 1.0, restitution: 0.1,
        label: 'terrain',
        collisionFilter: { category: CAT_TERRAIN, mask: CAT_VEHICLE | CAT_RAGDOLL }
      }
    );
  }

  // Draw parallax sky background (screen-space)
  drawBackground(ctx, camX, camY, W, H) {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#4a90c8');
    sky.addColorStop(0.6, '#aad4ee');
    sky.addColorStop(1,   '#cce8cc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Distant mountains (parallax 0.4)
    ctx.fillStyle = 'rgba(90,110,150,0.3)';
    const mounts = [100,400,650,950,1250,1600,1900,2300,2700,3200,3700,4200,4700];
    mounts.forEach((mx, i) => {
      const sx = mx - camX * 0.4;
      const h  = 100 + (i % 3) * 50;
      const sy = H * 0.68;
      ctx.beginPath();
      ctx.moveTo(sx - 70, sy);
      ctx.lineTo(sx,      sy - h);
      ctx.lineTo(sx + 70, sy);
      ctx.closePath();
      ctx.fill();
    });

    // Clouds (parallax 0.25)
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    const clouds = [
      [180, 70, 45], [550, 90, 35], [950, 60, 55],
      [1380,80, 40], [1800,65, 50], [2300,85, 38],
      [2750,70, 48], [3300,75, 42], [3850,60, 52],
      [4400,80, 36], [4900,65, 44],
    ];
    clouds.forEach(([cx, cy, r]) => {
      const sx = cx - camX * 0.25;
      ctx.beginPath(); ctx.ellipse(sx,         cy,     r,      r*0.55, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + r*0.7,  cy+5,   r*0.65, r*0.4,  0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx - r*0.55, cy+8,   r*0.5,  r*0.35, 0, 0, Math.PI*2); ctx.fill();
    });
  }

  // Draw terrain geometry (world-space, after camera transform)
  drawTerrain(ctx) {
    const pts = this.pts;
    if (pts.length < 2) return;

    // Soil fill
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1] + 600);
    ctx.lineTo(pts[0][0],              pts[0][1]              + 600);
    ctx.closePath();
    const soil = ctx.createLinearGradient(0, 560, 0, 1200);
    soil.addColorStop(0, '#6b4226');
    soil.addColorStop(1, '#2a1008');
    ctx.fillStyle = soil;
    ctx.fill();

    // Grass / surface line
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.strokeStyle = '#4aaa28';
    ctx.lineWidth   = 9;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Darker edge
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.strokeStyle = '#2a7010';
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Floating platform
    this.bodies.filter(b => b.label === 'platform').forEach(b => {
      drawPolygon(ctx, b, '#8B6914', '#5a3a00', 2);
      // plank lines
      ctx.strokeStyle = '#6a4900';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const px = b.position.x - 90 + i * 44;
        ctx.beginPath();
        ctx.moveTo(px, b.position.y - 8);
        ctx.lineTo(px, b.position.y + 8);
        ctx.stroke();
      }
    });

    // Spikes
    this.spikes.forEach(sp => {
      drawPolygon(ctx, sp, '#cc1010', '#660000', 1.5);
      // highlight tip
      const v = sp.vertices;
      const tip = v.reduce((a, b) => a.y < b.y ? a : b);
      drawCircle(ctx, tip.x, tip.y, 3, '#ff4040', null);
    });

    // Finish flag
    const fx = this.endX - 60, fy = 640;
    ctx.strokeStyle = '#999';
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - 95);
    ctx.stroke();
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(fx + 2, fy - 95);
    ctx.lineTo(fx + 48, fy - 78);
    ctx.lineTo(fx + 2,  fy - 60);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    // "FIM" label
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font      = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FIM', fx + 24, fy - 102);
  }
}

// =============================================
// VEHICLE — bike with two wheels + frame
// =============================================

class Vehicle {
  constructor(world, x, y) {
    this.world = world;
    this._create(x, y);
  }

  _create(x, y) {
    const r  = CFG.wheelRadius;
    const cf = { category: CAT_VEHICLE, mask: CAT_TERRAIN };

    // Wheels spawn 30px below frame — at y+30, radius 26 → bottom at y+56
    // With spawnY=524: wheel bottom = 524+56 = 580 = exactly terrain level
    this.back = Bodies.circle(x - 40, y + 30, r, {
      friction: 0.95, frictionStatic: 1.0,
      restitution: 0.04, density: 0.006,
      label: 'wheel', collisionFilter: cf
    });

    this.front = Bodies.circle(x + 40, y + 30, r, {
      friction: 0.95, frictionStatic: 1.0,
      restitution: 0.04, density: 0.005,
      label: 'wheel', collisionFilter: cf
    });

    // Chassis — sits above the wheels
    this.frame = Bodies.rectangle(x, y, 72, 18, {
      friction: 0.3, density: 0.004, restitution: 0.04,
      label: 'chassis', collisionFilter: cf
    });

    // One suspension constraint per wheel.
    // NOT specifying 'length' → Matter.js uses the current distance at creation.
    // Back wheel offset from frame attachment: (-40-(-25), 30-5) = (-15, 25) → ~29px
    // Front wheel offset: similar → spring keeps wheels roughly 29px below attachment
    this.cB = Constraint.create({
      bodyA: this.frame, pointA: { x: -25, y: 5 },
      bodyB: this.back,  pointB: { x: 0,   y: 0 },
      stiffness: 0.45, damping: 0.8
    });
    this.cF = Constraint.create({
      bodyA: this.frame, pointA: { x: 25,  y: 5 },
      bodyB: this.front, pointB: { x: 0,   y: 0 },
      stiffness: 0.45, damping: 0.8
    });

    this.allBodies      = [this.back, this.front, this.frame];
    this.allConstraints = [this.cB, this.cF];

    Composite.add(this.world, this.allBodies);
    Composite.add(this.world, this.allConstraints);
  }

  drive(dir) {
    const av  = this.back.angularVelocity;
    // Torque curve: full power at low AV, tapers off near max.
    // This naturally gives more force when climbing (low AV) and
    // limits top speed on flat ground (high AV).
    const ratio = Math.max(0, 1 - Math.abs(av) / CFG.maxWheelAV);
    const t = CFG.engineTorque * ratio * dir;
    if (Math.abs(t) > 0.001) {
      this.back.torque  += t;
      this.front.torque += t * 0.3;
    }
  }

  lean(dir) {
    // Clamp angular velocity to prevent endless spinning
    if (Math.abs(this.frame.angularVelocity) < 4) {
      this.frame.torque += dir * CFG.leanTorque;
    }
  }

  get pos() { return this.frame.position; }

  draw(ctx) {
    const r = CFG.wheelRadius;

    // Draw each wheel
    [this.back, this.front].forEach(w => {
      const { x, y } = w.position;
      const a        = w.angle;

      // Tire
      drawCircle(ctx, x, y, r,      '#1a1a1a', '#444', 3);
      // Rim
      drawCircle(ctx, x, y, r*0.55, '#888',    '#aaa', 1.5);
      // Spokes (3)
      ctx.strokeStyle = '#999';
      ctx.lineWidth   = 1.5;
      for (let s = 0; s < 3; s++) {
        const sa = a + s * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(sa)*r*0.88, y + Math.sin(sa)*r*0.88);
        ctx.stroke();
      }
      // Hub
      drawCircle(ctx, x, y, 4, '#ddd', '#888', 1);
    });

    // Chassis / frame body
    drawPolygon(ctx, this.frame, '#1a4aaa', '#0a2870', 2);

    // Helpers to rotate an offset point around the frame center
    const fa  = this.frame.angle;
    const fx  = this.frame.position.x;
    const fy  = this.frame.position.y;
    const rot = (ox, oy) => ({
      x: fx + Math.cos(fa) * ox - Math.sin(fa) * oy,
      y: fy + Math.sin(fa) * ox + Math.cos(fa) * oy,
    });

    // Seat (back of frame, raised above)
    const seat = rot(-16, -14);
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(seat.x, seat.y, 14, 5, fa, 0, Math.PI * 2);
    ctx.fill();

    // Handlebar stem (front of frame, vertical)
    const stemBase = rot(24, -9);
    const stemTop  = rot(24, -28);
    ctx.strokeStyle = '#777';
    ctx.lineWidth   = 4;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(stemBase.x, stemBase.y);
    ctx.lineTo(stemTop.x,  stemTop.y);
    ctx.stroke();

    // Handlebar crossbar
    const hbL = rot(18, -26);
    const hbR = rot(30, -26);
    ctx.beginPath();
    ctx.moveTo(hbL.x, hbL.y);
    ctx.lineTo(hbR.x, hbR.y);
    ctx.stroke();
  }

  destroy() {
    this.allBodies.forEach(b => Composite.remove(this.world, b));
    this.allConstraints.forEach(c => Composite.remove(this.world, c));
  }
}

// =============================================
// RAGDOLL
//
// While ALIVE: zero physics bodies — character is
// drawn purely in canvas-space attached to the
// vehicle frame. No constraints = no instability.
//
// On DEATH: two physics bodies (torso + head) are
// spawned at the current visual position with the
// vehicle's velocity, then fly/tumble freely.
// =============================================

class Ragdoll {
  constructor(world, vehicle) {
    this.world      = world;
    this.vehicle    = vehicle;
    this.dead       = false;
    // physics bodies — null while alive, created on activate()
    this.torso      = null;
    this.head       = null;
    this._neckC     = null;
  }

  // Called once when the player dies — spawns physics bodies
  activate() {
    if (this.dead) return;
    this.dead = true;

    const cf = { category: CAT_RAGDOLL, mask: CAT_TERRAIN };
    const f  = this.vehicle.frame;
    const fa = f.angle;

    // Helper: rotate a local (ox, oy) offset into world space
    const rot = (ox, oy) => ({
      x: f.position.x + Math.cos(fa) * ox - Math.sin(fa) * oy,
      y: f.position.y + Math.sin(fa) * ox + Math.cos(fa) * oy,
    });

    // Positions match _drawLiving offsets (seat at frame (-10,-18))
    const torsoW = rot(-10, -38);   // torso visual center in world space
    const headW  = rot(-10, -72);   // head visual center

    this.torso = Bodies.rectangle(torsoW.x, torsoW.y, 16, 40, {
      density: 0.006, restitution: 0.25, friction: 0.3, frictionAir: 0.01,
      angle: fa, label: 'torso', collisionFilter: cf
    });
    this.head = Bodies.circle(headW.x, headW.y, 14, {
      density: 0.003, restitution: 0.4, friction: 0.3, frictionAir: 0.01,
      label: 'head', collisionFilter: cf
    });

    // Inherit vehicle velocity + upward kick for drama
    const vel = f.velocity;
    Body.setVelocity(this.torso, { x: vel.x,       y: vel.y - 4 });
    Body.setVelocity(this.head,  { x: vel.x * 0.8, y: vel.y - 8 });
    Body.setAngularVelocity(this.torso, f.angularVelocity + (Math.random() - 0.5) * 3);

    // Soft neck constraint
    this._neckC = Constraint.create({
      bodyA: this.head,  pointA: { x: 0, y:  14 },
      bodyB: this.torso, pointB: { x: 0, y: -20 },
      stiffness: 0.4, damping: 0.2, length: 4
    });

    Composite.add(this.world, [this.torso, this.head, this._neckC]);
  }

  draw(ctx) {
    if (!this.dead) {
      this._drawLiving(ctx);
    } else {
      this._drawDead(ctx);
    }
  }

  // Draw character as pure canvas — perfectly stable, zero physics
  _drawLiving(ctx) {
    const f  = this.vehicle.frame;
    const fa = f.angle;

    ctx.save();
    ctx.translate(f.position.x, f.position.y);
    ctx.rotate(fa);
    // Move origin to seat attachment point on frame
    ctx.translate(-10, -18);

    const shirt = '#2266cc';
    const pants = '#334455';
    const skin  = '#f0c090';

    // Legs — hang below seat
    ctx.fillStyle = pants;
    ctx.fillRect(-11, 0,  9, 24); // left leg
    ctx.fillRect(  2, 0,  9, 24); // right leg

    // Left arm — down-back
    ctx.save();
    ctx.translate(-13, -22);
    ctx.rotate(0.25);
    ctx.fillStyle = shirt;
    ctx.fillRect(-4, 0, 8, 22);
    ctx.restore();

    // Right arm — forward toward handlebar
    ctx.save();
    ctx.translate(13, -20);
    ctx.rotate(-0.45);
    ctx.fillStyle = shirt;
    ctx.fillRect(-4, 0, 8, 24);
    ctx.restore();

    // Torso (shirt) — from seat up
    ctx.fillStyle = shirt;
    ctx.fillRect(-8, -38, 16, 36);
    ctx.strokeStyle = '#1144aa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -38, 16, 36);

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, -54, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c08050';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes (facing right in local space)
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc( 5, -57, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, -57, 2.5, 0, Math.PI * 2); ctx.fill();

    // Helmet (upper half arc)
    ctx.fillStyle = '#dd2222';
    ctx.beginPath();
    ctx.arc(0, -54, 16, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#881111';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  _drawDead(ctx) {
    if (!this.torso) return;

    const { x: tx, y: ty } = this.torso.position;
    const ta = this.torso.angle;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(ta);

    ctx.fillStyle = '#334455';
    ctx.fillRect(-11, 14, 9, 24);
    ctx.fillRect(  2, 14, 9, 24);

    ctx.fillStyle = '#2266cc';
    ctx.fillRect(-8, -20, 16, 36);
    ctx.strokeStyle = '#1144aa';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -20, 16, 36);

    ctx.restore();

    if (!this.head) return;
    const { x: hx, y: hy } = this.head.position;
    const ha = this.head.angle;

    drawCircle(ctx, hx, hy, this.head.circleRadius, '#f0c090', '#c08050', 1.5);

    // Helmet
    ctx.beginPath();
    ctx.arc(hx, hy, this.head.circleRadius + 2, Math.PI + ha, Math.PI * 2 + ha);
    ctx.lineTo(hx, hy);
    ctx.closePath();
    ctx.fillStyle = '#dd2222';
    ctx.fill();
    ctx.strokeStyle = '#881111';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  destroy() {
    if (this.torso) Composite.remove(this.world, this.torso);
    if (this.head)  Composite.remove(this.world, this.head);
    if (this._neckC) Composite.remove(this.world, this._neckC);
  }
}

// =============================================
// GAME — orchestrates everything
// =============================================

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');
    this.W = 0; this.H = 0;

    this.state   = 'menu'; // 'menu' | 'playing' | 'dead'
    this.engine  = null;
    this.world   = null;
    this.vehicle = null;
    this.ragdoll = null;
    this.level   = null;

    this.cam   = { x: 0, y: 0 };
    this.keys  = {};
    this.touch = { right: false, left: false, leanFwd: false, leanBack: false };

    this.startX      = CFG.spawnX;
    this.distance    = 0;
    this.lastTs      = 0;
    this.deadTimer   = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._setupInput();
    this._setupUI();
    this._detectMobile();

    requestAnimationFrame(ts => this._loop(ts));
  }

  // ---- Setup ----

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  _detectMobile() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.getElementById('touchControls').classList.remove('hidden');
    }
  }

  _setupInput() {
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });

    // Touch buttons
    const binds = [
      ['btnRight',    'right'   ],
      ['btnLeft',     'left'    ],
      ['btnLeanFwd',  'leanFwd' ],
      ['btnLeanBack', 'leanBack'],
    ];
    binds.forEach(([id, prop]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const on  = () => (this.touch[prop] = true);
      const off = () => (this.touch[prop] = false);
      el.addEventListener('touchstart', e => { e.preventDefault(); on(); },  { passive: false });
      el.addEventListener('touchend',   e => { e.preventDefault(); off(); }, { passive: false });
      el.addEventListener('mousedown',  on);
      el.addEventListener('mouseup',    off);
      el.addEventListener('mouseleave', off);
    });
  }

  _setupUI() {
    document.getElementById('playBtn').addEventListener('click',    () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
  }

  // ---- Start / Reset ----

  startGame() {
    clearTimeout(this.deadTimer);

    // Tear down previous session
    if (this.engine) {
      if (this.vehicle) this.vehicle.destroy();
      if (this.ragdoll) this.ragdoll.destroy();
      Composite.clear(this.engine.world, false);
      Engine.clear(this.engine);
    }

    // Physics engine
    this.engine = Engine.create({ gravity: { y: CFG.gravity } });
    this.world  = this.engine.world;

    // Level, vehicle, ragdoll
    this.level   = new Level(this.world);
    this.vehicle = new Vehicle(this.world, CFG.spawnX, CFG.spawnY);
    this.ragdoll = new Ragdoll(this.world, this.vehicle);

    // Brief settle: let vehicle suspension come to rest (no ragdoll bodies yet)
    for (let i = 0; i < 30; i++) Engine.update(this.engine, 1000 / 60, 1);

    // Camera starting position
    this.startX  = CFG.spawnX;
    this.cam.x   = this.vehicle.frame.position.x - this.W * 0.35;
    this.cam.y   = this.vehicle.frame.position.y - this.H * 0.50;
    this.distance = 0;
    this.state    = 'playing';

    // Collision event — head vs spike
    Events.on(this.engine, 'collisionStart', ev => {
      if (this.state !== 'playing') return;
      ev.pairs.forEach(pair => {
        const la = pair.bodyA.label, lb = pair.bodyB.label;
        if ((la === 'head' || lb === 'head') && (la === 'spike' || lb === 'spike')) {
          this._die('Empalado!');
        }
        // vehicle frame hits spikes hard
        if ((la === 'chassis' || lb === 'chassis') && (la === 'spike' || lb === 'spike')) {
          this._die('Empalado!');
        }
      });
    });

    // Show game UI
    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('deadScreen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  // ---- Per-frame logic ----

  _handleInput() {
    const k = this.keys, t = this.touch;
    if (k['ArrowRight'] || k['KeyD'] || t.right)    this.vehicle.drive(1);
    if (k['ArrowLeft']  || k['KeyA'] || t.left)     this.vehicle.drive(-1);
    if (k['ArrowUp']    || k['KeyW'] || t.leanFwd)  this.vehicle.lean(1);
    if (k['ArrowDown']  || k['KeyS'] || t.leanBack) this.vehicle.lean(-1);
  }

  _checkDeath() {
    const fPos = this.vehicle.frame.position;

    // Fell below world
    if (fPos.y > 1400) { this._die('Caiu no abismo!'); return; }

    // Chassis completely flipped
    const ang = ((this.vehicle.frame.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (ang > Math.PI * 0.65 && ang < Math.PI * 1.35) {
      this._die('Capotou!'); return;
    }

    // Reached the end
    if (fPos.x >= this.level.endX - 100) {
      this._die('Chegou ao fim! 🎉');
    }
  }

  _die(reason) {
    if (this.state !== 'playing') return;
    this.state = 'dead';

    // Spawn ragdoll physics bodies at the current visual position
    this.ragdoll.activate();

    const dist = Math.max(0, Math.round((this.vehicle.frame.position.x - this.startX) / 50));
    this.distance = dist;

    this.deadTimer = setTimeout(() => {
      document.getElementById('distanceDisplay').textContent = `Distância: ${dist}m`;
      document.getElementById('reasonDisplay').textContent   = reason;
      document.getElementById('deadScreen').classList.remove('hidden');
      document.getElementById('hud').classList.add('hidden');
    }, 1800);
  }

  _updateCamera() {
    const pos = this.vehicle.frame.position;
    // Target: player is at 35% from left, 50% vertically
    const tx = pos.x - this.W * 0.35;
    const ty = pos.y - this.H * 0.50;
    this.cam.x += (tx - this.cam.x) * CFG.camSmooth;
    this.cam.y += (ty - this.cam.y) * CFG.camSmooth;
  }

  _updateHUD() {
    const spd  = Math.round(this.vehicle.frame.speed * 3.6);
    const dist = Math.max(0, Math.round((this.vehicle.frame.position.x - this.startX) / 50));
    document.getElementById('speedDisplay').textContent = `${spd} km/h`;
    document.getElementById('distHud').textContent      = `${dist}m`;
  }

  // ---- Main loop ----

  _loop(ts) {
    requestAnimationFrame(t => this._loop(t));

    const dt = Math.min(ts - this.lastTs, 50); // cap delta to avoid spiral of death
    this.lastTs = ts;

    if (this.state === 'playing') {
      this._handleInput();
      // Fixed timestep physics (60 Hz), with correction factor for actual elapsed time
      Engine.update(this.engine, 1000 / 60, dt / (1000 / 60));
      this._updateCamera();
      this._checkDeath();
      this._updateHUD();
    } else if (this.state === 'dead') {
      // Keep simulating so the ragdoll flops around dramatically
      Engine.update(this.engine, 1000 / 60, 1);
      this._updateCamera();
    }

    this._render();
  }

  // ---- Render ----

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    if (this.state === 'menu') {
      this._renderMenu(ctx);
      return;
    }

    // 1. Background — screen space, no camera transform
    this.level.drawBackground(ctx, this.cam.x, this.cam.y, this.W, this.H);

    // 2. World geometry — apply camera translate
    ctx.save();
    ctx.translate((-this.cam.x) | 0, (-this.cam.y) | 0);

    this.level.drawTerrain(ctx);
    this.vehicle.draw(ctx);
    this.ragdoll.draw(ctx);

    ctx.restore();
  }

  _renderMenu(ctx) {
    // Animated dark gradient background for the menu
    const t = Date.now() / 1000;
    const grad = ctx.createLinearGradient(0, 0, this.W, this.H);
    const shift = (Math.sin(t * 0.3) + 1) / 2;
    grad.addColorStop(0,     `hsl(${220 + shift*20}, 60%, 8%)`);
    grad.addColorStop(0.5,   `hsl(${240 + shift*15}, 55%, 12%)`);
    grad.addColorStop(1,     `hsl(${260 + shift*10}, 50%, 7%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    // Animated ground silhouette
    ctx.fillStyle = '#2a1a08';
    ctx.fillRect(0, this.H * 0.82, this.W, this.H * 0.18);
    ctx.strokeStyle = '#3a8020';
    ctx.lineWidth   = 6;
    ctx.beginPath();
    ctx.moveTo(0, this.H * 0.82);
    ctx.lineTo(this.W, this.H * 0.82);
    ctx.stroke();

    // Silhouette bike + rider on the menu
    const bx = this.W * 0.72;
    const by = this.H * 0.82;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    // wheel circles
    drawCircle(ctx, bx - 36, by - 26, 26, null, 'rgba(255,255,255,0.15)', 3);
    drawCircle(ctx, bx + 36, by - 26, 26, null, 'rgba(255,255,255,0.15)', 3);
    // body
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(bx - 42, by - 40, 84, 18);
    // rider head
    drawCircle(ctx, bx + 4, by - 72, 14, 'rgba(255,255,255,0.12)', null);
  }
}

// =============================================
// BOOT
// =============================================

window.addEventListener('load', () => {
  window.game = new Game();
});
