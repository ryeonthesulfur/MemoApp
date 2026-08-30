# `show`アクションはビューを描画しない、表示してるのはJS

`MemosController#show`(や`FoldersController#show`)で取得したデータが、なぜ`TopController`の`index.html.erb`に表示されるのか、という疑問の整理です。

---

## 「普通のRails」ならこうなる

JSを使わない、昔ながらのRailsアプリなら、コントローラーのアクションはこう書きます。

```ruby
def show
  @memo = Memo.find(params[:id])
  # render を省略すると、Railsが自動で app/views/memos/show.html.erb を探して描画する
end
```

この場合、ブラウザが`/memos/3`にアクセスすると、Railsは`app/views/memos/show.html.erb`という**専用のビューファイル**を探し出し、それを**新しいHTMLページとして**返します。ブラウザは`/memos/3`という**新しいURLに画面遷移**します。

「あるアクションで取ったデータは、そのコントローラーに紐づいたビュー(`show.html.erb`)にしか表示できない」という認識は、**この昔ながらのやり方では正しい**です。

---

## でも今回は`render json: @memo`と書いている

```ruby
def show
  render json: @memo
end
```

`render json: ...`と明示的に書くと、**Railsのデフォルト動作(ビューを自動で探して描画する)を上書き**します。`show.html.erb`を探しにいくことも、HTMLページを作ることも、画面遷移することも、**一切起きません**。やってることは「`@memo`をJSON文字列に変換して、それだけを返す」、これだけです。

---

## では、`index.html.erb`にデータが出てくるのはなぜか

**答え: `show`アクションが表示させてるのではなく、`show`アクションはJSONを返すだけで仕事を終えていて、それをどこに表示するかは完全にJS側が決めてるから**です。

```javascript
fetch(`/memos/${memoId}`)
  .then(response => response.json())
  .then(memo => {
    document.querySelector('.show_title').textContent = memo.title;
    // ...
  });
```

JSが、受け取ったJSONの中身(`memo.title`など)を、`document.querySelector(...)`で**既に画面に表示されてる`index.html.erb`の中の要素**(`.show_title`など)に、後から書き込んでいます。この`.show_title`という`<div>`自体は、最初に`TopController#index`が`index.html.erb`を描画した時に、**空っぽの状態で既に用意されていた**ものです(空にする理由は別の解説ファイルで扱った通りです)。

---

## 役割分担の図

```
memos_controller#show                    JavaScript(fetch側)
      │                                        │
      │  render json: @memo                    │
      │  (JSONを返すだけ。ここで仕事終了)          │
      │───────────────────────────────────────▶│
                                                │
                                          .then(memo => {
                                            document.querySelector('.show_title')
                                              .textContent = memo.title;
                                          })
                                          (index.html.erb の中の要素に、
                                           自分で書き込みに行っている)
```

- **Rails(`memos_controller`)の仕事**: JSONを返す。それ以上は何もしない
- **JSの仕事**: そのJSONを受け取って、今表示されてるページ(`index.html.erb`)の、どの要素に、どう書き込むかを、自分で決めて実行する

---

## まとめ

| 認識 | 正しいか |
|---|---|
| 「`show`アクションのデータは、そのコントローラーの`show.html.erb`にしか表示できない」 | `render`を省略した**普通のRails**なら正しい |
| 「`render json: ...`と書いた`show`アクションが、`index.html.erb`にデータを表示させている」 | **不正確**。`show`アクションはJSONを返すだけで、表示自体はJSの仕事 |
| 「`show`アクションはJSONを返すだけ、それをどこに表示するかはJSが決めている」 | **正確** |

`render json:`と書いた時点で、そのアクションは「ビューを描画する」という仕事から完全に切り離されます。データがどこに、どう表示されるかは、Rails側の関知するところではなく、100% JS側の責任です。
