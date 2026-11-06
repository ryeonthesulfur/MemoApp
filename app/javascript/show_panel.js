// このファイルは、メモの画面(新規作成・閲覧・編集をこの1枚で行う)の、開く・編集・保存・閉じる、を担当
// 既存メモの保存(PATCH /memos/:id)はここで行い、新規メモの保存(POST /memos)は memo_saving.js の window.createMemo に任せる
// window.js の getRefs() を読み込む
//
// 目次
// ① 閲覧の状態と編集の状態を切り替える共通処理
// ② 既存のメモを開く処理(window.openMemoDetailとしてwindowに公開し、folder_columns.jsからも呼べるようにする)
// ③ 新規作成でメモの画面を開く処理(window.openNewMemoとしてwindowに公開し、top.js・folder_columns.jsから呼ぶ)
// ④ メインパネルでメモのアイコンがクリックされた時の入口
// ⑤ 「編集」ボタンの処理
// ⑥ 「保存」ボタンの処理(新規作成か既存のメモかで、保存の送り先を分ける)
// ⑦ 「閉じる」ボタンの処理
import { getRefs } from "window"

document.addEventListener('turbo:load', function () {
  if (!document.getElementById('main_panel')) return; // 「憶」のパネルが無いページ(「音」など)では、「憶」用の設定をしない(部品が見つからずエラーになるため)
  const { icon_container, show_panel, save_btn, title_input, body_input } = getRefs();

  let currentMemoId = null; // 今開いているメモのid。新規作成の時は null

  // ボタンや表示欄は、フォルダのカラムにも同じクラス名(.close_button など)があるので、メモの画面の中から探す
  const close_button = show_panel.querySelector('.close_button');
  const edit_button = show_panel.querySelector('.edit_button');
  const date_label = show_panel.querySelector('.date');
  const show_title = show_panel.querySelector('.show_title');
  const show_body = show_panel.querySelector('.show_content .body');

  // 日付を「2026年11月7日」の形の文字にする
  function formatDate(date) {
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  }


  // ============================================================
  // ◆ ① 閲覧の状態と編集の状態を切り替える共通処理
  // ============================================================
  // editing クラスが付いている間は、CSS(show_panel.css)で表示用の文字を隠し、入力欄と「保存」ボタンを見せる
  function startEditing() {
    title_input.value = show_title.dataset.raw ?? ''; // 表示用の文字ではなく、保存されている元のタイトルを入れる(「無題」を入れないため)
    body_input.value = show_body.textContent;
    show_panel.classList.add('editing');
    title_input.focus();
  }

  function stopEditing() {
    show_panel.classList.remove('editing');
  }

  // 閲覧の状態で見える文字を、メモの内容で埋める
  function fillView(memo) {
    show_title.dataset.raw = memo.title || ''; // 編集を始めた時に入力欄へ戻すため、元のタイトルを覚えておく
    show_title.textContent = memo.title || '無題';
    show_body.textContent = memo.content || '';
  }


  // ============================================================
  // ◆ ② 既存のメモを開く処理
  // ============================================================
  window.openMemoDetail = function (memoId) {
    // クリックされたメモの中身をRailsに取りに行く
    fetch(`/memos/${memoId}`)
      .then(response => response.json())
      .then(memo => {
        currentMemoId = memoId;
        date_label.textContent = formatDate(new Date(memo.created_at));
        fillView(memo);
        stopEditing(); // 既存のメモは、閲覧の状態で開く
        show_panel.classList.add('show');
      });
  };


  // ============================================================
  // ◆ ③ 新規作成でメモの画面を開く処理
  // ============================================================
  // folderId は、どのフォルダの中に作るか(null ならメインパネル直下)。保存する時に memo_saving.js が読みに来る
  window.openNewMemo = function (folderId) {
    currentMemoId = null;
    window.currentColumnFolderId = folderId;
    date_label.textContent = formatDate(new Date()); // まだ保存していないので、今日の日付を出す
    fillView({ title: '', content: '' });
    show_panel.classList.add('show'); // 先に見える状態にする(見えない状態の入力欄には、カーソルを置けないため)
    startEditing(); // 新規作成は、最初から編集の状態(空の入力欄)で開く
  };


  // ============================================================
  // ◆ ④ メインパネルでメモのアイコンがクリックされた時の入口
  // ============================================================
  // 中身を開いて閲覧するためにアイコンがクリックされたら、名前クリックかアイコンクリックかを判定して中身を開く関数を呼び出す処理（選択したメモ限定で、中身を開く関数のみを反応させるため。）
  icon_container.addEventListener('click', function (e) {
    if (window.isSelecting) return; // 選択モード中は、名前クリックの処理は select.js が担当するので、ここでは何もしない
    if (e.target.classList.contains('folder-name')) {
      return; // 名前がクリックされた時は、top.js のインライン編集に任せて何もしない
    }

    const icon = e.target.closest('.folder-icon');
    if (!icon || !icon.dataset.memoId) return; // フォルダなど、メモじゃないものは無視する

    window.openMemoDetail(icon.dataset.memoId);
  });


  // ============================================================
  // ◆ ⑤ 「編集」ボタンの処理
  // ============================================================
  edit_button.addEventListener('click', startEditing);


  // ============================================================
  // ◆ ⑥ 「保存」ボタンの処理
  // ============================================================
  save_btn.addEventListener('click', function () {
    // 新規作成の時は、memo_saving.js に保存してもらい、終わったら画面を閉じる(前の新規作成の画面と同じ動き)
    if (currentMemoId === null) {
      window.createMemo(title_input.value, body_input.value).then(function () {
        show_panel.classList.remove('show');
      });
      return;
    }

    // 既存のメモの時は、ここで更新(PATCH)して、閲覧の状態に戻す
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    fetch(`/memos/${currentMemoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        memo: {
          title: title_input.value,
          content: body_input.value,
        },
      }),
    })
      .then(response => response.json())
      .then(updatedMemo => {
        fillView(updatedMemo);
        stopEditing();
        // メインパネルやカラムに並んでいる、このメモのアイコンの名前も新しいタイトルにそろえる
        document.querySelectorAll(`.folder-icon[data-memo-id="${updatedMemo.id}"] .folder-name`).forEach(function (name) {
          name.textContent = updatedMemo.title || '無題';
        });
      });
  });


  // ============================================================
  // ◆ ⑦ 「閉じる」ボタンの処理
  // ============================================================
  // 保存していない編集内容は捨てて閉じる(次に開いた時は、保存されている内容から始まる)
  close_button.addEventListener('click', function () {
    show_panel.classList.remove('show');
  });
});
