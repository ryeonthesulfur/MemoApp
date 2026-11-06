// このファイルは、新規メモの保存(POST /memos)を担当
// window.js の getRefs() を読み込む
//
// 目次
// A. 必要なDOM要素をまとめて取得
// B. Enterキーで入力内容が消えないようにする処理
// C. 保存ボタンが押された時の処理本体(Railsへの保存リクエスト〜画面への反映まで)
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {
  if (!document.getElementById('main_panel')) return; // 「憶」のパネルが無いページ(「音」など)では、「憶」用の設定をしない(部品が見つからずエラーになるため)

  // ============================================================
  // ◆ A. 必要なDOM要素をまとめて取得
  // ============================================================
  // 必要な要素をまとめて受け取る(前は下でもう一度 getElementById していて二重宣言エラーになっていた)
  const {
    panel,         // #main_panel (フォルダ/メモの一覧パネル)
    memo_panel,    // #memo_panel (メモ編集パネル)
    save_btn,      // 保存ボタン
    title_input,   // タイトル入力欄
    body_input     // 本文入力欄
  } = getRefs();

  // ============================================================
  // ◆ B. Enterキーで入力内容が消えないようにする処理
  // ============================================================
  // 入力欄は <form> の中にあるので、Enterを押すとブラウザがフォームを送信して、ページを読み込み直してしまう(入力内容が消える)。
  // 保存は C の保存ボタンでJSから行うので、フォームとしての送信はいらない。送信されそうになったら止める
  title_input.form.addEventListener('submit', function (e) {
    e.preventDefault();
  });

  // タイトル欄でEnterを押したら、保存はせずに、入力を終える(カーソルを外す)だけにする。続きは本文欄をクリックして書く
  title_input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.isComposing) return; // 日本語の変換を確定するEnterでは、入力を終えない(まだタイトルを打っている途中のため)
    e.preventDefault();
    title_input.blur();
  });

  // ============================================================
  // ◆ C. 保存ボタンが押された時の処理本体（ここだけ async は使用していない。）
  // ============================================================
  // 保存ボタンを押したら、Railsにメモを保存しに行く
save_btn.addEventListener('click', function () {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;  // 身分証明書となるcsrfトークンを「application.html.erb」から発行する。

    // JSのオブジェクトをJSON文字列に変換して、POSTリクエストとして/memosに送信する
    fetch('/memos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,  // 身分証明書をここで貼る
      },
      body: JSON.stringify({
        memo: {
          title: title_input.value,
          content: body_input.value,
          folder_id: window.currentColumnFolderId, // ▲▲▲ どのフォルダの中で作られたメモか(nullならルート直下)
        },
      }),
    })
      // この間にRailsが routes.rb → MemosController#create → Memoモデルの順で処理し、
      // 保存した内容をJSONに変換して返してくる(サーバー側なのでここには出てこない)
      .then(response => response.json()) // 返ってきたJSON文字列をJSオブジェクトに戻す
      .then(savedMemo => {
        // 保存できたら、パネルを一覧側に戻す
        memo_panel.classList.remove('show');
        panel.classList.add('show');

        // 保存されたメモのアイコンをその場で追加する
        const new_memo = document.createElement('div');
        new_memo.classList.add('folder-icon');
        new_memo.dataset.memoId = savedMemo.id;
        new_memo.innerHTML = `
          <span class="material-symbols-outlined color-blue">description</span>
          <span class="folder-name">${savedMemo.title || '無題'}</span>
        `;

        // ▲▲▲ folder_idがあれば、そのフォルダのカラムが今開いていればその中に追加。無ければメインパネルに追加。
        if (savedMemo.folder_id) {
          const targetColumn = document.querySelector(`.folder_column[data-folder-id="${savedMemo.folder_id}"] .folder_show_content`);
          if (targetColumn) targetColumn.appendChild(new_memo);
        } else {
          window.icon_container.appendChild(new_memo);
        }

        window.currentColumnFolderId = null; // ▲▲▲ 使い終わったのでリセットしておく

        // 入力欄を空に戻す
        title_input.value = '';
        body_input.value = '';
      });
  });
});
