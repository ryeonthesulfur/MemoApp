# 音の実装９　実験3、Webampの再生開始を検知して、BGMを止める手順  260926

「音の実装８」で、実験2(Webampのウィンドウを付け直せるか)が成功した。次は、「音の実装４」の§8にある**実験3**を行う。

ファイルは一切変更せず、ブラウザのコンソールだけで行う。

---

## 1. 何を確かめたいか

「音の実装４」で決めた仕様は、**「Webampで音楽を再生したら、今のBGM(`bgm.wav`)を止める」**。

そのためには、**「Webampの再生が始まった」ことを、プログラムが知る**必要がある。

実装4には、「Webampには『再生が始まった時』専用のイベントが無い」と書かれていて、代わりに、次の2つを組み合わせる案が挙がっていた。

- `onTrackDidChange`: 曲の読み込みが始まった時に呼ばれる
- `getMediaStatus() === "PLAYING"`: 今、再生中かどうかを確認できる

ただし、実装4には「**停止中の同じ曲をもう一度再生した時に、`onTrackDidChange`が呼ばれるか分からない**」とも書かれていた。これを、実際に確かめる。

### Webampのソースを読んで分かったこと(実験の前の見立て)

Webampのソース(`~/Desktop/projects2/webamp/packages/webamp/js/`)を読んだところ、次の2つが分かった。

**① `onTrackDidChange`は、同じ曲を再生し直しても、呼ばれない見込み**
`onTrackDidChange`の中身は、「今再生している曲のID」を見張っていて、**前回と同じIDなら、何もしない**(`if (trackId === previousTrackId) return;`)。同じ曲を、停止してからもう一度再生しても、曲のIDは変わらないので、呼ばれないはず。

**② 「再生が始まった」を直接知らせるイベントが、別にある**
Webampの内部には`media`という部品(音を鳴らしている部分)があり、**再生状態が「再生中」に変わるたびに、`"playing"`というイベントを出している**(`media/index.ts`の`statusChange`の処理)。`window.myWebamp.media.on("playing", 関数)`で、そのタイミングを受け取れるはず。

ただし、`media`は、ソースに`// TODO: Make this _private`(将来、外から触れなくする予定)と書かれている。今回は、`vendor/javascript/`に置いたバージョン2.2.0の部品ファイルを使っていて、勝手に更新されることはないので、そのバージョンの間は、そのまま使える。

この見立てが、実際に正しいかを、実験で確かめる。

---

## 2. 前提

「音の実装７」の4行を実行して、Webampのウィンドウが画面に出ている状態から始める。ブラウザを更新(F5)してしまった場合は、実装7の4行を、最初からやり直す。

---

## 3. 手順

### 手順1: 今のBGMに見立てた音を、鳴らす

```javascript
window.bgm = new Audio("/bgm.wav"); window.bgm.loop = true; window.bgm.play();
```

**何をするか**
`new Audio("/bgm.wav")`で、JSだけで音声を作り、`window.bgm`に載せて鳴らす。`loop = true`は、曲が終わったら最初から繰り返す設定(今のBGMの`<audio id="bgm" ... loop>`と同じ)。

**なぜ必要か**
実装4の方針では、BGMは`window.bgm = new Audio(...)`にする。この`window.bgm`を、Webampの再生が始まった時に止められるかを、確かめるため。

**画面の変化**
BGMが鳴り始める。(Webampの再生ボタンは、まだ押さない)

### 手順2: Webampの「再生が始まった」を検知する見張りを、2つの方法で付ける

```javascript
window.myWebamp.media.on("playing", () => console.log("[media: playing]"));
window.myWebamp.onTrackDidChange((track) => console.log("[onTrackDidChange]", track));
```

**何をするか**
2つの方法で、Webampの状態を見張り、反応があるたびに、コンソールに目印付きの文字を表示する。

| 見張り方 | 表示される文字 | 見立て |
|---|---|---|
| `media.on("playing", ...)` | `[media: playing]` | 再生が始まるたびに出るはず |
| `onTrackDidChange(...)` | `[onTrackDidChange]` | 曲が変わった時だけ出るはず(同じ曲の再生し直しでは出ないはず) |

