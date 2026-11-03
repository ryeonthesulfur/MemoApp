// ============================================================
// ◆ BGM
// ============================================================
// 画面の<audio>ではなく、JSだけで作る。画面の要素だと、ページを移った時に<body>ごと捨てられて止まってしまうため
// (JSだけで作ったAudioは、ページを移っても鳴り続ける。「音」の実装５の実験1で確認済み)
window.bgm = new Audio("/bgm.wav");
window.bgm.loop = true; // 最後まで流れたら、最初から繰り返す

// Enterキーを押すたびに鳴らす(止まった後も、もう一度押せばまた鳴る)。すでに鳴っている時は、何も起きない
// turbo:load の外に書くのは、画面全体の読み込みで1回だけ登録するため(中に書くと、ページを移るたびに同じ設定が増えていく)
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    // Webampで再生している間は、BGMを鳴らさない(音が重ならないように。メモ名を確定するEnterでも鳴らないようにするため)
    if (window.myWebamp && window.myWebamp.getMediaStatus() === 'PLAYING') return;
    window.bgm.play();
  }
});

// ============================================================
// ◆ Webamp
// ============================================================
let webampLoading = false; // 初めて表示している途中に、もう一度「音」を開いた時、Webampを2つ作らないための目印

// 「音」のページに初めて来た時に、Webampを作って表示する
// ウィンドウは、レイアウトにある入れ物(#webamp_container、data-turbo-permanent)の中に表示する。
// この入れ物はページを移っても取り替えられないので、2回目以降は何もしなくても、ウィンドウが元の状態のまま出る
// (「音」以外のページでは、CSSで入れ物ごと隠している)
async function showWebamp() {
  if (window.myWebamp || webampLoading) return; // 作るのは1回だけ(同じWebampは2回表示できないため)
  webampLoading = true;

  // Webampの部品(約2MB)は、「音」を初めて開いた時だけ読み込む
  const { default: Webamp } = await import("webamp");

  // 読み込んでいる間に、別のページへ移っていたら、何もしない(入れ物が隠れていて、ウィンドウを並べる大きさが測れないため。次に「音」を開いた時に作る)
  if (!document.getElementById('sound_title')) {
    webampLoading = false;
    return;
  }

  // プレイリストは最初は空。曲はウィンドウにドラッグ&ドロップして追加する
  // 設定が無くても {} を渡す(何も渡さないと、Webampの中で設定を読もうとしてエラーになるため)
  window.myWebamp = new Webamp({});

  // renderInto は、渡した入れ物を「ウィンドウを動かせる範囲」にして、その中央にウィンドウを並べる。
  // renderWhenReady だと、その時の<body>が範囲になる。<body>はページを移るたびにTurboが取り替えるので、
  // 戻ってきた後は捨てられた古い<body>(大きさ0)が範囲のままになり、ドラッグした瞬間にウィンドウが画面の外へ飛んでしまう
  await window.myWebamp.renderInto(document.getElementById('webamp_container'));

  // Webampで再生が始まったら、BGMを止める。track は、再生が始まった時は曲の情報、停止・一時停止の時は null(実験3で確認済み)
  window.myWebamp.onTrackDidChange(function (track) {
    if (track) window.bgm.pause();
  });
}

// ============================================================
// ◆ 「音」のページの演出
// ============================================================
// turbo:load は「ページの読み込みが終わったよ」のタイミングで発火するイベント。
// 「音」のページ(/sound)に移った時に、見出し「音楽」とWebampをフワッと表示し、右下のMIND PALACEをフワッと消す。
// もう一度「音」を押したら、フワッと閉じて、閉じ終わってから / に戻る(「憶」と同じ演出)
document.addEventListener('turbo:load', function () {
  const sound_title = document.getElementById('sound_title'); // 見出し「音楽」(_soundパーシャルにある)
  if (!sound_title) return; // 「音」以外のページには無いので、何もしない
  const main_title = document.querySelector('.main_title'); // 右下のMIND PALACE(レイアウトにある)
  const webamp_container = document.getElementById('webamp_container'); // Webampのウィンドウの入れ物(レイアウトにある)
  const sound_link = document.querySelector('.item-boxes a[href="/sound"]'); // サイドバーの「音」

  function openSound() {
    sound_title.classList.add('show');
    main_title.classList.add('hide');
    webamp_container.classList.remove('hide');
  }

  function closeSound() {
    sound_title.classList.remove('show');
    main_title.classList.remove('hide');
    webamp_container.classList.add('hide');
  }

  showWebamp();

  // Webampの入れ物は、ページを移っても同じもの(data-turbo-permanent)なので、前に閉じた時の hide が残っていることがある。
  // いったん透明にしてから開き直して、毎回フワッと出るようにする
  webamp_container.classList.add('hide');

  // 透明な状態を1回画面に描かせてから開く。
  // すぐに開くと、透明→表示の変化が起きず、フワッとした演出にならないため
  requestAnimationFrame(function () {
    requestAnimationFrame(openSound);
  });

  let closeTimer = null; // 閉じ終わってから / に戻るまでのタイマー

  sound_link.addEventListener('click', function (e) {
    e.preventDefault(); // /sound にいる時は、リンクでページを移らずに開閉する
    if (sound_title.classList.contains('show')) {
      closeSound();
      // 「音楽」とMIND PALACEの2秒の演出が終わってから / に戻る。待っている間に別のページへ移っていたら戻らない
      closeTimer = setTimeout(function () {
        if (location.pathname === '/sound') Turbo.visit('/');
      }, 2000);
    } else {
      // 閉じている途中(/ に戻る前)にもう一度押された場合は、戻るのをやめて開き直す
      clearTimeout(closeTimer);
      openSound();
    }
  });
});

