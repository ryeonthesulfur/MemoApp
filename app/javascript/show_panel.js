// このファイルは、メモの詳細表示・編集・保存(PATCH /memos/:id)・閉じる、を担当
// window.js の getRefs() を読み込む
//
// 目次
// ① メモ詳細を開く処理本体(window.openMemoDetailとしてwindowに公開し、folder_columns.jsからも呼べるようにする)
// ② メインパネルでメモのアイコンがクリックされた時の入口
// ③ 「編集」ボタンの処理(編集開始⇄保存の切り替え)
// ④ 「閉じる」ボタンの処理
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {
  const { icon_container, show_panel } = getRefs();

  let currentMemoId = null;
  let isEditing = false;


  const close_button = document.querySelector('.close_button');
  const edit_button = document.querySelector('.edit_button');


  // ============================================================
  // ◆ ① メモ詳細を開く処理本体
  // ============================================================
  // ▲▲▲ メモ詳細を開く処理を関数として切り出し、folder_columns.js からも呼べるように window に公開する
  window.openMemoDetail = function (memoId) {
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
  };

  // ============================================================
  // ◆ ② メインパネルでメモのアイコンがクリックされた時の入口
  // ============================================================
  // 中身を開いて閲覧するためにアイコンがクリックされたら、名前クリックかアイコンクリックかを判定して中身を開く関数を呼び出す処理（選択したメモ限定で、中身を開く関数のみを反応させるため。）
  icon_container.addEventListener('click', function (e) {
    if (window.isSelecting) return; // 選択モード中は、名前クリックの処理は select.js が担当するので、ここでは何もしない
    if (e.target.classList.contains('folder-name')) {
      return; // 名前がクリックされた時は、top.js のインライン編集に任せて何もしない
    }

    const icon = e.target.closest('.folder-icon');
    if (!icon || !icon.dataset.memoId) return; // フォルダなど、メモじゃないものは無視する

      window.openMemoDetail(icon.dataset.memoId); // ▲▲▲ 結果的にこの閲覧するための関数を呼ぶだけにする
  });


  // ============================================================
  // ◆ ③ 「編集」ボタンの処理(編集開始⇄保存の切り替え)
  // ============================================================
  // メモ内容の編集機能
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


  // ============================================================
  // ◆ ④ 「閉じる」ボタンの処理
  // ============================================================
  // 「閉じる」ボタンでパネルを隠す
  close_button.addEventListener('click', function () {
    show_panel.classList.remove('show');
  });
});
