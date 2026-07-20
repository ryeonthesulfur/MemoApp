export function getRefs() {
  return {
    panel: document.getElementById('main_panel'),
    memo_panel: document.getElementById('memo_panel'),
    save_btn: document.getElementById('save_btn'),
    title_input: document.getElementById('title'),
    body_input: document.getElementById('body'),
    icon_container: document.querySelector('.icon-container'),
    memo: document.querySelectorAll('.item-boxes')[0],
    header_title: document.getElementById('header_title'),
    memo_select: document.getElementById('memo_select'),
    add_btn: document.getElementById('add_btn'),
    new_items: document.querySelectorAll('.new_items'),
    or_item: document.querySelector('.or_item'),
    back_btn: document.querySelector('.back_btn'),
    main_title: document.querySelector('.main_title'),
    show_panel: document.getElementById('main_show_panel')
  };
}
