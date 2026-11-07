// ============================================================
// ◆ 背景のビジュアライザー
// ============================================================
// public/visualizer(別タブで開く版)と同じ空間を、アプリの背景として描く。
// 背景では音に反応させないので、音の読み取りと操作パネルは外し、「音が鳴っていない時」の値で動かしている。
// 使う側は startAmbient(canvas) を1回呼ぶ。止める・再開するのは、返ってくる pause / resume で行う
import * as THREE from "three";
import { RoomEnvironment } from "three-room-environment";

export function startAmbient(canvas) {
  // ============================================================
  // ◆ ① 3D の空間の準備(暗い奥行きのある空間 + 霧)
  // ============================================================
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  // 背景のグラデーションは 3D の側で描く
  // (画面を透明にして CSS の背景を透かすと、光を足し合わせる描き方と相性が悪く、光の端が輪になって見えるため)
  scene.background = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(256, 300, 0, 256, 300, 360);
    grad.addColorStop(0, '#16204a'); grad.addColorStop(0.45, '#0a0d24'); grad.addColorStop(1, '#020308');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();
  scene.fog = new THREE.FogExp2(0x060818, 0.010); // 遠くのものほど暗闇に溶ける
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 400);

  // 輪郭がにじんだ、ぼんやり光る丸の絵(粒の見た目に使う)
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  const glow = glowTexture();

  // 中心の光用。縁が見えないように、外側に向かってなだらかに 0 へ近づける
  // (直線的に 0 にすると、画面に出す時の明るさの補正で、縁がうっすら輪になって見えるため、4乗のカーブにしている)
  function softGlowTexture() {
    const size = 256, c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const r = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.pow(Math.max(0, 1 - r), 4) * 255;
    }
    g.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  // ============================================================
  // ◆ ② 漂う光の粒(小さい粒をたくさん + 大きくぼやけた玉を少し)
  // ============================================================
  const DEPTH = 420; // 粒を置く奥行き。カメラが進んで通り過ぎた粒は、奥に戻して使い回す

  function makeDust(count, size, color, spread, opacity) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
      pos[i * 3 + 2] = -Math.random() * DEPTH;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    // 粒ごとの明るさ。遠くから近づくにつれて、0 から少しずつ明るくする(④の moveDust で毎フレーム決める)
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const mat = new THREE.PointsMaterial({
      size, map: glow, color, transparent: true, opacity, vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false, // 光が重なるほど明るくなる
      fog: false, // 霧だと遠くの粒が消えてしまうので、明るさは自分で決める
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }
  const dust = makeDust(1800, 0.5, 0x8fa8ff, 120, 0.55);
  const bokeh = makeDust(45, 7, new THREE.Color().setHSL(0.68, 0.7, 0.6), 140, 0.25); // 大きくぼやけた玉

  // ============================================================
  // ◆ ③ 奥に浮かぶ、半透明の立方体の塔(プレステ2の本体メニューの雰囲気)
  // ============================================================
  // 金属っぽく見せるには「周りの景色の映り込み」が必要なので、映り込み用の景色(部屋の明かり)を用意する
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  // 中心の光の位置に、青白い明かりを置く(ブロックの面に、ほんのりハイライトが乗る)
  const coreLight = new THREE.PointLight(0xcfe0ff, 0, 120, 1.2);
  scene.add(coreLight);

  const softGlow = softGlowTexture();

  const towers = new THREE.Group();
  const CUBE = 2.2; // 立方体1つの大きさ
  const TOWER_COUNT = 11;
  const cubeGeo = new THREE.BoxGeometry(CUBE, CUBE, CUBE);
  // ブロックの中の濁り。枠線は描かずに、濁りそのものを「面の真ん中は薄く、縁に近づくほど明るく」する。
  // そうすると、縁がなだらかに明るくなって、枠線の代わりになる(くっきりした線が目立たなくなる)。
  // 面ごとの濃さを自分で計算したいので、three.js の用意した素材ではなく、自分で書いた描き方(シェーダー)を使う
  const hazeGeo = new THREE.BoxGeometry(CUBE * 0.98, CUBE * 0.98, CUBE * 0.98);
  const hazeMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uColor: { value: new THREE.Color(0xb4c6ff) },
      uCenter: { value: 0.075 }, // 面の真ん中の濁り
      uEdge: { value: 0.08 },    // 縁の明るさ(ほんのり)
      uLightPos: { value: new THREE.Vector3() }, // 中心の光の位置(毎フレーム更新)
      uLit: { value: 0.12 },     // 光を向いている面が、どれだけ明るくなるか
    }]),
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalW; varying vec3 vPosW;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vPosW = (modelMatrix * vec4(position, 1.0)).xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uCenter; uniform float uEdge;
      uniform vec3 uLightPos; uniform float uLit; uniform float uFade;
      varying vec2 vUv;
      varying vec3 vNormalW; varying vec3 vPosW;
      #include <fog_pars_fragment>
      void main() {
        // 面の縁までの近さ: 真ん中で 0、縁で 1
        vec2 d = abs(vUv - 0.5) * 2.0;
        float edge = max(d.x, d.y);
        float a = mix(uCenter, uEdge, pow(edge, 3.0)); // 縁のすぐ手前から、なだらかに明るくなる
        a *= 1.0 - smoothstep(0.88, 1.0, edge);        // 一番外側だけは、なだらかに消して、外との境目をぼかす
        // 中心の光の方を向いている面ほど明るく、白っぽくする(光を浴びている感じ)
        float lit = max(dot(normalize(vNormalW), normalize(uLightPos - vPosW)), 0.0);
        a += lit * uLit;
        vec3 col = mix(uColor, vec3(0.92, 0.95, 1.0), lit * 0.6);
        gl_FragColor = vec4(col, a * uFade);
        #include <fog_fragment>
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: true,
  });
  // 光でブレた枠。ブロックより少し大きい殻を重ねて、元の枠の位置のまわりを、ぼんやり光らせる。
  // 光の方を向いている側ほど強く光るので、光を浴びた枠が、にじんでブレているように見える
  const BLUR_SHELL = 1.12; // 殻の大きさ(ブロックの何倍か)
  const blurGeo = new THREE.BoxGeometry(CUBE * BLUR_SHELL, CUBE * BLUR_SHELL, CUBE * BLUR_SHELL);
  const blurMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uColor: { value: new THREE.Color(0xdfe8ff) },
      uLightPos: hazeMat.uniforms.uLightPos, // 濁りと同じ光の位置を使う
      uStrength: { value: 0.35 },
      uWidth: { value: 0.22 },  // にじみの幅
    }]),
    vertexShader: hazeMat.vertexShader,
    fragmentShader: `
      uniform vec3 uColor; uniform vec3 uLightPos; uniform float uStrength; uniform float uWidth; uniform float uFade;
      varying vec2 vUv;
      varying vec3 vNormalW; varying vec3 vPosW;
      #include <fog_pars_fragment>
      void main() {
        vec2 d = abs(vUv - 0.5) * 2.0;
        float edge = max(d.x, d.y);
        // 元のブロックの枠がある位置(殻の上では 1/${BLUR_SHELL} のところ)を中心に、ぼかした帯を作る
        float band = exp(-pow((edge - ${(1 / BLUR_SHELL).toFixed(4)}) / uWidth, 2.0));
        float lit = max(dot(normalize(vNormalW), normalize(uLightPos - vPosW)), 0.0);
        gl_FragColor = vec4(uColor, band * lit * uStrength * uFade);
        #include <fog_fragment>
      }`,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: true,
    blending: THREE.AdditiveBlending,
  });

  // ブロックごとに、消えたり現れたりする濃さ(uFade)だけを別に持たせたい。
  // そこで、ブロックごとに素材を作り、uFade 以外の設定(光の位置など)は、元の素材と同じものを共有する
  // (共有しておけば、毎フレームの更新は元の素材に1回するだけで、全部のブロックに効く)
  function fadeMaterial(base) {
    return new THREE.ShaderMaterial({
      uniforms: { ...base.uniforms, uFade: { value: 0 } },
      vertexShader: base.vertexShader, fragmentShader: base.fragmentShader,
      transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: true, blending: base.blending,
    });
  }

  // 塔は、ブロックが MIN〜MAX 個の間で、ゆっくり増えたり減ったりする。
  // ブロックは最初から MAX 個作っておき、上から順に、ふわっと現れる/消えるだけにする
  const MIN_BLOCKS = 2, MAX_BLOCKS = 11;
  const FADE_SPEED = 0.2; // 1秒あたりの濃さの変化。0→1 まで約5秒かけて、ゆっくり現れる

  for (let t = 0; t < TOWER_COUNT; t++) {
    const tower = new THREE.Group();
    const height = 3 + Math.floor(Math.random() * 7);
    tower.userData.count = height; // 今、見えている(または現れつつある)ブロックの数
    tower.userData.next = 4 + Math.random() * 10; // 次に増減するまでの秒数
    for (let i = 0; i < MAX_BLOCKS; i++) {
      // ほんのり薄いメタリック: 金属っぽさ(metalness)を高め、表面を少しざらつかせて(roughness)映り込みをぼかす
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.45, 0.6),
        metalness: 0.85, roughness: 0.35, envMapIntensity: 0.5,
        transparent: true, opacity: 0.12, depthWrite: false, // 表面が濃いと、外との境目がくっきりするので薄めに
      });
      const cube = new THREE.Mesh(cubeGeo, mat);
      cube.position.y = cube.userData.baseY = i * CUBE * 1.15; // ぷかぷかさせる時の基準の高さを覚えておく
      const haze = new THREE.Mesh(hazeGeo, fadeMaterial(hazeMat)); // 中の濁り
      const blur = new THREE.Mesh(blurGeo, fadeMaterial(blurMat)); // 光でブレた枠
      cube.add(haze, blur);
      cube.userData.fade = i < height ? 1 : 0; // 最初から見えている分は、濃さ 1 から始める
      cube.userData.parts = [haze.material, blur.material];
      tower.add(cube);
    }
    const angle = (t / TOWER_COUNT) * Math.PI * 2;
    tower.position.set(Math.cos(angle) * 32, -14, Math.sin(angle) * 32);
    towers.add(tower);
  }

  // 塔のブロックを、時々1つ増やすか減らす(一番上で、ゆっくり現れる/消える)
  function updateTower(tower, t, dt) {
    const u = tower.userData;
    if (t > u.next) {
      if (u.count <= MIN_BLOCKS) u.count++;
      else if (u.count >= MAX_BLOCKS) u.count--;
      else u.count += Math.random() < 0.5 ? 1 : -1;
      u.next = t + 6 + Math.random() * 10; // 次は 6〜16 秒後
    }
    tower.children.forEach((cube, n) => {
      const target = n < u.count ? 1 : 0;
      const f = cube.userData.fade += Math.sign(target - cube.userData.fade) * Math.min(FADE_SPEED * dt, Math.abs(target - cube.userData.fade));
      cube.visible = f > 0.001;
      const eased = f * f * (3 - 2 * f); // 現れ始めと消え終わりを、なめらかにする
      cube.userData.parts.forEach(m => { m.uniforms.uFade.value = eased; });
      cube.userData.eased = eased;
    });
  }

  towers.position.z = -70;
  scene.add(towers);

  // 真ん中の、青白くホワンと光る光(塔に囲まれた中心に置く)
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: softGlow, color: 0xcfe0ff, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, // 霧で暗くならないようにする
  }));
  scene.add(core);

  // ============================================================
  // ◆ ④ 毎フレームの動き
  // ============================================================
  const clock = new THREE.Clock();

  // 粒を、はるか遠くの暗闇から、ぼんやり現れて近づいてくるように見せる
  function moveDust(points, camZ) {
    const p = points.geometry.attributes.position;
    const col = points.geometry.attributes.color;
    for (let i = 0; i < p.count; i++) {
      if (p.getZ(i) > camZ + 5) p.setZ(i, p.getZ(i) - DEPTH); // 後ろへ通り過ぎた粒を、一番奥へ戻す
      const dist = camZ - p.getZ(i); // カメラからの距離
      // 一番奥(DEPTH)では 0、そこから奥行きの 6 割ぶん近づくまでに、なだらかに 1 へ
      let b = Math.min(1, Math.max(0, (DEPTH - dist) / (DEPTH * 0.6)));
      b = b * b * (3 - 2 * b); // 始まりと終わりをなめらかにする
      col.setXYZ(i, b, b, b);
    }
    p.needsUpdate = true;
    col.needsUpdate = true;
  }

  let camZ = 0;
  let t = 0; // 動き始めてからの秒数。止めていた間は数えない(再開した時に、塔などが急に飛ばないようにするため)
  let running = true;
  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    // カメラは、空間の中をゆっくり前へ流れていく
    camZ -= dt * 2.2;
    camera.position.set(Math.sin(t * 0.07) * 3, Math.sin(t * 0.05) * 1.5, camZ);
    camera.lookAt(Math.sin(t * 0.04) * 6, Math.sin(t * 0.03) * 2, camZ - 50);
    moveDust(dust, camZ); moveDust(bokeh, camZ);
    bokeh.rotation.z = t * 0.01;

    // 塔: カメラの少し先に付いてきて、ゆっくり回りながら、上下にぷかぷか浮かぶ
    towers.position.z = camZ - 70;
    towers.rotation.y = t * 0.03;
    towers.children.forEach((tower, i) => {
      tower.position.y = -14 + Math.sin(t * 0.25 + i * 1.7) * 2.2; // 塔ごとに少しずつずらして、約25秒で1往復
      updateTower(tower, t, dt); // ブロックを、時々ゆっくり増やしたり減らしたりする
      tower.children.forEach((cube, n) => {
        // 段ごとにもほんの少しずらして、水に浮いているような柔らかさを出す
        cube.position.y = cube.userData.baseY + Math.sin(t * 0.4 + i + n * 0.6) * 0.25;
        cube.material.opacity = 0.12 * cube.userData.eased;
      });
    });

    // 中心の光: ゆっくり呼吸するように明るさと大きさが波打つ
    const breath = (Math.sin(t * 0.5) + 1) / 2; // 0〜1 を約12秒で1往復
    core.position.set(0, 2, camZ - 70);
    coreLight.position.copy(core.position);
    hazeMat.uniforms.uLightPos.value.copy(core.position);
    hazeMat.uniforms.uLit.value = 0.1 + breath * 0.08; // 光の呼吸に合わせて、照らされ方も波打つ
    blurMat.uniforms.uStrength.value = 0.11 + breath * 0.09; // 光が強い時ほど、枠のにじみも強くなる
    coreLight.intensity = 400 + breath * 300; // 中心の光の呼吸に合わせて、ハイライトもゆっくり波打つ
    core.scale.setScalar(70 + breath * 14);
    core.material.opacity = 0.5 + breath * 0.35;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return {
    // 背景画像に切り替えている間は、描くのを止める(見えない絵を描き続けて、GPU を無駄に使わないため)
    pause() { running = false; },
    resume() {
      if (running) return;
      running = true;
      clock.getDelta(); // 止めていた間の時間を、1コマ分の動きとして数えないようにする
      tick();
    },
  };
}
