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

// 「音」のページに来た時に、Webampのウィンドウを出す
async function showWebamp() {
  // 2回目以降は、覚えておいたウィンドウを付け直すだけ(再生状態・プレイリストもそのまま戻る。実験2で確認済み)
  // 同じWebampは2回表示できない(Cannot render a Webamp instance twice)ので、作り直さずに付け直す
  if (window.webampNode) {
    document.body.appendChild(window.webampNode);
    return;
  }
  if (webampLoading) return;
  webampLoading = true;

  // Webampの部品(約2MB)は、「音」を初めて開いた時だけ読み込む
  const { default: Webamp } = await import("webamp");

  // 読み込んでいる間に、別のページへ移っていたら、何もしない(次に「音」を開いた時に作る)
  const holder = document.getElementById('webamp_holder');
  if (!holder) {
    webampLoading = false;
    return;
  }

  // プレイリストは最初は空。曲はウィンドウにドラッグ&ドロップして追加する
  // 設定が無くても {} を渡す(何も渡さないと、Webampの中で設定を読もうとしてエラーになるため)
  window.myWebamp = new Webamp({});
  await window.myWebamp.renderWhenReady(holder); // holder の範囲の中に、ウィンドウを並べて表示する
  window.webampNode = document.getElementById('webamp'); // Webampが<body>に作ったウィンドウの入れ物を覚えておく(ページを移っても、この変数に残る)

  // Webampで再生が始まったら、BGMを止める。track は、再生が始まった時は曲の情報、停止・一時停止の時は null(実験3で確認済み)
  window.myWebamp.onTrackDidChange(function (track) {
    if (track) window.bgm.pause();
  });

  // 表示の準備をしている間に、別のページへ移っていたら、ウィンドウを外しておく
  if (!document.getElementById('sound_title')) window.webampNode.remove();
}

// ページを離れる時、Turboが画面を保存する前に、ウィンドウを外しておく
// 外さないと、ブラウザの「戻る」で保存された画面に戻った時、動かないウィンドウのコピーが残って、付け直した本物と2つになるため
document.addEventListener('turbo:before-cache', function () {
  if (window.webampNode) window.webampNode.remove();
});

// ============================================================
// ◆ 「音」のページの演出
// ============================================================
// turbo:load は「ページの読み込みが終わったよ」のタイミングで発火するイベント。
// 「音」のページ(/sound)に移った時に、見出し「音楽」をフワッと表示し、右下のMIND PALACEをフワッと消す(「憶」と同じ演出)
document.addEventListener('turbo:load', function () {
  const sound_title = document.getElementById('sound_title'); // 見出し「音楽」(_soundパーシャルにある)
  if (!sound_title) return; // 「音」以外のページには無いので、何もしない
  const main_title = document.querySelector('.main_title'); // 右下のMIND PALACE(レイアウトにある)

  showWebamp();

  // 透明な状態を1回画面に描かせてから show を付ける。
  // すぐに付けると、透明→表示の変化が起きず、2秒の演出にならないため
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      sound_title.classList.add('show');
      main_title.classList.add('hide');
    });
  });
});

