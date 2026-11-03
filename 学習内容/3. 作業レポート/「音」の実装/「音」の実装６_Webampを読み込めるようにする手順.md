# 音の実装６　Webampを読み込めるようにする手順  260926

「音の実装４」の§8「進める順番」の1番(実験)のうち、実験1が終わった([音の実装５](./「音」の実装５_実験1の結果と解説.md))。残りの実験2・3は、Webampを実際に動かす必要がある。そのために、まず、MemoAppでWebampを読み込める状態にする。

この2つの手順を終えても、画面には何も出ない。「Webampの部品ファイルを、MemoAppが読み込める状態にする」だけの準備。

---

## 手順1: Webamp(音楽プレーヤー)の部品ファイルを、MemoAppにコピーして置く

**何をするか**
すでにパソコンの中に、Webampの「完成品の部品ファイル」がある。その中から、Milkdrop(音楽に合わせて動く映像)が入っているものを1つ選んで、MemoAppの「外から持ってきた部品を置く場所」にコピーする。

**なぜ必要か**
MemoAppは、ネットからその都度ダウンロードするのではなく、自分のフォルダの中にある部品ファイルを読み込む作りにしている(公式のドキュメントも、外部のサーバーは止まることがあるので、自分のサーバーに置くのをすすめている)。Webampを使うには、その部品ファイルをMemoAppの中に置いておく必要がある。

**画面の変化**
まだ何も変わらない。

**ファイルの場所(補足)**
- コピー元: `~/Desktop/projects2/webamp/packages/webamp/built/webamp.butterchurn-bundle.min.mjs`(約2MB、Webampのバージョンは2.2.0)
- コピー先: `MemoApp/vendor/javascript/webamp.js`(今、このフォルダは空)
- コピーする時に、名前を`webamp.js`に変える。このあと手順2で「webamp」という名前で呼び出せるようにする時に、`webamp.js`という名前で探されるため

**操作手順**

* harupoco@HarutonoMacBook-Pro ~ % cp ~/Desktop/projects2/webamp/packages/webamp/built/webamp.butterchurn-bundle.min.mjs ~/Desktop/portfolio_latests/MemoApp/vendor/javascript/webamp.js

(「~/Desktop/portfolio_latests/MemoApp/vendor/javascript/webamp.js」がコピー先。)

**コピーできたか確かめる**

harupoco@HarutonoMacBook-Pro ~ % ls -la ~/Desktop/portfolio_latests/MemoApp/vendor/javascript

- total 3976
- drwxr-xr-x  4 harupoco  staff      128  9 26 17:57 .
- drwxr-xr-x  4 harupoco  staff      128  5 31 00:48 ..
- -rw-r--r--  1 harupoco  staff        0  5 31 00:48 .keep
- -rw-r--r--@ 1 harupoco  staff  2032285  9 26 17:57 webamp.js


---

## 手順2: その部品ファイルを、「webamp」という名前で呼び出せるように登録する

**何をするか**
MemoAppには、「この名前で呼ばれたら、このファイルを読み込む」という対応表がある。そこに、「`webamp`という名前で呼ばれたら、手順1で置いたファイルを読み込む」という1行を足す。

**なぜ必要か**
登録しないと、JSの中で「webampを読み込んで」と書いても、ブラウザがどのファイルのことか分からない。

**画面の変化**
まだ何も変わらない。Webampを画面に出すのは、この後の手順。

**ファイルの場所(補足)**
`config/importmap.rb`の最後に、`pin "webamp"`を1行追加する。

---

## 終わった後の確認方法

1. ブラウザで`http://localhost:3000/`を開いて、F5で更新する(対応表を変えたので、更新しないと反映されない)
2. 開発者ツールのコンソールで、`await import("webamp")`を実行する
3. エラーにならず、`Module {...}`のような表示が出れば成功。「webampという名前で、部品ファイルを読み込めた」という意味

```javascript
await import("webamp")
Module {Symbol(Symbol.toStringTag): 'Module', default: ƒ}
default: class gM
Symbol(Symbol.toStringTag): "Module"
```

* default: class ...と出ているのが、Webamp本体(クラス)です。

---

## 次にやること

読み込めることを確認したら、コンソールからWebampを実際に画面に出して、実験2(ページ移動の後にウィンドウを付け直せるか)と実験3(停止中の同じ曲をもう一度再生した時にBGMを止められるか)を確かめる。
