// このファイルは、「音」の画面にあるビー玉のアイコン(#marble_icon)を担当
// ・中で、光をウネウネ動かす描画(プラズマボールのように、青白い光の筋がゆっくりうねり、ところどころピンクに色づく)
// ・ドラッグで動かす処理
// ・クリックで、ビジュアライザーを別タブで開く処理
//
// 目次
// ① 光の模様を描く計算(シェーダー)
// ② ドラッグで動かす処理
// ③ 「音」のページを開いた時に、描画・ドラッグ・クリックの設定をする

// ============================================================
// ◆ ① 光の模様を描く計算(シェーダー)
// ============================================================
// 画面の点1つ1つの色を、GPU(グラフィック用の部品)で同時に計算する。
// 点ごとの計算をJSでやると重すぎるので、GPU用の言葉(GLSL)で書いている

// 四角い板を1枚描くだけの、頂点の計算(色はすべて下の FRAGMENT で決める)
const VERTEX = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;

const FRAGMENT = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;

  // --- 3次元のなめらかなノイズ(雲のようなムラ)を作る計算。一般に広く使われている simplex noise ---
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // ノイズの「0 になる所」だけを光らせると、うねった光の筋になる。
  // ぼんやり広い光(にじみ)と、細く強い光(芯)を重ねて、写真のような柔らかい筋にする
  float filament(vec3 p) {
    float d = 1.0 - abs(snoise(p));
    return pow(d, 3.0) * 0.8 + pow(d, 16.0);
  }

  void main() {
    float r = length(vUv);
    if (r > 1.0) discard; // 丸の外は描かない(透明のまま)

    // 平らな丸を、球の表面として扱う(真ん中が手前に膨らんでいる)
    vec3 n = vec3(vUv, sqrt(1.0 - r * r));

    // 球の中の空間を、ゆっくり回しながら、ノイズでゆがめる(ウネウネの正体)
    float t = uTime * 0.12;
    vec3 p = n * 0.8 + vec3(0.0, t * 0.6, t);
    vec3 warp = vec3(snoise(p * 0.6 + t), snoise(p * 0.6 - t + 4.0), snoise(p * 0.6 + 8.0));
    vec3 q = p + warp * 0.20; // ゆがめる強さ。大きいほど、筋が細かく曲がりくねる

    // 光の筋を2層重ねて、交差する光にする(2層目は横に引き伸ばして、写真のように斜めに流れる筋にする)
    float f = filament(q) + 0.6 * filament(q * vec3(0.6, 1.4, 1.0) + 3.0);

    // 色: 紺の地に、青い光。強い所ほど白く、ゆっくり動くムラでピンクが差す
    vec3 base = vec3(0.13, 0.15, 0.27);
    float pinkArea = smoothstep(-0.1, 0.7, snoise(p * 0.7 + vec3(t * 0.5)));
    vec3 glow = mix(vec3(0.25, 0.5, 1.0), vec3(0.85, 0.35, 0.9), pinkArea * 0.7);
    vec3 light = pinkArea * vec3(0.4, 0.1, 0.38) * 0.6; // 地の部分にも、うっすらピンクのにじみ
    light += glow * f * 1.3;
    light += vec3(1.0) * smoothstep(0.6, 1.4, f) * 0.7; // 一番強い所は、白く飛ばす
    light += vec3(0.35, 0.3, 0.8) * pow(1.0 - n.z, 3.0) * 0.15; // ふちに、ほんのりガラスの光

    // 透明感: 紺の地は、真ん中でも半分ほど透け、ふちに行くほど、さらに透ける。
    // 光の筋は、明るい所ほど濃く見せる(光だけが宙に浮いているように見える)
    float body = 0.45 * (1.0 - smoothstep(0.3, 1.0, r));
    float lightA = clamp(max(max(light.r, light.g), light.b), 0.0, 1.0);
    // 外縁を、なだらかに薄くする。一番外側の1ピクセルぶんは消して、ギザギザを消す
    float edgeFade = (1.0 - smoothstep(0.6, 1.0, r) * 0.75) * (1.0 - smoothstep(0.97, 1.0, r));
    float alpha = clamp(body + lightA * 0.9, 0.0, 1.0) * edgeFade;

    // 色は、地と光を、それぞれの濃さで重ねる(透けた所からは、後ろの景色が見える)。
    // 濃さ(alpha)と同じだけ色も薄めないと、ふちの光が明るいまま残ってしまう
    vec3 col = (base * body + light) * edgeFade;
    gl_FragColor = vec4(col, alpha);
  }`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

// canvas に描画を始める。canvas がページから無くなったら(別のページへ移ったら)、自動で止まる
function startMarble(canvas) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true });
  if (!gl) return; // WebGL が使えないブラウザでは、何もしない(アイコンはただの丸になる)

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  gl.useProgram(program);

  // 画面いっぱいの四角(三角形2枚)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uTime = gl.getUniformLocation(program, 'uTime');

  const start = performance.now();
  function frame() {
    if (!canvas.isConnected) return; // ページを移って canvas が捨てられたら、描画をやめる

    // 表示されている大きさに合わせて、くっきり描く(高解像度の画面では、その分細かく)
    const size = Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2));
    if (canvas.width !== size) { canvas.width = canvas.height = size; gl.viewport(0, 0, size, size); }

    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(frame);
  }
  frame();
}

// ============================================================
// ◆ ② ドラッグで動かす処理
// ============================================================
// 押したまま動かすと、アイコンが付いてくる。動かせるのは、右側の画面(.main_content)の中だけ。
// マウスにぴったり付いていくのではなく、少し遅れて、とろみのある液体の中を進むように「ヌラ〜」と追いかける。
// 速く動かした時は、進む向きにほんの少し伸びて、止まると丸に戻る
const DRAG_THRESHOLD = 4; // この距離(px)より動いたら「ドラッグした」とみなす(少し手が震えただけのクリックと区別するため)
const FOLLOW = 5;         // 追いかける速さ。小さいほど、遅れてヌラ〜っと付いてくる
const STRETCH = 0.0005;   // 速さに対する伸び具合
const MAX_STRETCH = 0.12; // 伸びすぎないための上限(元の大きさの 12% まで)

function makeDraggable(icon) {
  const area = icon.offsetParent; // 位置の基準になっている .main_content
  let start = null; // 押した瞬間の、マウスの位置とアイコンの位置
  let dragged = false;
  let target = null;  // アイコンが向かう先(マウスに合わせた位置)
  let current = null; // アイコンの今の位置
  let moving = false; // 追いかけの動きが動いている最中か
  let lastTime = 0;

  // 毎フレーム、今の位置を、向かう先に少しずつ近づける
  function follow(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    const k = 1 - Math.exp(-FOLLOW * dt); // 画面の更新の速さが違っても、同じ速さで追いかけるための割合
    const vx = (target.x - current.x) * k, vy = (target.y - current.y) * k;
    current.x += vx; current.y += vy;
    icon.style.left = current.x + 'px';
    icon.style.top = current.y + 'px';

    // 進む向きに伸ばす(向きに合わせて回し、横に伸ばし、回して戻す)
    const speed = Math.hypot(vx, vy) / Math.max(dt, 0.001);
    const s = Math.min(speed * STRETCH, MAX_STRETCH);
    const angle = Math.atan2(vy, vx);
    icon.style.transform = `rotate(${angle}rad) scale(${1 + s}, ${1 - s * 0.6}) rotate(${-angle}rad)`;

    // 向かう先にほぼ着いて、手も離していたら止める
    if (!start && Math.hypot(target.x - current.x, target.y - current.y) < 0.3) {
      icon.style.transform = '';
      moving = false;
      return;
    }
    requestAnimationFrame(follow);
  }

  icon.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return; // 左クリック(タッチ)の時だけ
    // 止まっている時は、今の位置から始める。
    // 追いかけの途中でつかみ直した時は、向かう先をそのまま使う(今の位置に合わせると、アイコンが跳ねてしまうため)
    if (!moving) {
      current = { x: icon.offsetLeft, y: icon.offsetTop };
      target = { x: current.x, y: current.y };
    }
    start = { x: e.clientX, y: e.clientY, left: target.x, top: target.y };
    dragged = false;
    // 押している間は、マウスがアイコンの外に出ても、動きをこのアイコンで受け取り続ける(速く動かしても置いていかれないように)
    icon.setPointerCapture(e.pointerId);
  });

  icon.addEventListener('pointermove', function (e) {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    dragged = true;
    icon.classList.add('dragging');
    // 画面の外へはみ出さないように、.main_content の内側に収める
    target.x = Math.min(Math.max(0, start.left + dx), area.clientWidth - icon.offsetWidth);
    target.y = Math.min(Math.max(0, start.top + dy), area.clientHeight - icon.offsetHeight);
    if (!moving) {
      moving = true;
      lastTime = performance.now();
      requestAnimationFrame(follow);
    }
  });

  // 手を離しても、向かう先までは、そのままヌラ〜っと進み続ける
  function end() {
    start = null;
    icon.classList.remove('dragging');
  }
  icon.addEventListener('pointerup', end);
  icon.addEventListener('pointercancel', end);

  // 最後の操作がドラッグだったかを、外(クリックの処理)から確かめられるようにする
  return function wasDragged() { return dragged; };
}

// ============================================================
// ◆ ③ 「音」のページを開いた時に、描画・ドラッグ・クリックの設定をする
// ============================================================
// アイコンは「音」のページを開くたびに新しく作られる(_soundパーシャルにある)ので、そのたびに設定し直す
document.addEventListener('turbo:load', function () {
  const icon = document.getElementById('marble_icon');
  if (!icon) return; // 「音」以外のページには無いので、何もしない
  startMarble(icon.querySelector('canvas'));
  const wasDragged = makeDraggable(icon);

  // クリックしたら、ビジュアライザー(public/visualizer/index.html)を別タブで開く。
  // ドラッグして離した時にも click は起きるので、その時は開かない(動かしただけでタブが開かないように)
  icon.addEventListener('click', function () {
    if (wasDragged()) return;
    // 同じウィンドウの中に、別タブで開く。
    // window.open の3つ目に 'noopener' などの設定を書くと、ブラウザが「小さな別ウィンドウ(ポップアップ)で開いて」という意味に受け取り、
    // 別のウィンドウで開いてしまう。そこで、ふつうのリンク(<a>)を作ってクリックしたことにして、ヘッダーのリンクと同じ開き方にする
    const link = document.createElement('a');
    link.href = '/visualizer/';
    link.target = '_blank';
    link.rel = 'noopener'; // 開いたタブから、こちらのタブを操作できないようにする(別タブで開く時の、安全のための決まり)
    link.click();
  });
});
