// このファイルは、メインパネルでの新規フォルダの作成(POST /folders)を担当
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {
  const { icon_container, new_items } = getRefs();
  const folder_btn = new_items[1];


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

    // 作った直後は名前を入力できる状態にしておく
    const nameInput = new_folder.querySelector('.folder-name-input');
    nameInput.focus();
    nameInput.select();

    // 入力欄からフォーカスが外れる/Enterで、入力欄を通常の文字表示に戻す
   async function finishEditing() {
      const newName = nameInput.value || '新規フォルダ';
      const csrfToken = document.querySelector('meta[name="csrf-token"]').content

      const response = await fetch('/folders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
            folder: {
                name: newName,
                color: randomColor,
            },
         }),
      });
      const savedFolder = await response.json();

      new_folder.dataset.folderId = savedFolder.id;

      const nameSpan = document.createElement('span');
      nameSpan.classList.add('folder-name');
      nameSpan.textContent = savedFolder.name;
            if (nameInput.parentNode) new_folder.replaceChild(nameSpan, nameInput);
    }

    nameInput.addEventListener('blur', finishEditing);
    nameInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') finishEditing();
    });
  });
});





       