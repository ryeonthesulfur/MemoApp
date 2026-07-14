// window.js の getRefs() を読み込む。中身は「よく使うDOM要素をまとめて取ってくる関数」
import { getRefs } from "window"

// turbo:load は「ページの読み込みが終わったよ」のタイミングで発火するイベント。
// この中に書いた処理は、ページが表示されるたびに実行される。
document.addEventListener('turbo:load', function () {

  // getRefs() を呼んで、必要な要素をまとめて受け取る(分割代入)
  const {
    memo,          // メモ一覧の箱(クリックでパネル開閉に使う)
    panel,         // #main_panel (フォルダ/メモの一覧パネル)
    header_title,  // ヘッダーのタイトル文字
    memo_select,   // 「メモ or フォルダ」の選択メニュー
    add_btn,       // 右下などにある「+」ボタン
    new_items,     // 「メモ」「フォルダ」の選択肢(li要素2つ)
    or_item,       // 「or」の文字
    memo_panel,    // #memo_panel (メモ編集パネル)
    back_btn,      // メモ編集パネルの「＜」戻るボタン
    main_title,    // MIND PALACE的な大きいタイトル文字
    icon_container // アイコンを並べてる場所(.icon-container)
  } = getRefs();

  // new_items[0] が「メモ」ボタン、new_items[1] が「フォルダ」ボタン
  const memo_btn = new_items[0];
  const folder_btn = new_items[1];

  // select.js が window.icon_container を見に来るので、ここでも window に載せておく
  window.icon_container = icon_container;

  // 「+」ボタンで開いた「メモ or フォルダ」の選択メニューを閉じる処理(共通化してまとめてある)
  function closeAddMenu() {
    new_items.forEach(item => item.classList.remove('show'));
    or_item.classList.remove('show');
    memo_select.classList.remove('show');
  }

  // メモ一覧をクリックしたら、パネルの開閉を切り替える
  memo.addEventListener('click', function () {
    if (panel.classList.contains('show') || memo_panel.classList.contains('show')) {
      // すでに開いてるなら閉じる
      panel.classList.remove('show');
      memo_panel.classList.remove('show');
      header_title.classList.remove('show');
      main_title.classList.remove('show');
      closeAddMenu();
      window.action_bar.classList.remove('show');
      if (window.isSelecting) window.turnOffSelectMode(); // 選択モード中なら解除
    } else {
      // 閉じてるなら開く
      panel.classList.add('show');
      header_title.classList.add('show');
      main_title.classList.add('show');
    }
  });

  // 「+」ボタン: 「メモ or フォルダ」の選択メニューを開閉する
  add_btn.addEventListener('click', function () {
    new_items.forEach(item => item.classList.toggle('show'));
    or_item.classList.toggle('show');
    memo_select.classList.toggle('show');
    if (window.turnOffSelectMode) window.turnOffSelectMode();
  });

  // 「メモ」を選んだら、メモ編集パネルを表示する
  memo_btn.addEventListener('click', function () {
    memo_panel.classList.add('show');
    panel.classList.remove('show');
    closeAddMenu();
  });

  // メモ編集パネルの「＜」で一覧パネルに戻る
  back_btn.addEventListener('click', function () {
    memo_panel.classList.remove('show');
    panel.classList.add('show');
  });

  // フォルダアイコンの色をランダムで選ぶための候補
  const colors = ['color-blue', 'color-red', 'color-green', 'color-yellow'];

  // 「フォルダ」を選んだら、新しいフォルダのアイコンをその場で作る(まだ保存はしていない、見た目だけ)
  folder_btn.addEventListener('click', function () {
    const new_folder = document.createElement('div');
    new_folder.classList.add('folder-icon');
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    new_folder.innerHTML = `
      <span class="material-symbols-outlined ${randomColor}">folder</span>
      <input type="text" class="folder-name-input" value="新規フォルダ">
    `;
    window.icon_container.appendChild(new_folder);
    closeAddMenu();

    // 作った直後は名前を入力できる状態にしておく
    const nameInput = new_folder.querySelector('.folder-name-input');
    nameInput.focus();
    nameInput.select();

    // 入力欄からフォーカスが外れる/Enterで、入力欄を通常の文字表示に戻す
    function finishEditing() {
      const newName = nameInput.value || '新規フォルダ';
      const nameSpan = document.createElement('span');
      nameSpan.classList.add('folder-name');
      nameSpan.textContent = newName;
      if (nameInput.parentNode) new_folder.replaceChild(nameSpan, nameInput);
    }

    nameInput.addEventListener('blur', finishEditing);
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') finishEditing();
    });
  });

  // アイコン置き場全体のクリックを1箇所で監視(イベント委譲)
  window.icon_container.addEventListener('click', function (e) {
    // 選択モード中は、クリックでチェックボックスをON/OFFするだけ
    if (window.isSelecting) {
      const icon = e.target.closest('.folder-icon');
      if (icon && e.target.type !== 'checkbox') {
        const checkbox = icon.querySelector('.select-checkbox');
        if (checkbox) checkbox.checked = !checkbox.checked;
      }
      return;
    }

    // 選択モードじゃない時、名前部分をクリックしたら名前をその場で編集できるようにする
    if (e.target.classList.contains('folder-name')) {
      const nameSpan = e.target;
      const parentIcon = nameSpan.parentElement;
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = nameSpan.textContent;
      nameInput.classList.add('folder-name-input');
      parentIcon.replaceChild(nameInput, nameSpan);
      nameInput.focus();
      nameInput.select();

      function finishEditing() {
        nameSpan.textContent = nameInput.value || nameSpan.textContent;
        if (nameInput.parentNode) parentIcon.replaceChild(nameSpan, nameInput);
      }

      nameInput.addEventListener('blur', finishEditing);
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') finishEditing();
      });
    }
  });
});
