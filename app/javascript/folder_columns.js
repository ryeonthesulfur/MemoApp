import {getRefs} from "window"

document.addEventListener('turbo:load', function () {
    const { icon_container } = getRefs();
    const folder_columns_container = document.getElementById('folder_columns_container');

    icon_container.addEventListener('click', function (e) {
        if (e.target.classList.contains('folder-name')) {
            return;
        }   // フォルダ名をクリックしたら無反応にする。

        // クリックしたアイコンから一番近いクラスを代入。
        const icon = e.target.closest('.folder-icon');
        if (!icon || !icon.dataset.folderId) return;    // フォルダじゃないアイコンをクリックした場合は無反応。

        // クリックされた要素に id を仮引数として持たせる。これを下の実処理の関数に渡す。
        createFolderColumn(icon.dataset.folderId, null);

        // クリックされたフォルダの id を受け取り、その中身のためのパネルを生成する。
        async function createFolderColumn(folderId, afterColumn) {

            if (afterColumn === null) {
                // メインパネルから呼ばれた場合の処理
                folder_columns_container.innerHTML = '';
            } else {
                // フォルダパネルから呼ばれた場合の処理
                // 「afterColumnの次にまだ要素がある限り、それを削除し続ける」という繰り返し処理
              while(afterColumn.nextElementSibling) {
                afterColumn.nextElementSibling.remove();
              }
            }

            const response = await fetch(`/folders/${folderId}`);
            const folder = await response.json();



            // 選択したフォルダの中身を表すためのパネルを「column」とする。
            const column = document.createElement('div');
            column.classList.add('folder_column');
            column.dataset.folderId = folderId;
            column.innerHTML = `
                <div class="show_panel">
                    <div class="folder_buttons_header">
                        <div class="close_button">閉じる</div>
                        <div class="folder_name_label">${folder.name || '名称未設定フォルダ'}</div>
                        <div class="add_menu_wrapper">
                            <button class="folder_add_btn">+</button>
                            <ul class="memo_select">
                                <li class="new_items">メモ</li>
                                <li class="or_item">or</li>
                                <li class="new_items">フォルダ</li>
                            </ul>
                        </div>
                    </div>
                    <div class="folder_show_content"></div>
                </div>
            `;
            folder_columns_container.appendChild(column);


            // 「folder_show_content」の中に子フォルダが入るようにする。
            const folderShowContent = column.querySelector('.folder_show_content');
            
            folder.children.forEach(function (child) {
                const childIcon = document.createElement('div');
                childIcon.classList.add('folder-icon');
                childIcon.dataset.folderId = child.id;
                childIcon.innerHTML = `
                    <span class="material-symbols-outlined ${child.color}">folder</span>
                    <span class="folder-name">${child.name || '名称未設定フォルダ'}</span>
                `;
                folderShowContent.appendChild(childIcon);
            });

            // 無限入れ子構造のための記述
            folderShowContent.addEventListener('click', function (e) {
                // もしアイコンの下のタイトルをクリックしたら、無反応。
                if (e.target.classList.contains('folder-name')) return;

                // 「childIcon」を再取得。
                const childIcon = e.target.closest('.folder-icon');

                // もし、クリックされたものがchildIconじゃない場合、もしくは選択したchildiconとは別の id のものだった場合、無反応。
                if (!childIcon || !childIcon.dataset.folderId) return;

                // パネル生成のための関数にクリックした子フォルダの id を仮引数として渡す。
                createFolderColumn(childIcon.dataset.folderId, column);
            });


            // メモ・フォルダ追加ボタン、閉じるボタンのための要素取得
            const closeButton = column.querySelector('.close_button');
            const addBtn = column.querySelector('.folder_add_btn');
            const memoSelect = column.querySelector('.memo_select');
            const newItems = column.querySelectorAll('.new_items');
            const orItem = column.querySelector('.or_item');

            // 閉じるボタン
            closeButton.addEventListener('click', function () {
                while (column.nextElementSibling) {
                    column.nextElementSibling.remove();
                }
                column.remove();
            });

            // 追加ボタン
            addBtn.addEventListener('click', function () {
                newItems.forEach(item => item.classList.toggle('show'));
                orItem.classList.toggle('show');
                memoSelect.classList.toggle('show');
            });



            // 選択して開いたフォルダパネルの中に新規フォルダを作成する機能。
            const folderBtn = newItems[1];
            folderBtn.addEventListener('click', function () {
                const new_folder = document.createElement('div');
                new_folder.classList.add('folder-icon');
                new_folder.innerHTML = `
                    <span class="material-symbols-outlined color-blue">folder</span>
                    <input type="text" class="folder-name-input" value="新規フォルダ">
                `;
                folderShowContent.appendChild(new_folder);

                // 作った直後は名前を入力できる状態にしておく
                const nameInput = new_folder.querySelector('.folder-name-input');
                nameInput.focus();
                nameInput.select();

                // 入力欄からフォーカスが外れる/Enterで、入力欄を通常の文字表示に戻す
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
                                parent_id: folderId,
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
        }
    });
});