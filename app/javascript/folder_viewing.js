import {getRefs} from "window"

document.addEventListener('turbo:load', function () {
    const { icon_container } = getRefs();

    // 今開いているフォルダを覚えておくための変数箱
    let currentFolderId = null;

    // 開いたフォルダのパネル、フォルダ名、閉じるボタン、フォルダ・メモの追加ボタンなど
    const folder_show_panel = document.getElementById('folder_show_panel');
    const folder_name_label = document.querySelector('#folder_show_panel .folder_name_label');
    const close_button = document.querySelector('#folder_show_panel .close_button');

    const folder_add_btn = document.getElementById('folder_add_btn');
    const folder_memo_select = document.getElementById('folder_memo_select');
    const folder_new_items = document.querySelectorAll('#folder_show_panel .new_items');
    const folder_or_item = document.querySelector('#folder_show_panel .or_item');
    const folder_folder_btn = folder_new_items[1];

    const folder_show_content = document.getElementById('folder_show_content');


    //　フォルダアイコンをクリックしたら、そのフォルダの id を取得してパネルを開く
    icon_container.addEventListener('click', async function (e) {
        if (e.target.classList.contains('folder-name')) {
            return;
        }   // フォルダ名をクリックしたら無反応にする。

        const icon = e.target.closest('.folder-icon');
        if (!icon || !icon.dataset.folderId) return;    // フォルダじゃないアイコンをクリックした場合は無反応。

        // クリックしたフォルダの id をここにセット。
        const folderId = icon.dataset.folderId;

        // fetchで folders コントローラーの show アクションから選択したフォルダのデータを取得。
        const response = await fetch(`/folders/${folderId}`); 
        const folder = await response.json();

        currentFolderId = folderId;
        folder_name_label.textContent = folder.name;
        folder_show_panel.classList.add('show');

        folder_show_content.innerHTML = '';
        folder.children.forEach(function (child) {
            const childIcon = document.createElement('div');
            childIcon.classList.add('folder-icon');
            childIcon.dataset.folderId = child.id;
            childIcon.innerHTML = `
                <span class="material-symbols-outlined color-blue">folder</span>
                <span class="folder-name">${child.name}</span>
            `;
            folder_show_content.appendChild(childIcon);
        });
    });

    // 閉じるボタン
    close_button.addEventListener('click', function () {
        folder_show_panel.classList.remove('show');
        folder_memo_select.classList.remove('show');
        folder_new_items.forEach(item => item.classList.remove('show'));
        folder_or_item.classList.remove('show');
    });

    // 開いたフォルダの中にフォルダ・メモを追加するボタン。
    folder_add_btn.addEventListener('click', function () {
        folder_memo_select.classList.toggle('show');
        folder_new_items.forEach(item => item.classList.toggle('show'));
        folder_or_item.classList.toggle('show');
    });



    // ▼▼▼ 新規フォルダ作成の処理。上の「開く」処理とは別物 ▼▼▼

    // 開いたフォルダの中に、新規フォルダの存在枠「new_folder」を作成する。新しく「div」を作り、そこにクラス付与し、HTMLでアイコンと名前欄を付与、置き場所の指定。
    folder_folder_btn.addEventListener('click', function () {
        const new_folder = document.createElement('div');
        new_folder.classList.add('folder-icon');
        new_folder.innerHTML = `
            <span class="material-symbols-outlined color-blue">folder</span>
            <input type="text" class="folder-name-input" value="新規フォルダ">
        `;
        document.getElementById('folder_show_content').appendChild(new_folder);

        // 「nameInput」に名前欄のクラスを取得、名前入力処理
        const nameInput = new_folder.querySelector('.folder-name-input');
        nameInput.focus();
        nameInput.select();

        // 入力したフォルダ名とその id のみを保存。この時点では、先ほどの「new_folder」とは紐づいていない。
        async function finishEditing() {
            const newName = nameInput.value || '新規フォルダ';
            const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

            const response = await fetch('/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                    folder: {
                        name: newName,
                        parent_id: currentFolderId,
                    },
                }),
            });
            // 保存したフォルダ名と id を「savedFolder」に代入。
            const savedFolder = await response.json();

            // 存在枠「new_folder」に id を紐付ける
            new_folder.dataset.folderId = savedFolder.id;

            // 名前欄「nameInput」を実際にフォルダ名の入った「nameSpan」にすり替える。
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('folder-name');
            nameSpan.textContent = savedFolder.name;
            if (nameInput.parentNode) new_folder.replaceChild(nameSpan, nameInput);
        }

        // nameInput での入力が完了したら、名前とidの保存処理が働く。
        nameInput.addEventListener('blur', finishEditing);
        nameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') finishEditing();
        });
    });
});