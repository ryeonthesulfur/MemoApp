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
    window.bgm.play();
  }
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

  // 透明な状態を1回画面に描かせてから show を付ける。
  // すぐに付けると、透明→表示の変化が起きず、2秒の演出にならないため
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      sound_title.classList.add('show');
      main_title.classList.add('hide');
    });
  });
});

