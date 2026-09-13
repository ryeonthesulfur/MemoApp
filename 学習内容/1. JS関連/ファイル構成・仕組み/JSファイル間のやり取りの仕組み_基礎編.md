# JSファイル間のやり取りの仕組み、基礎編  260909

実際のアプリのコードは一旦忘れて、一番小さい例からステップごとに積み上げて理解した内容のまとめ。関連ドキュメント: [JSファイル間での変数.md](./JSファイル間での変数.md)、[JSファイル構成・役割と関係図.md](./JSファイル構成・役割と関係図.md)

---

## ステップ1: 「ファイルが分かれてる」とはどういうことか

```javascript
// fileA.js
const message = "こんにちは";
```

```javascript
// fileB.js
console.log(message); // ← ここでエラーになる
```

`fileA.js`で`message`という変数を作っても、`fileB.js`側からは`message`という文字自体が「存在しないもの」として扱われ、エラーになる。

**なぜか**

現在のJavaScript(モジュールという仕組み)では、1つのファイルが1つの「箱」になっている。`const`や`let`で作った変数は、その箱の中にしか存在しない。箱の外(=別のファイル)からは中が見えない仕組みになっている。

これは事故ではなく、わざとそう作られている。もし全部のファイルの変数がどこからでも見えてしまうと、あるファイルの変数名が別のファイルの変数名とうっかり被った時に、意図せず上書きされてしまう事故が起きやすくなるから。

---

## ステップ2: 「箱の外に置ける共有スペース」(window)

ファイルという「箱」の中に置いた変数は他から見えない。渡したい時は、`window`という特別な場所に置く。

```javascript
// fileA.js
window.message = "こんにちは";
```

```javascript
// fileB.js
console.log(window.message); // ← "こんにちは" が表示される
```

**なぜこれで動くのか**

`window`は、ファイルの「箱」の外側にある、たった1つだけ存在する共有の置き場。ブラウザがページを開いた時点で、最初から用意されている。

`const message = ...`は「箱の中に変数を作る」行為だが、`window.message = ...`は「箱の外にある共有の棚に、`message`という札を付けて物を置く」行為。棚は箱の外にあるので、どのファイルからも同じ棚を覗きに行ける。

つまり:
- `const 変数名 = ...` → そのファイルの中だけで有効
- `window.名前 = ...` → 全部のファイルから見える

---

## ステップ3: 変数だけでなく、関数も同じように渡せる

`window`に置けるのは、文字や数字だけではない。関数もまったく同じやり方で置ける。

```javascript
// fileA.js
window.sayHello = function () {
  console.log("こんにちは");
};
```

```javascript
// fileB.js
window.sayHello(); // ← fileAで作った関数が、fileBから実行される
```

**なぜこれで動くのか**

考え方はステップ2の`window.message`とまったく同じ。`function () { ... }`という「処理のかたまり」を、`sayHello`という名前を付けて共有の棚(`window`)に置いているだけ。`fileB.js`は、その棚から`sayHello`という名前の物(=処理のかたまり)を取り出して、`()`を付けて実行している。

**実際のアプリで言うと**

これが、`folder_columns.js`の`window.openMemoDetail(childIcon.dataset.memoId)`の正体。

- `show_panel.js`が`window.openMemoDetail = function (memoId) { ... }`という形で、棚に関数を置いている
- `folder_columns.js`は、その関数がどこで作られたか知らなくても、棚から名前で呼び出して使っている

---

## ステップ4: 「順番」が問題になる場合

`window`に物を置く側と、それを読む側があるとき、**置く側が先に動いていないと壊れる**。

```javascript
// fileB.js が先に実行された場合
console.log(window.sayHello); // undefined
window.sayHello();             // エラー:関数じゃないものは実行できない
```

```javascript
// fileA.js (fileBの後に実行された)
window.sayHello = function () {
  console.log("こんにちは");
};
```

**なぜ壊れるか**

`window`という棚自体は最初から存在しているが、`fileA.js`が「まだ何かを置いていない」段階では、棚の`sayHello`という場所は空っぽ。`fileB.js`がその空っぽの場所を先に覗きに行くと、`undefined`(何も無い)が返ってきて、それを関数として実行しようとするとエラーになる。

**じゃあ、どっちが先に動くかは何で決まるのか**

このアプリでは、`application.js`に書かれた`import`の順番で決まる。

```javascript
// application.js
import "top"            // ← これが1番目に実行される
import "select"         // ← これが2番目に実行される
```

なので、`select.js`が`window.icon_container`を使う処理は、`top.js`が先に`window.icon_container = icon_container;`を実行し終わっていることを前提にしている。実際`application.js`でも`"top"`が`"select"`より先に書かれているので、これは正しく動く。

もしこの順番を`select`→`top`に入れ替えてしまうと、`select.js`が動く時点ではまだ`window.icon_container`が置かれておらず、エラーになる。

---

## ステップ5: なぜ`top.js`と`select.js`の双方向でも順番が破綻しないのか

ステップ4で「置く側が先に動いてないと壊れる」という話をした。`top.js`と`select.js`はお互いがお互いの物を使い合っているのに、なぜこれで壊れないのかを見る。

**まず、実際どこで使われてるかを確認**

`top.js`が`select.js`の`window.isSelecting`や`window.turnOffSelectMode`を読んでる場所:

```javascript
// top.js
memo.addEventListener('click', function () {
    ...
    if (window.isSelecting) window.turnOffSelectMode(); // ← クリックされた時だけ動く
});
```

`select.js`が`top.js`の`window.icon_container`を読んでる場所:

```javascript
// select.js
select_btn.addEventListener('click', function () {
    ...
    const icons = window.icon_container.querySelectorAll('.folder-icon'); // ← クリックされた時だけ動く
});
```

**気づくべきポイント**

どちらも、`addEventListener('click', ...)`の**中**に書かれている。つまり「読みに行く」タイミングは、ページが表示された直後ではなく、**ユーザーが実際にボタンを押した瞬間**。

**なぜこれで安全なのか**

- 「置く」処理(`window.icon_container = ...`や`window.isSelecting = false`)は、`turbo:load`が発火した瞬間に、即座に実行される
- 「読む」処理は、ユーザーがボタンを押すまで実行されない

ユーザーがボタンを押せるのは、ページの表示が終わった後。つまり、`top.js`の`turbo:load`処理も`select.js`の`turbo:load`処理も、**両方ともとっくに終わっている状態**でしか、ユーザーはクリックできない。

なので「`top`と`select`、どっちの`turbo:load`が先に動くか」という順番自体は、この2ファイルの関係においては実はもうどうでもよくなっている。どちらも「置く」のはページ表示時、「読む」のはそのずっと後(クリック時)なので、間に合わないという事態が起こり得ないから。

**一般化すると**

- 読む処理が**即座に(setup中に)**実行される場合 → 置く側・読む側の順番が重要(ステップ4のパターン)
- 読む処理が**後のイベント(クリックなど)まで先送りされる**場合 → setupの順番は重要でなくなる(このステップのパターン)

---

## 次に続く話

ステップ1〜5で、`window`を使ったファイル間のやり取りの基本と、順番が問題になる場合/ならない場合の両方を扱った。実際のアプリの8ファイル全体の役割分担・関係図は[JSファイル構成・役割と関係図.md](./JSファイル構成・役割と関係図.md)にまとめてある。
