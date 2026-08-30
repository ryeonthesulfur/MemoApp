# 保存が成功した後の処理、徹底解説  2026.07/20 ③

対象のコードはこの部分です。

```javascript
      .then(response => response.json())
      .then(savedMemo => {
        memo_panel.classList.remove('show');
        panel.classList.add('show');

        const new_memo = document.createElement('div');
        new_memo.classList.add('folder-icon');
        new_memo.innerHTML = `
          <span class="material-symbols-outlined color-blue">description</span>
          <span class="folder-name">${savedMemo.title || '無題'}</span>
        `;
        window.icon_container.appendChild(new_memo);

        title_input.value = '';
        body_input.value = '';
      });
```

この中に出てくる`.then`・`response => response.json()`・`savedMemo`という3つの用語が分からない、とのことなので、1つずつ確実に潰していきます。

---

## 1. そもそも `fetch` は「結果」を返さない

`fetch('/memos', {...})`を実行しても、その場でRailsからの返事がもらえるわけではありません。ネットワーク通信には時間がかかるからです(数十ミリ秒〜)。

なので`fetch(...)`は、実行した瞬間に**「Promise」という引換券**を返します。Promiseは「結果そのもの」ではなく、「後で結果が来たら、この引換券を使って受け取れます」という予約票のようなものです。

```
fetch('/memos', {...})
        │
        ▼
   ここではまだ「答え」は無い。
   Promise(引換券)だけが返ってくる。
        │
        │  ↓ この間に、ネットワーク越しにRailsが処理している
        │    (routes.rb → MemosController#create → Memoモデル → DB保存 → JSONで返す)
        ▼
   サーバーからの返事(HTTPレスポンス)が到着
```

## 2. `.then(...)` は「引換券の答えが来たらこれをやって」の予約

```javascript
somePromise.then(結果が来たら実行する関数)
```

`.then`は、「Promise(引換券)の答えが届いたら、カッコの中の関数を実行してください」という予約です。`addEventListener`が「クリックされたら実行して」だったのと同じ考え方で、`.then`は「Promiseの答えが届いたら実行して」です。

**なぜ`.then`が2回続けて書いてあるのか**

```javascript
.then(response => response.json())
.then(savedMemo => { ... })
```

実は`.then`は、実行すると**また新しいPromise(新しい引換券)を返します**。なので`.then`の後にまた`.then`をつなげて、「その次の答えが来たらこれをやって」と重ねて書くことができます。これを**チェーン(鎖のようにつなげる)**と呼びます。

```
fetch(...)                         → Promise①(HTTPレスポンスが来る)
  .then(response => response.json())  → Promise②(JSONの中身が来る)
    .then(savedMemo => {...})          → ここで実際にDOMを操作する
```

---

## 3. `response => response.json()` の意味

### 3-1. これは「アロー関数」という書き方

```javascript
response => response.json()
```

これは関数の省略した書き方(アロー関数)です。長く書くとこうなります。

```javascript
function (response) {
  return response.json();
}
```

- `response`: この関数が受け取る引数(パラメーター)の名前。名前は自由に付けられますが、「HTTPレスポンスが入ってるから`response`にしよう」という慣習的な名前です
- `response.json()`: その関数が**返す値**

### 3-2. `response`の中身は何か

これは**HTTPレスポンス全体**を表すオブジェクトです。ステータスコード(`201`とか`404`とか)や、ヘッダー、そして本文(body)など、返事に関する情報がまるごと入っています。まだ**JSONの中身そのものではありません**。

### 3-3. `.json()`は何をしているか

`response.json()`は、そのレスポンスの本文(JSON形式の文字列)を読み取って、**JSの普通のオブジェクトに変換する**メソッドです。

ここで注意点があります。この「本文を読み取って変換する」処理も、実は一瞬では終わらない(実行に時間がかかる)ので、**`.json()`自体もPromiseを返します**。だから`response.json()`をそのまま次の行で使うことができず、もう1つ`.then`を重ねる必要がある、というわけです。

