import {getRefs} from "window"

document.addEventListener('turbo:load', function () {
    const { icon_container } = getRefs();

    let currentFolderId = null;

    const folder_show_panel = document.getElementById('folder_show_panel');
    const folder_name_label = document.querySelector('#folder_show_panel .folder_name_label');
    const close_button = document.querySelector('#folder_show_panel .close_button');

    const folder_add_btn = document.getElementById('folder_add_btn');
    const folder_memo_select = document.getElementById('folder_memo_select');
    const folder_new_items = document.querySelectorAll('#folder_show_panel .new_items');
    const folder_or_item = document.querySelector('#folder_show_panel .or_item');


    icon_container.addEventListener('click', async function (e) {
        if (e.target.classList.contains('folder-name')) {
            return;
        }

        const icon = e.target.closest('.folder-icon');
        if (!icon || !icon.dataset.folderId) return;

        const folderId = icon.dataset.folderId;

        const response = await fetch(`/folders/${folderId}`); 
        const folder = await response.json();

        currentFolderId = folderId;
        folder_name_label.textContent = folder.name;
        folder_show_panel.classList.add('show');
    });

    close_button.addEventListener('click', function () {
        folder_show_panel.classList.remove('show');
        folder_memo_select.classList.remove('show');
        folder_new_items.forEach(item => item.classList.remove('show'));
        folder_or_item.classList.remove('show');
    });

    folder_add_btn.addEventListener('click', function () {
        folder_memo_select.classList.toggle('show');
        folder_new_items.forEach(item => item.classList.toggle('show'));
        folder_or_item.classList.toggle('show');
    });

});