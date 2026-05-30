# ER図・テーブル設計

---

## テーブル一覧

### `FOLDER`（フォルダ）
| 型       | カラム名      | 制約 | 説明                            
| :------- | :---------- | :--- | :------------------------------ 
| `bigint` | `id`        | PK   | フォルダID                      
| `string` | `name`      |      | フォルダ名                      
| `bigint` | `parent_id` | FK   | 親フォルダID（最上位はNULL）    
| `string` | `color`     |      | フォルダのテーマ色（HEXコード） 


### `MEMO`（メモ）
| 型       | カラム名      | 制約   | 説明                               
| :------- | :---------- | :--- | :--------------------------------- 
| `bigint` | `id`        | PK   | メモID                             
| `string` | `title`     |      | タイトル                           
| `text`   | `content`   |      | 本文（テキスト）                   
| `bigint` | `folder_id` | FK   | 所属フォルダID（Root配置はNULL）   
| `string` | `color`     |      | メモ個別のアイコン色（HEXコード）  


### `FILE_ASSET`（ファイルアセット）
| 型       | カラム名      | 制約 | 説明                                                       
| :------- | :---------- | :--- | :--------------------------------------------------------- 
| `bigint` | `id`        | PK   | ファイルアセットID                                         
| `bigint` | `folder_id` | FK   | 所属先のフォルダID（★Root配置、つまりメモと同列のものはNULL） 
| `string` | `color`     |      | ファイル個別のアイコン・枠線色（HEXコード）                


### `DIARY_ENTRY`（絵日記）
| 型       | カラム名             | 制約 | 説明                                 
| :------- | :----------------- | :--- | :------------------------------------
| `bigint` | `id`               | PK   | 絵日記ID                              
| `date`   | `date`             |      | 【カレンダー連携】対象の日付（一意）  
| `text`   | `content`          |      | 【文章パネル】日記の本文              
| `text`   | `recall`           |      | 【想起パネル】思い出した記憶や内省    
| `string` | `brain_music`      |      | 【絵日記専用】背景BGM                 
| `string` | `current_location` |      | 【気象連動】位置情報                  
| `float`  | `temperature`      |      | 【気象連動】気温（°C）               
| `float`  | `humidity`         |      | 【気象連動】湿度（%）                 
| `float`  | `precipitation`    |      | 【気象連動】降水確率（%）             
| `float`  | `wind_speed`       |      | 【気象連動】風速（m/s）               
| `string` | `weather`          |      | 【気象連動】お天気状態                
| `float`  | `pressure`         |      | 【気象連動】気圧（hPa）               


### `AS_ATTACHMENT`（紐付けテーブル）
Active Storageによるポリモーフィック関連を管理します。

| 型       | カラム名        | 制約 | 説明                                                         
| :------- | :------------ | :--- | :----------------------------------------------------------- 
| `bigint` | `id`          | PK   | 紐付け俯瞰管理ID                                                 
| `string` | `record_type` |      | 標準カラム（`Folder` / `Memo` / `FileAsset` / `DiaryEntry`）
| `bigint` | `record_id`   |      | 標準カラム（対象レコードのID）                          
| `bigint` | `blob_id`     | FK   | AS_BLOBのID（外部キー）                        


### `AS_BLOB`（外部ファイル）
Active Storageがファイルの実体（メタデータ）を管理します。

| 型       | カラム名         | 制約 | 説明                 
| :------- | :------------- | :--- | :------------------- 
| `bigint` | `id`           | PK   | ファイル実体ID       
| `string` | `filename`     |      | オリジナルファイル名 
| `string` | `content_type` |      | MIMEタイプ          
| `bigint` | `byte_size`    |      | ファイルサイズ       

---

## テーブル間のリレーション

| リレーション                                                         | 説明                                                
| :----------------------------------------------------------------- | :------------------------------------------------------
| `FOLDER` → `FOLDER`                                                | `parent_id` による自己参照（子フォルダ）           
| `MEMO` → `FOLDER`                                                  | `folder_id` で所属フォルダを参照                     
| `FILE_ASSET` → `FOLDER`                                            | `folder_id` で所属フォルダを参照                     
| `AS_ATTACHMENT` → `AS_BLOB`                                        | `blob_id` でファイル実体を参照                      
| `AS_ATTACHMENT` ↔ `MEMO` / `FOLDER` / `FILE_ASSET` / `DIARY_ENTRY` | `record_type` + `record_id` によるポリモーフィック関連     


## アソシエーション

### Folder
- belongs_to :parent, class_name: "Folder", foreign_key: "parent_id", optional: true    # 自身が属する「親フォルダ」を取得
（belongs_to :parent: 自分（子）が属している親 を取得するための関連付け。）

- has_many   :children, class_name: "Folder", foreign_key: "parent_id"  # 自身を親とする「子フォルダ」を取得
（has_many :children: 自分（親）が持っている子 を取得するための関連付け。）

- has many :memos
- has many :file_assets
- has many :attachments (ポリモーフィック / AS_ATTACHMENT経由)

### Memo
- belongs_to :folder (optional: true)
- has many :attachments (ポリモーフィック / 埋め込みファイル)

### FileAsset
- belongs_to :folder (optional: true)
- has one :attachment (ポリモーフィック / 外部ファイル本体のIDを紐付ける)

### DiaryEntry
- has many :attachments (ポリモーフィック / 視覚パネル 画像・動画)

### AsAttachment (AS_ATTACHMENT)
- belongs_to :record (各モデルに紐づくレコードを指す: Folder / Memo / FileAsset / DiaryEntry)
- belongs_to :blob (AS_BLOB)

### AsBlob (AS_BLOB)
- has many :attachments (AS_ATTACHMENT)


複数モデルにおける関係をAS_ATTACHMENTで一元俯瞰管理