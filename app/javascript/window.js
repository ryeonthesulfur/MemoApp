// このファイルは、各JSファイルからよく使うDOM要素をまとめて取得するgetRefs()関数を提供
export function getRefs() {
  return {
    panel: document.getElementById('main_panel'), // メインパネル(フォルダ/メモの一覧パネル)
    memo_panel: document.getElementById('memo_panel'), // 新規メモ作成・編集用のパネル(タイトル・本文の入力欄がある)
    save_btn: document.getElementById('save_btn'), // memo_panel内の保存ボタン
    title_input: document.getElementById('title'), // memo_panel内の、メモのタイトル入力欄
    body_input: document.getElementById('body'), // memo_panel内の、メモの本文入力欄
    icon_container: document.querySelector('.icon-container'), // メインパネルの中で、フォルダ/メモのアイコンが並んでる場所
    memo: document.querySelectorAll('.item-boxes')[0], // サイドバーの「憶」(クリックでメインパネルの開閉に使う)
    header_title: document.getElementById('header_title'), // ヘッダーのタイトル文字「記憶」
    memo_select: document.getElementById('memo_select'), // 「メモ or フォルダ」の選択メニュー
    add_btn: document.getElementById('add_btn'), // メインパネルの「+」ボタン
    new_items: document.querySelectorAll('#main_panel .new_items'), // 「メモ」「フォルダ」の選択肢(li要素2つ)
    or_item: document.querySelector('.or_item'), // 「or」の文字
    back_btn: document.querySelector('.back_btn'), // memo_panelの「＜」、一覧パネルに戻るボタン
    main_title: document.querySelector('.main_title'), // MIND PALACE的な大きいタイトル文字
    show_panel: document.getElementById('main_show_panel'), // 既存メモをクリックした時に開く、詳細表示パネル(新規作成用のmemo_panelとは別物)
    folder_panel: document.getElementById('folder_columns_container'), // 開いてる全カラム(子フォルダのパネル)をまとめて入れる場所
    bgm: document.getElementById('bgm') // BGM再生用のaudio要素
  };
}