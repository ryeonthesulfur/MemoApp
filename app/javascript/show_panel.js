// window.js の getRefs() を読み込む
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {
  const { icon_container } = getRefs();
  
  let currentMemoId = null;
  let isEditing = false;


  const show_panel = document.getElementById('main_show_panel');
  const close_button = document.querySelector('.close_button');
  const edit_button = document.querySelector('.edit_button');


  // アイコンがクリックされたら、名前クリックかアイコンクリックかを判定する
  icon_container.addEventListener('click', function (e) {
    if (e.target.classList.contains('folder-name')) {
      return; // 名前がクリックされた時は、top.js のインライン編集に任せて何もしない
    }

    const icon = e.target.closest('.folder-icon');
    if (!icon || !icon.dataset.memoId) return; // フォルダなど、メモじゃないものは無視する

    const memoId = icon.dataset.memoId; // 選択したメモの id を変数に取得する。

    // クリックされたメモの中身をRailsに取りに行く
    fetch(`/memos/${memoId}`)
      .then(response => response.json())
      .then(memo => {
        currentMemoId = memoId;
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

  // 編集機能
      edit_button.addEventListener('click', function() {
        const show_title = document.querySelector('.show_title');
        const show_body = document.querySelector('.body');

    if (!isEditing) {
        isEditing = true;
        show_title.contentEditable = true;
        show_body.contentEditable = true;
        show_title.focus();
        edit_button.textContent = '保存する';
        } else {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

        fetch(`/memos/${currentMemoId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
            },
            body: JSON.stringify({
                memo: {
                    title: show_title.textContent,
                    content: show_body.textContent,
                },
              }),
            })
                .then(response => response.json())
                .then(updatedMemo => {
                isEditing = false;
                show_title.contentEditable = false;
                show_body.contentEditable = false;
                edit_button.textContent = '編集';
            });
          }
        });


  // 「閉じる」ボタンでパネルを隠す
  close_button.addEventListener('click', function () {
    show_panel.classList.remove('show');
  });
});
