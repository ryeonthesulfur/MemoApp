# `vendor`フォルダの役割、解説  260926

Webampの部品ファイルを、MemoAppの`vendor/javascript/`に置いたことをきっかけに、`vendor`フォルダが何のためにあるのかを整理する。

---

## 1. `vendor`フォルダとは

**自分で書いたものではなく、他の人が作った部品(第三者のコード)を置くための場所。**

`vendor`は、英語で「販売元・提供元」という意味。「よそから提供された部品」を置く場所、という名前になっている。

Railsのアプリを作ると、最初から`vendor`フォルダが用意されている。中には`.keep`という空のファイルだけが入っていて、必要になった時に、外から持ってきた部品を置く。

---

## 2. MemoAppの中で、どこに何があるか

| 場所 | 置いてあるもの | 例 |
|---|---|---|
| `app/javascript/` | **自分で書いた**JS | `top.js`・`select.js`・`sound.js`など |
| `vendor/javascript/` | **外から持ってきた**JS(部品) | `webamp.js`(今回置いたもの) |
| gemの中(MemoAppの外) | Railsの部品(gem)に含まれているJS | `turbo.min.js`・`stimulus.min.js` |

`turbo.min.js`と`stimulus.min.js`は、`config/importmap.rb`で`pin "@hotwired/turbo-rails", to: "turbo.min.js"`と書かれているが、ファイル自体は`vendor`ではなく、gemの中にある。そのため、今まで`vendor/javascript/`は空(`.keep`だけ)だった。**Webampが、`vendor/javascript/`に置く最初の部品になる。**

---

## 3. なぜ、自分のコードと分けて置くのか

- **どれが自分で書いたコードか、一目で分かる**: `app/javascript/`は自分のコード、`vendor/javascript/`は他人のコード、と分かれていれば、「これは自分が直していいもの」「これは手を入れないもの」を見分けられる
- **部品を新しくする時に、ファイルごと入れ替えればよい**: 他人が作った部品の中身は、自分では直さない。新しい版が出たら、ファイルごと差し替える
- **自分のコードの中に、何万行もある他人のコードが混ざらない**: 今回のWebampは約2MB。自分のコードと同じ場所に置くと、自分のコードを探しにくくなる

---

## 4. `importmap`との関係(なぜ`pin "webamp"`で読み込めるのか)

MemoAppは、`config/importmap.rb`にある「名前とファイルの対応表」を使ってJSを読み込んでいる。

```ruby
pin "webamp"
```

`to:`で場所を指定していない場合、Railsは`webamp.js`という名前のファイルを探す。探す場所は、`importmap-rails`(この仕組みを提供しているgem)が、次の2か所を登録している(gemの`engine.rb`の46〜47行目で確認)。

1. `app/javascript/`
2. `vendor/javascript/`

**探す順番は、上の順(`app/javascript/`が先、`vendor/javascript/`が後)。** 同じ名前のファイルが両方にあると、先に見つかった方(`app/javascript/`)が使われる。

今回、`app/javascript/`に、中身が空の`webamp.js`が間違って作られていた。そのまま残っていたら、`vendor/javascript/`の本物ではなく、空のファイルが読み込まれて、Webampが入っていないのにエラーにならない、という分かりにくい状態になるところだった。

---

## 5. 今回の例

| やったこと | 意味 |
|---|---|
| Webampの完成品の部品ファイル(約2MB、`webamp.butterchurn-bundle.min.mjs`)を、`vendor/javascript/webamp.js`という名前でコピーした | 外から持ってきた部品を、部品置き場に置いた |
| `config/importmap.rb`に`pin "webamp"`を1行足した | 「`webamp`という名前で呼ばれたら、この部品を読み込む」という対応を登録した |

ファイルの名前を`webamp.js`にそろえたのは、`pin "webamp"`とだけ書いた時に、`webamp.js`という名前で探されるため。

---

## 6. 補足

**変更は、サーバーを再起動しなくても反映される**
`importmap-rails`は、`app/javascript/`と`vendor/javascript/`の2つのフォルダを見張っていて(`engine.rb`の34〜35行目)、中身が変わると対応表を作り直す。ブラウザで更新(F5)すれば反映される。

**`.keep`ファイルは何のためにあるのか**
Gitは、空のフォルダを記録できない。フォルダを残しておきたい時に、中身が空の`.keep`というファイルを置いて、「フォルダごと記録する」ための目印にしている。`vendor/javascript/`が空だった時は、この`.keep`があったので、Gitに記録されていた。

---

## まとめ

- `vendor/javascript/`は、**外から持ってきたJSの部品を置く場所**。自分で書いたコードは`app/javascript/`
- `pin "名前"`と書くと、`app/javascript/`→`vendor/javascript/`の順で、`名前.js`というファイルを探す
- 同じ名前のファイルを両方に置くと、`app/javascript/`の方が使われるので、置く場所を間違えないこと
