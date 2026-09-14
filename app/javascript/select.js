// このファイルは「選択モード」(アイコンにチェックボックスを出して、まとめて移動/コピー/削除/共有する機能)を担当
//
// 目次
// ① 必要なDOM要素の取得・共有フラグ/バーの初期化
// ② 「メインパネル + 開いてる全カラム」のアイコンをまとめて取得する共通処理
// ③ 選択モードをオフにする共通処理
// ④ 「選択」ボタンでON/OFFを切り替える処理
// ⑤ 選択モード中、アイコンがクリックされたらチェックボックスをON/OFFする処理
// ⑥ 「削除」ボタンの処理
// ⑦ 「コピー」ボタンの処理


document.addEventListener('turbo:load', function () {
  // ============================================================
  // ◆ ① 必要なDOM要素の取得・共有フラグ/バーの初期化
  // ============================================================
  const select_btn = document.getElementById('select_btn'); // 手のマークの「選択」ボタン

  // action_bar・isSelecting・turnOffSelectMode は、top.js からも参照するので window に載せて共有する
  window.action_bar = document.querySelector('#action_bar'); // 画面下の「移動/コピー/削除/共有」バー
  window.isSelecting = false; // 今、選択モード中かどうかのフラグ

  // ============================================================
  // ◆ ② 「メインパネル + 開いてる全カラム」のアイコンをまとめて取得する共通処理
  // ============================================================
  function getAllIcons() {
    return [
      ...window.icon_container.querySelectorAll('.folder-icon'),
      ...window.folder_columns_container.querySelectorAll('.folder-icon'),
    ];
  }

  // ============================================================
  // ◆ ③ 選択モードをオフにする共通処理
  // ============================================================
  // チェックボックスを全部消して、バーを隠す
  // top.js が「憶」ボタンや「+」ボタンを押した時にこれを呼びに来るので、window に載せておく
  window.turnOffSelectMode = function () {
    window.isSelecting = false;
    getAllIcons().forEach(icon => {
      icon.classList.remove('selecting');
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox) checkbox.remove();
    });
    window.action_bar.classList.remove('show');
  };

  // ============================================================
  // ◆ ④ 「選択」ボタンでON/OFFを切り替える処理
  // ============================================================
  // 「選択」（手のひら）ボタンを押すたびに、選択モードのON/OFFを切り替える
  select_btn.addEventListener('click', function () {
    window.isSelecting = !window.isSelecting;
    window.action_bar.classList.toggle('show');
    const icons = getAllIcons();

    if (window.isSelecting) {
      // ONにした時: 全アイコンにチェックボックスを付ける
      icons.forEach(icon => {
        icon.classList.add('selecting');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('select-checkbox');
        icon.appendChild(checkbox);
      });
    } else {
      // OFFにした時: turnOffSelectMode() で片付ける
      window.turnOffSelectMode();
    }
  });

  // ============================================================
  // ◆ ⑤ 選択モード中、アイコンがクリックされたらチェックボックスをON/OFFする処理
  // ============================================================
  // 本当は icon_container と folder_columns_container、それぞれに直接付けたいところだが、それはできない。
  // application.js の import 順で、select.js は folder_columns.js より先に実行されるため、
  // このファイル(select.js)が動く時点では、folder_columns_container はまだ window に置かれていない。
  // なので、常に存在している document に1つだけ付けて代用する。
  document.addEventListener('click', function (e) {
    if (!window.isSelecting) return;
    const icon = e.target.closest('.folder-icon');
    if (icon && e.target.type !== 'checkbox') {
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox) checkbox.checked = !checkbox.checked;
    }
  });

  // ============================================================
  // ◆ ⑥ 「削除」ボタンの処理
  // ============================================================
  // チェックが付いてるアイコンを、サーバー側も含めて削除する
  const delete_btn = document.getElementById('delete_btn');
  delete_btn.addEventListener('click', async function () {
    const icons = getAllIcons();
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    for (const icon of icons) {
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox && checkbox.checked) {
        const url = icon.dataset.folderId ? `/folders/${icon.dataset.folderId}` : `/memos/${icon.dataset.memoId}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        });
        if (response.ok) icon.remove();
      }
    }
    window.turnOffSelectMode();
  });

  // ============================================================
  // ◆ ⑦ 「コピー」ボタンの処理
  // ============================================================
  // チェックが付いてるアイコンを、サーバー側で複製する(/folders/:id/duplicate・/memos/:id/duplicate)
  const copy_btn = document.getElementById('copy_btn');
  copy_btn.addEventListener('click', async function () {
    const checkedIcons = getAllIcons().filter(icon => {
      const checkbox = icon.querySelector('.select-checkbox');
      return checkbox && checkbox.checked;
    });

    // ▲▲▲ 親フォルダと、その中の子フォルダを同時に選択してると二重コピーになるので、実行前に弾く
    const hasParentChildConflict = checkedIcons.some(icon => {
      if (!icon.dataset.folderId) return false; // フォルダだけが「中身」を持ちうる
      return checkedIcons.some(other => {
        if (other === icon) return false;
        const otherColumn = other.closest('.folder_column');
        return otherColumn && otherColumn.dataset.folderId === icon.dataset.folderId;
      });
    });

    if (hasParentChildConflict) {
      alert('二重コピー選択をしています。');
      checkedIcons.forEach(icon => {
        const checkbox = icon.querySelector('.select-checkbox');
        if (checkbox) checkbox.checked = false;
      });
      return; // 選択モードは維持したまま、選び直させる
    }

    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    for (const icon of checkedIcons) {
      const isFolder = !!icon.dataset.folderId;
      const url = isFolder
        ? `/folders/${icon.dataset.folderId}/duplicate`
        : `/memos/${icon.dataset.memoId}/duplicate`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      });
      const saved = await response.json();

      // 複製したアイコンを組み立てる(既存の新規作成時のアイコンと同じ形)
      const clone = document.createElement('div');
      clone.classList.add('folder-icon');
      if (isFolder) {
        clone.dataset.folderId = saved.id;
        clone.innerHTML = `
          <span class="material-symbols-outlined ${saved.color}">folder</span>
          <span class="folder-name">${saved.name}</span>
        `;
      } else {
        clone.dataset.memoId = saved.id;
        clone.innerHTML = `
          <span class="material-symbols-outlined color-blue">description</span>
          <span class="folder-name">${saved.title}</span>
        `;
      }

      // ▲▲▲ 判定はせず、複製元と同じ場所(icon.parentElement)にそのまま追加する
      icon.parentElement.appendChild(clone);
    }

    window.turnOffSelectMode();
  });
});
