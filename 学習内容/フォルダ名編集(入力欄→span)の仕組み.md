# フォルダ名編集(入力欄→span)の仕組み   7/25

`folder_saving.js`で、新規フォルダの名前を入力してから、実際に画面に表示されるまでの流れをまとめます。

---

## 1. フォルダを作った瞬間、「新規フォルダ」という文字(名前)はもう存在している

```javascript
new_folder.innerHTML = `
  <span class="material-symbols-outlined ${randomColor}">folder</span>
  <input type="text" class="folder-name-input" value="新規フォルダ">
`;
icon_container.appendChild(new_folder);

const nameInput = new_folder.querySelector('.folder-name-input');
nameInput.focus();
nameInput.select();
```

- `<input value="新規フォルダ">`の時点で、「新規フォルダ」という文字(名前)はもう存在している
- `icon_container.appendChild(new_folder)`で、この`<input>`は**既に画面に貼り付けられて、実際に表示されている**
- `nameInput`という変数は、その「既に画面にある本物の入力欄」を指している

ユーザーはこの入力欄に、そのまま名前を打ち込める(または「新規フォルダ」のままにしておける)。

---

## 2. 入力が終わると(`finishEditing`)、何が起きるか

```javascript
nameInput.addEventListener('blur', finishEditing);
nameInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') finishEditing();
});
```

「フォーカスが外れる(blur)」か「Enterキー」のどちらかで、`finishEditing`が呼ばれる。**新しい名前が生まれるわけではなく、既にある名前(入力欄の中身)を確定させる**タイミング。

```javascript
async function finishEditing() {
  const newName = nameInput.value || '新規フォルダ';
  // ...
```

`newName`は、その瞬間に入力欄に入ってる文字列を読み取っただけの変数。これをサーバーに送るために使う。

---

## 3. サーバーに保存する

```javascript
const response = await fetch('/folders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ folder: { name: newName, color: randomColor } }),
});
const savedFolder = await response.json();
```

`newName`をサーバーに送り、保存できたら、サーバーが実際に保存した内容(`savedFolder`)を返してくれる。

```javascript
new_folder.dataset.folderId = savedFolder.id;
```

保存できた実際のID(`savedFolder.id`)を、`new_folder`に目印として付ける(メモの`dataset.memoId`と同じ仕組み)。

---

## 4. 入力欄(`<input>`)を、表示用の`<span>`に差し替える

ここが一番つまずきやすい部分です。

```javascript
const nameSpan = document.createElement('span');
nameSpan.classList.add('folder-name');
nameSpan.textContent = savedFolder.name;
if (nameInput.parentNode) new_folder.replaceChild(nameSpan, nameInput);
```

### なぜ`<input>`のままではダメなのか

`<input>`は、たとえ中身が確定していても、**見た目が入力欄のまま**(枠線がある、クリックするとまた編集できる)です。他の場所(ドキュメント、写真など)の名前は、全部`<span>`という**枠のない、ただの文字**です。見た目を揃えるには、`<input>`から`<span>`に切り替える必要があります。

`<input>`というタグを、そのまま`<span>`というタグに書き換えることはJS/HTML上できないため、**新しく`<span>`を作って、丸ごと入れ替える**しかありません。

### この4行、それぞれの役目

| コード | 役目 |
|---|---|
| `document.createElement('span')` | 新しい`<span>`要素を作る(この時点では、まだ画面のどこにも貼り付けられていない) |
| `.classList.add('folder-name')` | その要素に`folder-name`というクラスを付ける(見た目を他の名前表示と揃えるため) |
| `.textContent = savedFolder.name` | その要素の中身の文字を、保存された名前にする |
| `new_folder.replaceChild(nameSpan, nameInput)` | **ここで初めて**、`nameSpan`を実際に画面(`new_folder`の中)に貼り付け、同時に古い`nameInput`を取り除く |

### `nameInput`と`nameSpan`(貼り付け前)の違い

- `nameInput`: `querySelector`で**既に画面にある実物**を見つけてきた変数。今まさに表示されてて、ユーザーが打ち込んでた本物の入力欄
- `nameSpan`(`replaceChild`前): `createElement`で**今作ったばかりの、まだどこにも貼り付けられていない**要素。中身も見た目も完璧に用意されていても、`replaceChild`されるまでは画面には一切表示されない

`document.createElement(...)`で作った要素は、`appendChild`や`replaceChild`のような「貼り付ける」操作をして初めて、画面に見える形になります。これは`new_folder`自体を作った時(`icon_container.appendChild(new_folder)`)も、`nameSpan`を作った時も同じルールです。

---

## まとめ図

```
① フォルダ作成                  ② 入力終了(blur/Enter)          ③ サーバー保存           ④ 表示切り替え
<input value="新規フォルダ">  →  finishEditing() 実行        →  fetch → savedFolder  →  nameSpan 作成
(画面に実在、編集可能)             (今の入力値を newName へ)        (実際に保存された名前)      ↓
                                                                                  replaceChild で
                                                                                  input と入れ替え
                                                                                  (ここで初めて画面に反映)
```
