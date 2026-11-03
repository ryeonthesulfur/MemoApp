# 音の実装７　Webampをコンソールから画面に出す手順  260926

「音の実装６」で、MemoAppからWebampの部品を読み込めるようになった(コンソールで`await import("webamp")`を実行して、`Module {default: class ...}`と表示された)。次は、その部品を使って、Webampのプレーヤーを実際に画面に出してみる。

この手順は、ファイルを一切変更せず、ブラウザのコンソールだけで行う。「音の実装４」の§8の実験2・3(Webampを付け直せるか、BGMを止められるか)を確かめるための、準備にあたる。

---

## やること

ブラウザで`http://localhost:3000/`を開いて、F5で更新する。開発者ツールのコンソールで、次の4行を、上から順に実行する(1行ずつでも、まとめて貼り付けても大丈夫)。

```javascript
const { default: Webamp } = await import("webamp");
window.myWebamp = new Webamp({ initialTracks: [{ url: "/bgm.wav" }] });
const holder = document.createElement("div"); document.body.appendChild(holder);
await window.myWebamp.renderWhenReady(holder);
```

---

## 1行ずつの解説

### 1行目: Webampの部品を読み込んで、`Webamp`という名前で使えるようにする

```javascript
const { default: Webamp } = await import("webamp");
```

**何をするか**
`import("webamp")`で、音の実装６で登録した部品(`vendor/javascript/webamp.js`)を読み込む。読み込んだ結果は、`Module {default: class ...}`という形をしていて、Webamp本体(クラス)は、その中の`default`という名前で入っている。

`{ default: Webamp }`は、「`default`という名前のものを取り出して、`Webamp`という名前で使う」という書き方(名前を変えて受け取る分割代入。`分割代入で名前を変えて受け取る書き方_解説.md`と同じ)。

**なぜ必要か**
`default`という名前のままだと分かりにくいので、`Webamp`という名前に変えて、以降の行で使う。

**画面の変化**
まだ何も出ない。

### 2行目: Webampのプレーヤーを1つ作って、`window`に載せる

```javascript
window.myWebamp = new Webamp({ initialTracks: [{ url: "/bgm.wav" }] });
```

**何をするか**
`new Webamp({...})`で、Webampのプレーヤーを1つ作る。`{ initialTracks: [...] }`は、「最初からプレイリストに入れておく曲」の指定。ここでは、`/bgm.wav`(今のBGMと同じ音)を1曲だけ入れる。曲の指定には、`url`(場所)だけ書けば足りる(Webampのソースで確認した)。

作ったプレーヤーは、`window.myWebamp`に載せる。

**なぜ必要か**
この後の実験(ウィンドウの付け直し、BGMを止める処理)で、同じプレーヤーをコンソールから触るため。`window`に載せておけば、後から`window.myWebamp`で呼び出せる。

**画面の変化**
まだ何も出ない。プレーヤーを作っただけで、表示はまだしていない。

### 3行目: Webampを表示するための、空の入れ物を、画面に作る

```javascript
const holder = document.createElement("div"); document.body.appendChild(holder);
```

**何をするか**
`document.createElement("div")`で、中身が空の`<div>`を1つ作り(`holder`という名前を付ける)、`document.body.appendChild(holder)`で、それを画面(`<body>`)の中に追加する。

**なぜ必要か**
Webampは、表示する時に渡された要素を、自分で管理する形で使う(Webampのソースで、渡された要素にReactの表示を作っていることを確認した)。**渡した要素の元の中身は、Webampに置き換えられる。** そのため、**`document.body`をそのまま渡してはいけない**。渡すと、画面全体が置き換わってしまう。空の`<div>`を渡せば、置き換わるのはその`<div>`の中だけで済む。

**画面の変化**
まだ何も出ない(空の`<div>`は、見えない)。

### 4行目: 空の入れ物に、Webampを表示する

```javascript
await window.myWebamp.renderWhenReady(holder);
```

**何をするか**
`renderWhenReady(holder)`で、Webampを、3行目で作った入れ物を基準にして表示する。「WhenReady」は、「準備(スキンの読み込みなど)が終わってから表示する」という意味。`await`で、その準備が終わって表示されるまで待つ。

**なぜ必要か**
2行目の`new Webamp(...)`は、プレーヤーを作っただけで、表示はしない。表示するには、この`renderWhenReady`を呼ぶ必要がある。

**画面の変化**
**Winampのようなプレーヤーのウィンドウ(本体・イコライザー・プレイリスト)が、画面に出る。**

---

## 結果の見方

**成功した場合**
- プレーヤーのウィンドウが、画面に出る
- プレイリストに`bgm.wav`が1曲入っている
- 再生ボタン(▶)を押すと、音が鳴る

**やり直したい場合は、F5で更新してから、最初の1行目から実行し直す**
- Webampは、同じプレーヤーを2回表示できない(`Cannot render a Webamp instance twice`というエラーになる)
- 4行を最初から実行し直すと、`window.myWebamp`は新しいプレーヤーに変わるが、前のプレーヤーの表示は画面に残るので、プレーヤーが2つ出てしまう

---

## 次にやること

プレーヤーが出て、音が鳴ることを確認したら、実験2に進む。

1. Webampのウィンドウを出したまま、コンソールで`Turbo.visit("/")`を実行する(ページ移動と同じ、`<body>`の入れ替えが起きる)
2. ウィンドウが消えることと、音が鳴り続けることを確認する
3. 消えたウィンドウを、`<body>`に付け直して、元の状態で戻ってくるかを確かめる
