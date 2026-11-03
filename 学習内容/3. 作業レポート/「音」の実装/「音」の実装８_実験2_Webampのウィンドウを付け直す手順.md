# 音の実装８　実験2、Webampのウィンドウを付け直す手順  260926

「音の実装７」で、Webampのプレーヤーをコンソールから画面に出して、音も鳴ることを確認した。次は、「音の実装４」の§8にある**実験2**を行う。

ファイルは一切変更せず、ブラウザのコンソールだけで行う。
## 1. 何を確かめたいか

C案(サイドバーの各項目を別URLのリンクにする)では、ページを移るたびに、Turbo Driveが`<body>`の中身を入れ替える。

Webampのウィンドウは、`<body>`の中に置かれている(Webampが、`<div id="webamp">`という入れ物を作って、`<body>`に追加している。Webampのソースで確認した)。そのため、ページを移ると、**ウィンドウは画面から消える**。音は、「音の実装５」で確認した通り、`<audio>`が画面に置かれていないので、止まらない。

実装4の計画は、次の通り。

- 「憶」「時」に移った時は、ウィンドウが消えてよい
- 「音」に戻ってきた時は、**消えたウィンドウを、`<body>`に付け直して、元の状態(プレイリスト、再生中の表示)のまま戻す**

この「付け直し」が、実際にうまくいくかを確かめるのが、実験2。

---

## 2. 前提

「音の実装７」の4行を実行して、Webampのウィンドウが画面に出ている状態から始める。ブラウザを更新(F5)してしまった場合は、実装7の4行を、最初からやり直す。

---

## 3. 手順

```javascript

window.webampNode = document.getElementById("webamp");  // 「webampNode」という変数名で、最初に実体を与えた時点で自動的にWebampが作った「id = webamp」を紐づけておく。

window.myWebamp.getMediaStatus()   // webamp が再生中かどうか確認する。
Turbo.visit("/")   // 画面遷移する。

// 画面が遷移し、webamp は遷移先の「<body>」には無いので、姿が消える。

// 姿は消えても、音楽は流れっぱなしかどうか、要素は今の画面（<body>）に繋がっているかどうか、クラスが存在しているかどうか確認する。
[window.myWebamp.getMediaStatus(), window.webampNode.isConnected, document.getElementById("webamp")]

// 遷移先の画面の「<body>」に子要素として追加する。すると、再び姿が現れる。
document.body.appendChild(window.webampNode);
```

### 手順1: Webampのウィンドウが入っている入れ物を、変数に覚えておく

```javascript
window.webampNode = document.getElementById("webamp");
```

**何をするか**
`document.getElementById("webamp")`で、画面の中から、`id`が`webamp`の要素(Webampのウィンドウが全部入っている入れ物)を探して、`window.webampNode`という名前で覚えておく。

**なぜ必要か**
次の手順で、ページを移ると、この入れ物は画面から外される。画面から探すことはできなくなるので、その前に、変数で持っておく必要がある。変数で持っていれば、画面から外された後も、要素そのものは残る(「音の実装５」で確認した、JSの状態はページを移っても消えない、という仕組みと同じ)。

**画面の変化**
何も変わらない。

### 手順2: 曲を再生して、再生中の状態にする

Webampの再生ボタン(▶)を押して、音を鳴らす。そのあと、コンソールで次を実行する。

```javascript
window.myWebamp.getMediaStatus()
```

**何をするか**
`getMediaStatus()`は、Webampが今どんな状態かを教えてくれる命令。再生中なら`"PLAYING"`と返ってくる。

**なぜ必要か**
この後、ページを移った後も、そして付け直した後も、再生が続いているかを、目と耳だけでなく、この値でも確かめるため。

**期待する結果**
`"PLAYING"`と表示される。(曲の長さは約5分53秒。曲が終わると`"STOPPED"`になるので、その時は▶を押し直す)

### 手順3: ページを移って、ウィンドウが消えることを確認する

```javascript
Turbo.visit("/")
```

**何をするか**
リンクをクリックした時と同じ、Turbo Driveのページ移動を行う。`<body>`が新しいものに入れ替わる。

**画面の変化**
**Webampのウィンドウが、画面から消える。** 音は、鳴り続ける。

続けて、次を実行して、状態を確かめる。

```javascript
[window.myWebamp.getMediaStatus(), window.webampNode.isConnected, document.getElementById("webamp")]
```

**何をするか**
3つの値を、まとめて確認する。

| 見ているもの | 意味 |
|---|---|
| `window.myWebamp.getMediaStatus()` | Webampの再生状態 |
| `window.webampNode.isConnected` | 手順1で覚えておいた入れ物が、今、画面(ページ)につながっているか |
| `document.getElementById("webamp")` | 今の画面の中から、`id`が`webamp`の要素を探した結果 |

**期待する結果**
`["PLAYING", false, null]`

- `"PLAYING"`: 再生が続いている
- `false`: 覚えておいた入れ物は、画面から外れている(だからウィンドウが消えた)
- `null`: 今の画面のどこにも、`webamp`という要素は無い

### 手順4: 覚えておいた入れ物を、画面に付け直す

