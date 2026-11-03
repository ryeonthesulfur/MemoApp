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

