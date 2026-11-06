// このファイルは、各JSファイルからよく使うDOM要素をまとめて取得するgetRefs()関数を提供
export function getRefs() {
  return {
    panel: document.getElementById('main_panel'), // メインパネル(フォルダ/メモの一覧パネル)
    save_btn: document.getElementById('save_btn'), // メモの画面(show_panel)の「保存」ボタン(編集の状態の時だけ見える)
    title_input: document.getElementById('title'), // メモの画面の、タイトル入力欄(編集の状態の時だけ見える)
    body_input: document.getElementById('body'), // メモの画面の、本文入力欄(編集の状態の時だけ見える)
    icon_container: document.querySelector('.icon-container'), // メインパネルの中で、フォルダ/メモのアイコンが並んでる場所
    memo: document.querySelectorAll('.item-boxes')[0], // サイドバーの「憶」(クリックでメインパネルの開閉に使う)
    header_title: document.getElementById('header_title'), // ヘッダーのタイトル文字「記憶」
    memo_select: document.getElementById('memo_select'), // 「メモ or フォルダ」の選択メニュー
    add_btn: document.getElementById('add_btn'), // メインパネルの「+」ボタン
    new_items: document.querySelectorAll('#main_panel .new_items'), // 「メモ」「フォルダ」の選択肢(li要素2つ)
    or_item: document.querySelector('.or_item'), // 「or」の文字
    main_title: document.querySelector('.main_title'), // MIND PALACE的な大きいタイトル文字
    show_panel: document.getElementById('main_show_panel'), // メモの画面(新規作成・閲覧・編集をこの1枚で行う)
    folder_panel: document.getElementById('folder_columns_container') // 開いてる全カラム(子フォルダのパネル)をまとめて入れる場所
  };
}