```javascript
document.body.appendChild(window.webampNode);
```

**何をするか**
`appendChild`は、要素を、指定した場所の中に追加する命令。すでに持っている要素(`window.webampNode`)を渡すと、その要素を、今の`<body>`の中に追加する。

**なぜ必要か**
手順3で消えたウィンドウは、要素としては、変数の中に残っている。それを`<body>`に付け直せば、元の状態で戻ってくるかを確かめるため。これが、実装4の「ウィンドウを戻す」処理の中身になる。

**画面の変化**
**Webampのウィンドウが、また画面に出る。** 元の位置、プレイリストに`bgm.wav`が入っている状態、再生中の表示のまま、戻ってくるはず。

続けて、次を実行して、状態を確かめる。

```javascript
[window.myWebamp.getMediaStatus(), window.webampNode.isConnected]
```

**期待する結果**
`["PLAYING", true]`

- `"PLAYING"`: 再生が続いている
- `true`: 入れ物が、画面につながった

---

## 4. 結果の見方

**全部、期待通りだった場合**
実装4の「ウィンドウを戻す」方法(覚えておいた要素を、`<body>`に付け直す)が使える。「音」の実装に、そのまま採用できる。

**ウィンドウは戻ったが、ボタンが反応しない、見た目が崩れる、などがあった場合**
付け直しだけでは足りないので、実装4の§9に書いてある別の方法(`turbo:before-render`で新しい`<body>`に移し替える、または`renderInto`を使う)を検討する。

**途中で音が止まった場合**
どの手順で止まったかを記録して、原因を調べる。

---

## 5. 注意

- この実験は、**F5で更新した後、`Turbo.visit`を1回だけ実行する**形にする。Turboは、ページを離れる時に、画面のコピーを保存していて、2回目以降は、それを先に見せることがある。消えたはずのウィンドウが一瞬見えたりして、結果が分かりにくくなるため
- やり直す時は、F5で更新して、実装7の4行から最初にやり直す

---

## 6. 次にやること

実験2が終わったら、実験3に進む。

**実験3**: Webampで「停止中の同じ曲をもう一度再生」した時に、今のBGMを止められるか。Webampには「再生が始まった時」専用のイベントが無いので、実装4に書いた2つの方法(`onTrackDidChange`と`getMediaStatus() === "PLAYING"`)で、再生を検知できるかを確かめる。

---

## 7. 実験の結果（261026 追記）

実験2は以前に行って成功していたが、結果をこのレポートに書いていなかった。記録を残すため、261026に同じ手順でもう一度行い、その結果をここに書く。

- **場所**: Claude Codeのアプリ内ブラウザで、`http://localhost:3000/` を開いて行った。
- **やり方**: 更新(F5)してから始めた。実装7の4行と手順1をコンソールで実行し、Webampのボタン(▶・⏸)は画面上を実際にクリックした。
- **補足**: 実験1と同じように、ページ全体が読み込み直されていないことを確かめるための目印 `window.marker = "before-visit"` を、手順3の前に付けておいた。

### 結果のまとめ

| 手順 | 確かめたこと | 期待する結果 | 実際の結果 | 判定 |
|---|---|---|---|---|
| 2. ▶を押す | `getMediaStatus()` | `"PLAYING"` | `"PLAYING"` | ✅ |
| 3. `Turbo.visit("/")` | `[再生状態, isConnected, getElementById("webamp")]` | `["PLAYING", false, null]` | `["PLAYING", false, null]` | ✅ |
| 3. （同上） | 目印 `window.marker` | ― | `"before-visit"` のまま（ページ全体の読み込み直しは起きていない） | ✅ |
| 3. （同上） | 画面の見た目 | ウィンドウが消える | ウィンドウが消え、「MIND PALACE」の画面だけになった | ✅ |
| 4. `appendChild` で付け直す | `[再生状態, isConnected]` | `["PLAYING", true]` | `["PLAYING", true]` | ✅ |
| 4. （同上） | 画面の見た目 | 元の状態で戻る | 本体・イコライザー・プレイリスト・Milkdropが元の位置に戻った。プレイリストの曲もそのまま。Milkdropの映像も動いていた | ✅ |
| 4. のあと | ボタンが反応するか | ― | ⏸を押すと `"PAUSED"`、▶を押すと `"PLAYING"` になった | ✅ |

### 分かったこと

- **ページを移っても、Webampの再生は止まらない。** ウィンドウ（`#webamp`）は画面から外れるが、`window.webampNode` に覚えておけば、要素はなくならない。
- **覚えておいた要素を `document.body.appendChild()` で付け直すだけで、元の状態のまま戻る。** ボタンもきちんと反応する。
- そのため、§4「結果の見方」の **「全部、期待通りだった場合」** に当てはまる。実装4の§9にある別の方法（`turbo:before-render` や `renderInto`）は、使わなくてよい。

### 実装で使う形（「音」の実装のときの参考）

```javascript
// 「音」のページから離れる前（または、初めて表示したとき）に覚えておく
window.webampNode = document.getElementById("webamp");

// 「音」のページに戻ってきたときに付け直す
document.body.appendChild(window.webampNode);
```
