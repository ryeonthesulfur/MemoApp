# Railsの`dup`と、`id`が決まるタイミングの解説  260913

フォルダ・メモのコピー機能を作る中で出てきた、「複製した`id`はどうなるか」についてのまとめ。

---

## 0. お題にするコード

```ruby
new_folder = dup
new_folder.parent_id = target_parent_id
new_folder.name = self.class.next_copy_name(name, target_parent_id)
new_folder.save!

memos.each do |memo|
  new_memo = memo.dup
  new_memo.folder_id = new_folder.id
  new_memo.title = Memo.next_copy_name(memo.title, new_folder.id)
  new_memo.save!
end
```

---

## 1. `dup`とは何か

**`dup`は、Rubyの標準機能で「今のオブジェクトの中身をコピーした、新しいオブジェクトを作る」というメソッド。**

Railsの`ActiveRecord`(DBのレコードを表すオブジェクト)にも使えて、`name`・`color`のような**中身の属性はコピーする**が、以下の2つは**コピーしない**という特別な扱いになっている。

- `id`(主キー、レコードを一意に識別する番号)
- `created_at` / `updated_at`(作成・更新日時)

```ruby
folder = Folder.find(1)  # 例: id=1, name="写真", color="color-blue" のフォルダ
new_folder = folder.dup

new_folder.id         # => nil (まだ何も入っていない)
new_folder.name       # => "写真" (コピーされている)
new_folder.color      # => "color-blue" (コピーされている)
new_folder.persisted? # => false (まだDBに保存されていない)
```

---

## 2. なぜ`id`はコピーされないのか

**`id`は「DBの中で、このレコードが世界に1つだけであること」を保証する番号。** もし`dup`が`id`までコピーしてしまうと、元のレコードと同じ`id`を持つレコードが2つ存在することになり、「どっちが本物か分からない」状態になってしまう。

なので`dup`は、`id`だけは意図的に空にして返す。これにより、`dup`した直後のオブジェクトは「中身は元と同じだが、まだDBのどこにも存在しない、真っさらな新規レコード」という状態になる。

---

## 3. `id`が実際に決まる瞬間

`id`が決まるのは、`dup`した時ではなく、**`save`(または`save!`)を呼んでDBに実際に保存された、その瞬間**。

```ruby
new_folder = dup       # ① この時点では new_folder.id は nil
new_folder.save!       # ② ここでDBに1行追加され、SQLiteが「今まで使われてない、次の番号」を自動で割り当てる
                        #    この瞬間から new_folder.id に、新しい番号が入っている
```

DB(SQLite)側が、テーブルの中で今まで使われたことのない番号を自動的に採番する。人間やRailsのコードが番号を決めているわけではない。

---

## 4. タイムラインで見る

```
① new_folder = dup                      new_folder.id => nil
        │
        ▼
② new_folder.parent_id = ...            まだ new_folder.id => nil
   new_folder.name = ...
        │
        ▼
③ new_folder.save!                      ここでDBに保存され、
        │                                new_folder.id に新しい番号が入る(例: 42)
        ▼
④ new_memo.folder_id = new_folder.id    new_folder.id はもう 42 になっているので、
                                          正しく「42番のフォルダに属するメモ」として設定できる
```

---

## 5. もし順番を間違えたら、何が起きるか

もし③(`save!`)より前に④(`new_folder.id`を使う行)を書いてしまったら、どうなるか。

```ruby
new_folder = dup
new_memo.folder_id = new_folder.id  # ← まだ save! していないので、new_folder.id はまだ nil
new_folder.save!
```

この場合、`new_memo.folder_id`には`nil`が入ってしまう。結果、複製されたメモは「どのフォルダにも属さない、ルート直下のメモ」として保存されてしまい、本来入るべきフォルダの中に入らない、という不具合になる。

**教訓**: `id`を使いたい行は、必ず`save`(または`save!`)より後に書く。

---

## まとめ

| タイミング | `id`の状態 |
|---|---|
| `dup`した直後 | `nil`(空。DBにまだ存在しない) |
| `save!`を呼んだ後 | DBが自動で割り当てた、新しい一意な番号が入っている |

`dup`は中身をコピーするが`id`はコピーしない。`id`が実際に決まるのは、DBに保存される(`save!`が成功する)瞬間。この順番を意識しないと、「まだ決まっていない`id`」を先に使おうとして、`nil`のまま処理が進んでしまう。
