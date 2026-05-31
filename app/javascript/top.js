document.addEventListener('turbo:load', function () {
  const memo = document.querySelectorAll('.item-boxes')[0];
  const panel = document.getElementById('main_panel');
  const header_title = document.getElementById('header_title');
  const memo_select = document.getElementById('memo_select');
  const add_btn = document.getElementById('add_btn');
  const new_items = document.querySelectorAll('.new_items');
  const or_item = document.querySelector('.or_item');
  const memo_btn = new_items[0];
  const memo_panel = document.getElementById('memo_panel');
  const back_btn = document.querySelector('.back_btn');
  const folder_btn = new_items[1];
  const main_title = document.querySelector('.main_title');

  window.icon_container = document.querySelector('.icon-container');

  function closeAddMenu() {
    new_items.forEach(item => item.classList.remove('show'));
    or_item.classList.remove('show');
    memo_select.classList.remove('show');
  }

  memo.addEventListener('click', function () {
    if (panel.classList.contains('show') || memo_panel.classList.contains('show')) {
      panel.classList.remove('show');
      memo_panel.classList.remove('show');
      header_title.classList.remove('show');
      main_title.classList.remove('show');
      closeAddMenu();
      window.action_bar.classList.remove('show');
      if (window.isSelecting) window.turnOffSelectMode();
    } else {
      panel.classList.add('show');
      header_title.classList.add('show');
        main_title.classList.add('show');
    }
  });

  add_btn.addEventListener('click', function () {
    new_items.forEach(item => item.classList.toggle('show'));
    or_item.classList.toggle('show');
    memo_select.classList.toggle('show');
    if (window.turnOffSelectMode) window.turnOffSelectMode();
  });

  memo_btn.addEventListener('click', function () {
    memo_panel.classList.add('show');
    panel.classList.remove('show');
    closeAddMenu();
  });

  back_btn.addEventListener('click', function () {
    memo_panel.classList.remove('show');
    panel.classList.add('show');
  });

  const colors = ['color-blue', 'color-red', 'color-green', 'color-yellow'];

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

    const nameInput = new_folder.querySelector('.folder-name-input');
    nameInput.focus();
    nameInput.select();

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

  const save_btn = document.getElementById('save_btn');
  const title_input = document.getElementById('title');

  save_btn.addEventListener('click', function () {
    const title = title_input.value || '無題';
    memo_panel.classList.remove('show');
    panel.classList.add('show');

    const new_memo = document.createElement('div');
    new_memo.classList.add('folder-icon');
    new_memo.innerHTML = `
      <span class="material-symbols-outlined color-blue">description</span>
      <span class="folder-name">${title}</span>
    `;
    window.icon_container.appendChild(new_memo);

    title_input.value = '';
    document.getElementById('body').value = '';
  });

  window.icon_container.addEventListener('click', function (e) {
    if (window.isSelecting) {
      const icon = e.target.closest('.folder-icon');
      if (icon && e.target.type !== 'checkbox') {
        const checkbox = icon.querySelector('.select-checkbox');
        if (checkbox) checkbox.checked = !checkbox.checked;
      }
      return;
    }

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