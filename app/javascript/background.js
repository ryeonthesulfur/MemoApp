// ============================================================
// ◆ 背景の切り替え(電源オン: 背景画像 / 電源オフ: ビジュアライザー)
// ============================================================
// 共通レイアウトの canvas(#ambient_canvas)に、ビジュアライザーを描く。
// canvas はページを移っても取り替えない(data-turbo-permanent)ので、描き始めるのは最初の1回だけで、ページを移っても止まらない。
// サイドバーの電源ボタンで、ブラウン管テレビのオン・オフのように、背景画像と切り替えられる。
// 選んだ方はブラウザに覚えさせて、開き直しても戻らないようにする
const STORAGE_KEY = 'background'; // 'ambient'(ビジュアライザー) か 'image'(背景画像)。レイアウトの<head>でも、同じ名前で読んでいる
const CRT_ON_MS = 900; // 電源オンの演出の長さ(application.css の crt-on と同じ)

let ambient = null;      // 描いているビジュアライザー(止める・再開するのに使う)
let ambientLoading = false; // three.js を読み込んでいる途中に、もう一度描き始めないための目印
let pauseTimer = null;   // 背景画像に戻しきってから、ビジュアライザーを止めるまでのタイマー

// 覚えている方を返す。何も覚えていない時は、ビジュアライザーにする
// (ブラウザの設定で、覚えさせる場所が使えないこともあるので、その時もビジュアライザーにする)
function savedMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'image' ? 'image' : 'ambient';
  } catch (e) {
    return 'ambient';
  }
}

function saveMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (e) {
    // 覚えさせられなくても、切り替え自体はできるので、何もしない
  }
}

async function showAmbient() {
  clearTimeout(pauseTimer); // 背景画像に戻している途中なら、止めるのをやめる
  document.documentElement.classList.add('ambient'); // 背景画像を消す(CSS の html.ambient)

  if (ambient) {
    ambient.resume();
    return;
  }
  if (ambientLoading) return;
  ambientLoading = true;

  // three.js(約700KB)は、ビジュアライザーを初めて出す時に、ここで読み込む
  const { startAmbient } = await import("ambient_background");
  const canvas = document.getElementById('ambient_canvas');
  ambient = startAmbient(canvas);

  // 読み込んでいる間に、背景画像に戻されていたら、描くのを止めておく
  if (!document.documentElement.classList.contains('ambient')) ambient.pause();

  // 最初の1枚を描き終えてから、ふわっと出す(描く前に出すと、何も無い画面が一瞬見えてしまうため)
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      canvas.classList.add('show');
    });
  });
}

function showImage() {
  document.documentElement.classList.remove('ambient'); // 背景画像を戻す
  // 背景画像が広がりきって、ビジュアライザーが見えなくなってから止める(見えない絵を描き続けて、GPU を無駄に使わないため)
  pauseTimer = setTimeout(function () {
    if (ambient) ambient.pause();
  }, CRT_ON_MS);
}

// ブラウン管テレビのオン・オフの演出を1回流す(CSS の html.crt-on / html.crt-off)。終わったら外す
function playCrt(name) {
  const html = document.documentElement;
  html.classList.remove('crt-on', 'crt-off'); // 演出の途中で押された時は、前の演出をやめて、新しい方を最初から流す
  void html.offsetWidth; // 外したことを一度ブラウザに反映させる(しないと、同じ演出を続けて流した時に、2回目が動かないため)
  html.classList.add(name);
}

// 演出が終わったら、目印を外す(付けたままだと、ページを開き直した時と同じ、ただの「オン」「オフ」の状態に戻らないため)
document.addEventListener('animationend', function (e) {
  if (e.animationName === 'crt-on' || e.animationName === 'crt-off') {
    document.documentElement.classList.remove('crt-on', 'crt-off');
  }
});

// turbo:load は「ページの読み込みが終わったよ」のタイミングで発火するイベント
document.addEventListener('turbo:load', function () {
  if (savedMode() === 'ambient') showAmbient();

  // 電源ボタンはサイドバーにあり、ページを移るたびに新しいものに取り替わるので、毎回つなぎ直す
  const button = document.querySelector('.item-close');
  if (!button) return;
  button.addEventListener('click', function () {
    if (document.documentElement.classList.contains('ambient')) {
      // 電源オン: 背景画像が、点から広がって映る
      saveMode('image');
      playCrt('crt-on');
      showImage();
    } else {
      // 電源オフ: 背景画像が、つぶれて点になって消え、後ろのビジュアライザーが見える
      saveMode('ambient');
      playCrt('crt-off');
      showAmbient();
    }
  });
});