**なぜ必要か**
どちらが、「再生が始まった」を確実に検知できるかを比べるため。

**画面の変化**
何も変わらない。

### 手順3: Webampで、再生・停止・再生し直しを行って、どの表示が出るかを見る

Webampの本体ウィンドウには、左から順に、次のボタンが並んでいる。

| ボタン | 意味 |
|---|---|
| ⏮ | 前の曲 |
| ▶ | 再生 |
| ⏸ | 一時停止 |
| ■ | 停止 |
| ⏭ | 次の曲 |

次の順に操作して、その都度、コンソールに何が表示されたかを見る。

1. **▶を押す**(最初の再生)
2. **■(停止)を押して、もう一度▶を押す**(停止してから、同じ曲を最初から再生し直す)
3. **⏸(一時停止)を押して、もう一度▶を押す**(一時停止してから、続きを再生する)

**画面の変化**
Webampの曲(`bgm.wav`)と、手順1のBGMが、**同時に鳴って、音が重なって聞こえる**。これは、この時点では正常(まだ、BGMを止める処理を付けていないため)。

**見立て(ソースを読んだ限りの予想)**

| 操作 | `[media: playing]` | `[onTrackDidChange]` |
|---|---|---|
| 1. ▶(最初の再生) | 出る | 出ない(曲の読み込みは、見張りを付ける前に終わっている) |
| 2. ■→▶(停止して、再生し直す) | 出る | 出ない(同じ曲なので) |
| 3. ⏸→▶(一時停止して、再開する) | 出る | 出ない |

**実際にどう表示されたかを、この表に書き込んで比べる。**

### 手順4: 「再生が始まったらBGMを止める」処理を付けて、実際に止まるかを確かめる

まず、手順3で鳴っているWebampを、■で停止しておく。そのあと、次を実行する。

```javascript
window.myWebamp.media.on("playing", () => window.bgm.pause());
```

**何をするか**
「Webampの再生が始まったら、`window.bgm`(今のBGMに見立てたもの)を一時停止する」という処理を、見張りに追加する。

**なぜ必要か**
これが、実装4で決めた仕様、「Webampで再生したら、今のBGMを止める」の中身になる。

次に、BGMをもう一度鳴らして、Webampの▶を押す。

```javascript
window.bgm.play()
```

BGMが鳴り始めたら、Webampの▶を押す。

**画面の変化(期待する結果)**
Webampの▶を押した瞬間に、**BGMだけが止まる**。Webampの曲は鳴り続ける。

続けて、次を実行して、状態を確かめる。

```javascript
[window.bgm.paused, window.myWebamp.getMediaStatus()]
```

**期待する結果**
`[true, "PLAYING"]`

- `true`: BGMは、一時停止している
- `"PLAYING"`: Webampは、再生中

---

## 4. 結果の見方

**`[media: playing]`が、再生が始まるたび(1〜3のすべて)に表示され、手順4でBGMも止まった場合**
`media.on("playing", ...)`が、「Webampの再生開始」の検知に使える。実装4の「`onTrackDidChange`と`getMediaStatus()`を組み合わせる」案よりも、簡単で確実なので、こちらを使う。

**`[media: playing]`が、表示されない回があった場合**
どの操作で表示されなかったかを記録する。その場合は、`getMediaStatus() === "PLAYING"`を使った別の方法(状態が変わるたびに確認する)を検討する。

**`[onTrackDidChange]`が、停止→再生し直しで表示された場合**
見立てが外れている。その場合は、`onTrackDidChange`も検知に使える。

---

## 5. 注意

- `media.on(...)`には、見張りを外す(解除する)命令が無い。手順を繰り返すと、同じ見張りが重なって登録されるので、やり直す時は、F5で更新して、実装7の4行から最初にやり直す
- 手順4の後も、`window.myWebamp`や`window.bgm`は、JSの状態として残る。ページを移っても、この見張りが有効なままかは、今回は確かめない(`window`に載せたものは、ページ移動で消えないため、有効なままのはず)

---

## 6. 実験の結果  261026

Claude Codeのアプリ内ブラウザで`http://localhost:3000/`を開いて、実施した。

