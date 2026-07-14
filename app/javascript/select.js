// このファイルは「選択モード」(アイコンにチェックボックスを出して、まとめて移動/コピー/削除/共有する機能)を担当
document.addEventListener('turbo:load', function () {
  const select_btn = document.getElementById('select_btn'); // 手のマークの「選択」ボタン

  // action_bar・isSelecting・turnOffSelectMode は、top.js からも参照するので window に載せて共有する
  window.action_bar = document.querySelector('#action_bar'); // 画面下の「移動/コピー/削除/共有」バー
  window.isSelecting = false; // 今、選択モード中かどうかのフラグ

  // 選択モードをオフにする共通処理(チェックボックスを全部消して、バーを隠す)
  window.turnOffSelectMode = function () {
    window.isSelecting = false;
    window.icon_container.querySelectorAll('.folder-icon').forEach(icon => {
      icon.classList.remove('selecting');
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox) checkbox.remove();
    });
    window.action_bar.classList.remove('show');
  };

  // 「選択」ボタンを押すたびに、選択モードのON/OFFを切り替える
  select_btn.addEventListener('click', function () {
    window.isSelecting = !window.isSelecting;
    window.action_bar.classList.toggle('show');
    const icons = window.icon_container.querySelectorAll('.folder-icon');

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

  // 「削除」ボタン: チェックが付いてるアイコンだけ画面から消す
  const delete_btn = document.getElementById('delete_btn');
  delete_btn.addEventListener('click', function () {
    const icons = window.icon_container.querySelectorAll('.folder-icon');
    icons.forEach(icon => {
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox && checkbox.checked) icon.remove();
    });
    window.turnOffSelectMode();
  });

  // 「コピー」ボタン: チェックが付いてるアイコンを複製する
  const copy_btn = document.getElementById('copy_btn');
  copy_btn.addEventListener('click', function () {
    const icons = window.icon_container.querySelectorAll('.folder-icon');
    icons.forEach(icon => {
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox && checkbox.checked) {
        // アイコンをまるごと複製(チェックボックスや選択中の見た目は複製先には残さない)
        const clone = icon.cloneNode(true);
        const cloneCheckbox = clone.querySelector('.select-checkbox');
        if (cloneCheckbox) cloneCheckbox.remove();
        clone.classList.remove('selecting');

        // 名前の末尾に _copy(1), _copy(2)... と番号を付ける
        const nameSpan = clone.querySelector('.folder-name');
        const baseName = nameSpan.textContent.replace(/_copy\(\d+\)$/, '');
        const existing = window.icon_container.querySelectorAll('.folder-name');
        let copyCount = 0;
        existing.forEach(span => {
          if (span.textContent.startsWith(baseName + '_copy(')) copyCount++;
        });
        nameSpan.textContent = `${baseName}_copy(${copyCount + 1})`;
        window.icon_container.appendChild(clone);
      }
    });
    window.turnOffSelectMode();
  });
});
