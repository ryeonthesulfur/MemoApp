# fetchの「headers」と「body」の違い  260905

`select.js`の削除処理などで出てくる`fetch(url, { method: 'DELETE', headers: {...} })`の`headers`について。なぜこの名前なのか、`body`と何が違うのかをまとめます。

---

## HTTP通信は「headers」と「body」の2部構成

ブラウザとサーバーのやり取り(リクエスト)は、大きく2つの部分でできてます。

| 部分 | 役割 |
|---|---|
| **headers(ヘッダー)** | 「これは誰からのリクエストか」「データの形式は何か」といった、**付随情報・メタ情報** |
| **body(ボディ)** | 実際に送りたい**データそのもの**(無い場合もある) |

これはJS(`fetch`)が勝手に決めた名前ではなく、**実際のHTTP通信の仕組みに合わせた本物の用語**です。ブラウザの開発者ツールの「Network」タブで実際の通信を見ると、「Request Headers」という名前でそのまま表示されます。

---

## CSRFトークンがheadersに入ってる理由

```javascript
const response = await fetch(url, {
    method: 'DELETE',
    headers: {
        'X-CSRF-Token': csrfToken,
    },
});
```

CSRFトークン(合言葉)は、「変更したいデータの中身」ではなく「このリクエストが正規のものだと証明する情報」です。だからbody(データ)ではなく、headers(付随情報)側に入れるのが正しい置き場所になります。

---

## POST/PATCHとDELETEの違い(bodyの有無)

- **POST・PATCH**(新規作成・更新): 「何を保存するか」というデータが必要 → `body: JSON.stringify({...})`でデータを送る
- **DELETE**(削除): URLに含まれてるidだけで「何を消すか」が分かるので、送るべきデータが無い → `body`自体を書かない

なので、削除処理のfetchには`headers`(CSRFトークンだけ)はあっても、`body`は登場しません。

---

## まとめ

| | headers | body |
|---|---|---|
| 中身 | 付随情報・メタ情報(認証情報など) | 実際に送りたいデータ |
| 今回の例 | CSRFトークン | フォルダ名・メモのタイトルなど(POST/PATCHの時だけ) |
| DELETEでは | 必要(CSRFトークンのため) | 不要(送るデータが無いため) |
