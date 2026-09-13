# 3点解説: `.value` / `.textContent` / バッククォートURL / `isEditing`の使い分け

`show_panel.js`の編集機能を作る中で出てきた3つの疑問を、まとめて解説します。

---

## 1. `.value`と`.textContent`の違い

### どの要素に使えるか

| プロパティ | 使える要素 | 使えない要素 |
|---|---|---|
| `.value` | `<input>`、`<textarea>`、`<select>`(フォーム部品) | `<div>`、`<span>`、`<p>`など |
| `.textContent` | ほぼすべてのHTML要素(`<div>`も含む) | (基本的に無い) |

### 具体例

```html
<input id="title" value="こんにちは">
<div class="show_title">こんにちは</div>
```

```javascript
document.getElementById('title').value          // → "こんにちは"
document.querySelector('.show_title').value     // → undefined(divには.valueが無い)
document.querySelector('.show_title').textContent // → "こんにちは"
```

### なぜ今回`.textContent`が必要だったか

`show_panel.js`の`show_title`・`show_body`は`<div>`です(`<input>`や`<textarea>`ではありません)。`<div>`には`.value`というプロパティ自体が存在しないので、`.value`を読むと`undefined`が返ってきます。編集した内容(`contentEditable`で書き換えた文字)を取り出すには、`.textContent`を使う必要があります。

```javascript
// NG: divには .value が無いので undefined になる
title: show_title.value,

// OK: divの中の文字は .textContent で取り出す
title: show_title.textContent,
```

---

## 2. バッククォートでのURL生成(テンプレートリテラル)

### 普通のクォートでは`${}`が使えない

```javascript
'/memos/${currentMemoId}'   // → 文字列 "/memos/${currentMemoId}" そのまま(currentMemoIdの中身は埋め込まれない)
"/memos/${currentMemoId}"   // → 同上
```

`'...'`や`"..."`で囲むと、`${}`は特別な意味を持たず、ただの記号として扱われます。

### バッククォート(`` ` ``)で囲むと`${}`が使える

```javascript
`/memos/${currentMemoId}`   // → currentMemoId が 3 なら "/memos/3" になる
```

バッククォートで囲んだ文字列だけが「テンプレートリテラル」と呼ばれる特別な書き方になり、`${式}`の部分がJSの式として評価され、その結果に置き換わります。

### 使い分けの表

| 書き方 | `${}`が使えるか |
|---|---|
| `'...'` | 使えない(ただの文字になる) |
| `"..."` | 使えない(ただの文字になる) |
| `` `...` `` | 使える(中身が変数の値に置き換わる) |

`show_panel.js`では`fetch(`/memos/${currentMemoId}`, ...)`のように、変数の値をURLの中に埋め込みたいので、バッククォートを使っています。

---

## 3. `isEditing`を使った「編集モード」と「保存」の使い分け

### `isEditing`が表すもの

`isEditing`は、`true`/`false`のどちらかが入ってる変数で、「**今、編集モード中かどうか**」を表しています。

```javascript
let isEditing = false; // 最初は編集中じゃない
```

### `edit_button`は1つしかないのに、動作を2通りに分ける仕組み

```javascript
edit_button.addEventListener('click', function() {
  if (!isEditing) {
    // ① 編集モードに入る処理
  } else {
    // ② 保存する処理
  }
});
```

`if (!isEditing)`は「`isEditing`が`false`なら」という意味です。つまり「まだ編集中じゃなければ、①(編集モードに入る)」「もう編集中なら、②(保存する)」という分岐です。

### クリックを2回繰り返した時の流れ

```
【1回目のクリック】
  isEditing は false
       │
       ▼
  if (!isEditing) → true(条件成立) → ①の処理を実行
       │
       ├─ isEditing = true に書き換える  ← ここが重要
       ├─ show_title / show_body を編集可能にする
       └─ ボタンの文字を「保存する」に変える

【2回目のクリック(ボタンは「保存する」になってる)】
  isEditing は true (1回目で書き換え済み)
       │
       ▼
  if (!isEditing) → false(条件不成立) → else側、②の処理を実行
       │
       ├─ fetch で編集後の内容をRailsに送る(PATCH)
       └─ 保存が成功したら:
            ├─ isEditing = false に戻す  ← 次にまた①から始められるようにリセット
            ├─ 編集をできなくする(contentEditable = false)
            └─ ボタンの文字を「編集」に戻す
```

### ポイント

- `isEditing`という1つの変数の中身(`true`/`false`)を見るだけで、同じボタンの同じクリックイベントが、**毎回違う処理**をするようになる
- ①の処理の中で`isEditing = true`に書き換えるのを忘れると、2回目にクリックしても`if (!isEditing)`が再び成立してしまい、いつまでも①(編集モードに入る)しか実行されず、保存に辿り着けない
- ②の処理の最後で`isEditing = false`に戻すのも同様に重要で、これを忘れると保存後も「編集中」のままになり、次に開いたメモがいきなり編集モードになってしまう