- 実装7の4行と手順1・2は、コンソールから実行した。
- Webampのボタン(▶・⏸・■)は、画面上を実際にクリックした。
- 結果は、コンソールに出た表示と、`getMediaStatus()`・`bgm.paused`の値で確かめた。

### 手順1・2

- `window.bgm.play()`は、エラーにならずに鳴り始めた(`bgm.paused`が`false`)。
- この時点のWebampは`"STOPPED"`で、見張りを付けても、何も表示されなかった。

### 手順3の結果(見立てとの比較)

| 操作 | `[media: playing]` | `[onTrackDidChange]` | `getMediaStatus()` |
|---|---|---|---|
| 1. ▶(最初の再生) | **出た**(見立て通り) | **出た**(`/bgm.wav`の曲情報)。見立ては「出ない」 | `"PLAYING"` |
| 2. ■(停止) | 出ない | **出た**(`null`) | `"STOPPED"` |
| 2. → ▶(再生し直し) | **出た**(見立て通り) | **出た**(`/bgm.wav`の曲情報)。見立ては「出ない」 | `"PLAYING"` |
| 3. ⏸(一時停止) | 出ない | **出た**(`null`) | `"PAUSED"` |
| 3. → ▶(再開) | **出た**(見立て通り) | **出た**(`/bgm.wav`の曲情報)。見立ては「出ない」 | `"PLAYING"` |

**`[media: playing]`**: 見立て通り、再生が始まるたびに、毎回1回だけ出た。

**`[onTrackDidChange]`**: 見立てが外れた。停止・一時停止のたびに`null`で呼ばれ、再生のたびに曲情報つきで呼ばれた。

### 見立てが外れた理由

Webampのソース(`webampLazy.tsx`の`onTrackDidChange`)をもう一度読むと、見張っているIDは「今の曲のID」ではなかった。`getCurrentlyPlayingTrackIdIfLoaded`(`selectors.ts`)という、**「再生中の曲のID」**だった。

この値は、次のように変わる。

- 再生していない間(停止・一時停止)は、`null`になる。
- 再生が始まると、曲のIDに戻る。

つまり、同じ曲でも「ID → `null` → ID」と変わるので、`if (trackId === previousTrackId) return;`に引っかからず、毎回呼ばれる。

1回目の▶で出たのも、同じ理由。見張りを付けた時点では停止中(`null`)で、▶で曲のIDに変わったため。

### 手順4の結果

手順4は、次の順で行った。

1. ■で停止した。
2. `media.on("playing", () => window.bgm.pause())`を付けた。
3. `window.bgm.play()`で、BGMを鳴らした(`bgm.paused`が`false`)。
4. Webampの▶をクリックした。

```javascript
[window.bgm.paused, window.myWebamp.getMediaStatus()]
// → [true, "PLAYING"]
```

**期待通り**、▶を押した瞬間に、BGMだけが止まり、Webampは再生を続けた。

### 結論

**「Webampの再生が始まったらBGMを止める」は、実現できる。** 検知のやり方は、次の2つのどちらでもよい。

| やり方 | 書き方 | 良いところ | 気をつけるところ |
|---|---|---|---|
| A. `media.on("playing", ...)` | `myWebamp.media.on("playing", () => bgm.pause())` | 「再生開始」そのものを受け取れる | `media`は非公開予定(`// TODO: Make this _private`)。見張りを外す命令が無い |
| B. `onTrackDidChange` | `myWebamp.onTrackDidChange((track) => { if (track) bgm.pause(); })` | **公式のAPI**。見張りを外す関数が返ってくる | `track`が`null`のとき(停止・一時停止)は、何もしないようにする必要がある |

**おすすめはB。** 公式のAPIなので、将来Webampを新しいバージョンに替えても、動かなくなる心配が少ない。

`track`が`null`ではないとき = 再生が始まったとき(または、再生中に別の曲に切り替わったとき)。どちらでもBGMを止めてよいので、仕様と合う。

---

## 7. 次にやること

実験3が終わったので、「音の実装４」の§8の1番(実験)が全部終わった。次は、2番以降(サーバー側のルーティング・コントローラー・ビューを作り、`/`を「MIND PALACE」だけの画面にする)に進む。
