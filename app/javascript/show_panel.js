// window.js の getRefs() を読み込む
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {
  const { icon_container } = getRefs();

  const show_panel = document.getElementById('main_show_panel');
  const close_button = document.querySelector('.close_button');

  // アイコンがクリックされたら、名前クリックかアイコンクリックかを判定する
  icon_container.addEventListener('click', function (e) {
    if (e.target.classList.contains('folder-name')) {
      return; // 名前がクリックされた時は、top.js のインライン編集に任せて何もしない
    }

    const icon = e.target.closest('.folder-icon');
    if (!icon || !icon.dataset.memoId) return; // フォルダなど、メモじゃないものは無視する

    const memoId = icon.dataset.memoId;

    // クリックされたメモの中身をRailsに取りに行く
    fetch(`/memos/${memoId}`)
      .then(response => response.json())
      .then(memo => {
        // 取れた内容をパネルに表示する
        document.querySelector('.date').textContent = new Date(memo.created_at).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        document.querySelector('.show_title').textContent = memo.title || '無題';
        document.querySelector('.show_content .body').textContent = memo.content;
        show_panel.classList.add('show');
      });
  });

  // 「閉じる」ボタンでパネルを隠す
  close_button.addEventListener('click', function () {
    show_panel.classList.remove('show');
  });
});
