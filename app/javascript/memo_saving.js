// window.js の getRefs() を読み込む
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {

  // 必要な要素をまとめて受け取る(前は下でもう一度 getElementById していて二重宣言エラーになっていた)
  const {
    panel,         // #main_panel (フォルダ/メモの一覧パネル)
    memo_panel,    // #memo_panel (メモ編集パネル)
    save_btn,      // 保存ボタン
    title_input,   // タイトル入力欄
    body_input     // 本文入力欄
  } = getRefs();

  // 保存ボタンを押したら、Railsにメモを保存しに行く
save_btn.addEventListener('click', function () {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;  // 身分証明書となるcsrfトークンを「application.html.erb」から発行する。

    // ①②: JSのオブジェクトをJSON文字列に変換して、POSTリクエストとして/memosに送信する
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
        },
      }),
    })
      // ③〜⑦: この間にRailsが routes.rb → MemosController#create → Memoモデルの順で処理し、
      // 保存した内容をJSONに変換して返してくる(サーバー側なのでここには出てこない)
      .then(response => response.json()) // ⑧: 返ってきたJSON文字列をJSオブジェクトに戻す
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
        window.icon_container.appendChild(new_memo);

        // 入力欄を空に戻す
        title_input.value = '';
        body_input.value = '';
      });
  });
});