```
response (HTTPレスポンス全体、ステータスコードなど込み)
   │
   │ .json() を呼ぶ
   ▼
Promise(本文をJSオブジェクトに変換中...)
   │
   │ 変換が終わると次の .then に渡される
   ▼
savedMemo (変換済みのJSオブジェクト)
```

---

## 4. `savedMemo` の意味

```javascript
.then(savedMemo => {
```

`savedMemo`は、**このプログラムを書いた人(今回は私)が自分で決めた変数名**です。特別な予約語ではありません。

中身は、1つ前の`.then`で`response.json()`が変換し終えた**JSのオブジェクト**です。`MemosController#create`が

```ruby
render json: memo, status: :created
```

で返したデータが、そのままJSのオブジェクトになったものです。つまり中身はだいたいこんな形になっています。

```javascript
savedMemo = {
  id: 1,
  title: "あいうえお",
  content: "あいうえお",
  folder_id: null,
  color: null,
  created_at: "...",
  updated_at: "..."
}
```

だから`savedMemo.title`と書くと、保存されたメモのタイトルが取り出せるわけです。

---

## 5. 全体の流れ図

```
[ブラウザ]                                    [Rails]
   │
   │ fetch('/memos', {method:'POST', body: JSON文字列})
   ├──────────────────────────────────────────▶
   │                                              routes.rb で POST /memos を
   │                                              MemosController#create に振り分け
   │                                                    │
   │                                              Memo.new(...).save
   │                                              → DBにINSERT
   │                                                    │
   │                                              render json: memo, status: :created
   │◀──────────────────────────────────────────────────┘
   │  (この時点で response というPromiseの答えが届く)
   │
   ▼
.then(response => response.json())
   │  response.json() が本文(JSON文字列)を
   │  JSオブジェクトへ変換するのを待つ
   ▼
.then(savedMemo => {
   │  savedMemo.title を使ってアイコンを組み立てる
   │  ├─ memo_panel を隠して panel を表示
   │  ├─ 新しい <div class="folder-icon"> を作って
   │  │   icon_container に追加(appendChild)
   │  └─ title_input / body_input を空文字に戻す
   ▼
});
```

---

## 6. `.then(savedMemo => {...})` の中身、1行ずつ

```javascript
memo_panel.classList.remove('show');
panel.classList.add('show');
```
→ メモ編集パネルを隠して(`show`クラスを外す)、一覧パネルを表示する(`show`クラスを付ける)。

```javascript
const new_memo = document.createElement('div');
new_memo.classList.add('folder-icon');
```
→ 空の`<div>`要素をメモリ上に作り、`folder-icon`というクラス名を付ける。この時点ではまだ画面には出ていない。

```javascript
new_memo.innerHTML = `
  <span class="material-symbols-outlined color-blue">description</span>
  <span class="folder-name">${savedMemo.title || '無題'}</span>
`;
```
→ その`<div>`の中身を組み立てる。`${savedMemo.title || '無題'}`は「`savedMemo.title`が空文字や`null`でなければそれを使う、そうでなければ'無題'を使う」という意味。

```javascript
window.icon_container.appendChild(new_memo);
```
→ ここで初めて、作った`<div>`が実際の画面(`icon_container`の中)に追加され、目に見えるようになる。

```javascript
title_input.value = '';
body_input.value = '';
```
→ 入力欄(タイトル・本文)を空文字に戻し、次にまたメモを書けるようにする。

---

## まとめ

| 用語 | 意味 |
|---|---|
| Promise | 「結果はまだ無いけど、後で届く」という引換券 |
| `.then(...)` | 「その引換券の答えが届いたら、これを実行して」という予約 |
| `response` | 届いたHTTPレスポンス全体(ステータスコードなど込み) |
| `response.json()` | レスポンスの本文(JSON文字列)をJSのオブジェクトに変換する処理(これもPromiseを返す) |
| `savedMemo` | 変換が終わった後のJSオブジェクト。自分で付けた変数名(予約語ではない) |
