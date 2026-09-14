# `private`メソッドを別インスタンスから呼んでエラーになったバグ、解説  260914

`Folder#deep_duplicate`(フォルダの再帰的複製)を実際に動かしてみたところ、出てきたエラーの解説。

---

## 1. 実際に出たエラー

```
private method `duplicate_into' called for #<Folder id: 52, name: "旅行", parent_id: 51, ...>
```

「`duplicate_into`という`private`メソッドが、`Folder`(id: 52, name: "旅行")というオブジェクトに対して呼ばれたけど、それはできない」というエラー。

---

## 2. 原因のコード

```ruby
class Folder < ApplicationRecord
  # ...

  private

  def duplicate_into(target_parent_id)
    # ...
    children.each { |child| child.duplicate_into(new_folder.id) }
    # ...
  end
end
```

`duplicate_into`は`private`(24行目以降)に置かれていた。ところが、その中で

```ruby
child.duplicate_into(new_folder.id)
```

という形で、**`child`という、自分(`self`)とは別のインスタンスに対して**、`.`を付けて明示的に呼び出している。

---

## 3. なぜこれがダメなのか(Rubyの`private`のルール)

Rubyの`private`は、「**このメソッドは、`レシーバ.メソッド名`という書き方(明示的なレシーバ付き)では呼べない**」というルール。呼べるのは、レシーバを省略して(暗黙的に自分自身に対して)呼ぶ場合だけ。

```ruby
class Foo
  private

  def secret
    "秘密"
  end

  def call_secret
    secret        # OK。レシーバを省略してるので、暗黙的に self.secret ということになり、許される
    self.secret   # ← 実はこれも、Ruby 2.7以降は「selfの場合に限り」OKになった特例
  end
end

foo = Foo.new
foo.secret        # NG。「foo.」という、selfじゃない明示的なレシーバを付けて呼んでるのでエラー
```

今回のコードでは、`child.duplicate_into(...)`の`child`は、`self`(今処理中のフォルダ)とは**別の**`Folder`インスタンス。なので「self以外の、明示的なレシーバを付けた呼び出し」に該当し、`private`のルールに引っかかってエラーになった。

**同じクラスのインスタンス同士だから許されるのでは?と思うかもしれないが、Rubyの`private`は「同じクラスかどうか」ではなく「レシーバを省略してるかどうか(≒selfに対する呼び出しかどうか)」だけを見ている。**

---

## 4. 直し方

`duplicate_into`を`private`の外に出す(=公開メソッドにする)。

```ruby
class Folder < ApplicationRecord
  # ...

  # ▲▲▲ children.each { |child| child.duplicate_into(...) } のように、別のインスタンス(child)に対して
  # 明示的に呼び出す必要があるため、private にはできない
  def duplicate_into(target_parent_id)
    # ...
  end
end
```

このメソッドは「再帰の中でしか使わない、内部的な処理」ではあるものの、その再帰自体が「別インスタンスへの明示的な呼び出し」を必要とする構造になっているため、Rubyの`private`の仕組みとは相性が悪い。今回は素直に公開メソッドとして扱うことにした。

---

## まとめ

- Rubyの`private`は「レシーバを省略して(≒selfに対して)呼べるかどうか」で判断される。同じクラスかどうかは関係ない
- `children.each { |child| child.何か }`のように、コレクションの中の**別インスタンス**に対してメソッドを呼びたい場合、そのメソッドは`private`にできない
- 実際に動かして初めて見つかったバグだった。「コードを書いただけでは気づけない種類のエラー」の実例として、動作確認の重要性も示している
