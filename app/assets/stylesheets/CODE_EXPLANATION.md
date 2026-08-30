# MemoApp フロントエンド解説

このドキュメントは、フォルダをクリックした際にパネルが展開される機能に関するフロントエンドのコード構造とロジックを解説します。

## 1. 全体アーキテクチャ

この機能は、主に3つの要素から構成されています。

1.  **メインパネル (`#main_panel`)**:
    *   アプリケーションの最上位階層のフォルダやメモを表示する、一番左の初期パネルです。
    *   スタイルは `top.css` で定義されています。

2.  **フォルダカラムコンテナ (`#folder_columns_container`)**:
    *   メインパネルの右隣に配置される、動的に生成されるフォルダパネル (`.folder_column`) を格納するためのコンテナです。
    *   `position: absolute` で配置され、`overflow-x: auto` によってカラムが増えた際には横スクロールが可能になります。
    *   スタイルは `folder_panel.css` で定義されています。

3.  **フォルダカラム (`.folder_column`)**:
    *   一つのフォルダの中身（子フォルダやメモ）を表示するための単一のパネルです。
    *   フォルダアイコンがクリックされるたびに、`folder_columns.js` によって動的に生成され、`#folder_columns_container` の中に追加されます。

---

## 2. JavaScript (`folder_columns.js`)

フォルダパネルの生成、表示、インタラクションに関するすべてのロジックを担っています。

### `createFolderColumn(folderId, afterColumn)` 関数

このファイルの中核をなす非同期関数です。

*   **役割**: 指定された `folderId` を持つフォルダの情報をサーバーから取得し、その内容を表示するための新しいフォルダパネル (`.folder_column`) を生成・表示します。
*   **引数**:
    *   `folderId`: 中身を表示したいフォルダのID。
    *   `afterColumn`: **「どのパネルからクリックされたか」** を示す基準となるパネル要素。この引数が非常に重要です。

#### 処理の流れ

1.  **古いパネルの削除 (推奨される修正)**
    `afterColumn` が指定されている場合、それは既存のパネルから新しいパネルが開かれようとしていることを意味します。この時、`afterColumn` よりも右側にあるパネルは不要になるため、削除処理を行います。
    ```javascript
    if (afterColumn) {
        // 基準パネルの次以降の兄弟要素（つまり、より右側にある古いパネル）をすべて削除する
        while (afterColumn.nextSibling) {
            afterColumn.nextSibling.remove();
        }
    }
    ```

2.  **データ取得**
    `fetch` を使って `/folders/${folderId}` にリクエストを送り、フォルダのJSONデータ（名前、子要素のリストなど）を取得します。
    ```javascript
    const response = await fetch(`/folders/${folderId}`);
    const folder = await response.json();
    ```

3.  **パネル要素の生成**
    `document.createElement('div')` で新しい `.folder_column` を作成し、`innerHTML` を使ってヘッダーやコンテンツ表示エリアの骨格を挿入します。

4.  **子要素の表示**
    取得した `folder.children` をループ処理し、それぞれの子フォルダやメモのアイコンを `.folder_show_content` の中に生成して追加します。

5.  **再帰的なイベントリスナー**
    新しく生成したパネル内のアイコン (`.folder-icon`) にもクリックイベントリスナーを追加します。ここでクリックが発生すると、**自分自身 (`createFolderColumn`) を再度呼び出します**。
    ```javascript
    // ...
    // パネル生成のための関数にクリックした子フォルダのidと、「親パネル」自身を渡す
    createFolderColumn(childIcon.dataset.folderId, column);
    ```
    この時、第2引数 `afterColumn` に現在のパネル (`column`) を渡すことで、「どのパネルの右に新しいパネルを作るか」という情報を伝達しています。これが無限の階層掘り下げ（ドリルダウン）を可能にしている仕組みです。

6.  **各種ボタンの機能実装**
    *   **閉じるボタン**: クリックされたパネル (`column`) そのものを `.remove()` でDOMから削除します。
    *   **追加ボタン**: 「メモ」と「フォルダ」の選択肢を表示/非表示に切り替えます。
    *   **新規フォルダ作成**: 新しいフォルダアイコンと入力欄を生成し、入力完了後にサーバーにPOSTリクエストを送信してフォルダを永続化します。

---

## 3. CSS (`folder_panel.css` / `top.css`)

`folder_columns.js` によって生成されたHTML要素の見た目とレイアウトを定義しています。

### レイアウトのポイント

*   **カラムコンテナ (`#folder_columns_container`)**
    *   `display: flex;` によって、追加された `.folder_column` を横一列に並べます。
    *   `overflow-x: auto;` によって、コンテナの幅を超える数のカラムが追加された場合に横スクロールバーを表示します。
    *   `position: absolute;` と `left: 34%;` によって、`#main_panel` のすぐ右隣に配置されます。

*   **単一カラム (`.folder_column`)**
    *   `flex: 0 0 30%;` は、Flexコンテナ内で「伸びない(`0`)、縮まない(`0`)、ベースの幅は親要素の`30%`」という強力な指定です。これにより、各カラムは常に同じ幅を保ちます。

*   **カラムヘッダー (`.folder_buttons_header`)**
    *   ここでも `display: flex;` を使い、中の要素（フォルダ名、ボタン）を横に並べています。

*   **フォルダ名 (`.folder_name_label`)**
    *   `flex: 1;` が重要な役割を果たします。これは「利用可能な残りのスペースをすべて占有する」という意味です。
    *   この指定により、`.folder_name_label` が左側で可能な限り広がり、結果として後続のボタン類 (`.add_menu_wrapper`, `.close_button`) がヘッダーの右端に押しやられます。

*   **追加ボタンラッパー (`.add_menu_wrapper`)**
    *   `top.css` では汎用的なスタイルとして `position: absolute` が定義されていますが、フォルダパネル内ではレイアウトが崩れる原因となります。
    *   そのため、`folder_panel.css` で `position: static;` と指定し、`absolute` の効果を打ち消しています。
    *   そして、`margin-left: auto;` を使うことで、左側のフォルダ名との間に自動でスペースを作り、自身を右寄せにしています。

*   **子要素コンテンツ (`.folder_show_content`)**
    *   `display: grid;` と `grid-template-columns: repeat(4, ...);` を使うことで、子フォルダのアイコンを綺麗な4列のグリッド状に並べています。

---

## 4. まとめ

*   **イベント駆動**: ユーザーのクリック操作を起点に、JavaScriptが動的にHTML要素を生成・削除します。
*   **データフロー**: `(クライアント) クリック → (JS) fetchリクエスト → (サーバー) JSONレスポンス → (JS) DOM操作` という流れで画面が更新されます。
*   **再帰的構造**: `createFolderColumn` 関数が自身を呼び出すことで、無限の階層構造に対応しています。
*   **CSSレイアウト**: `Flexbox` と `Grid` を適切に使い分けることで、レスポンシブで堅牢なレイアウトを実現しています。特に `flex: 1` や `margin: auto` の使い方が、要素の右寄せ・左寄せの鍵となっています。