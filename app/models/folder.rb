class Folder < ApplicationRecord
  belongs_to :parent, class_name: "Folder", optional: true
  has_many :children, class_name: "Folder", foreign_key: "parent_id", dependent: :destroy
  has_many :memos, dependent: :destroy # ▲▲▲ このフォルダの中にあるメモ一覧を取れるようにする＋親フォルダを消すと中身も消す。

  # ▲▲▲ このフォルダを、中身(子フォルダ・メモ)ごと再帰的に複製する。複製先の親は元と同じ(parent_id)。
  # 途中で失敗した場合に中途半端な複製が残らないよう、全体を1つのtransactionで囲む。
  def deep_duplicate
    ActiveRecord::Base.transaction do
      duplicate_into(parent_id)
    end
  end

  # 同じparent_idを持つ兄弟の中で、ベース名の"_copy(N)"のうち最大のNを探し、その+1を使った名前を返す
  def self.next_copy_name(base_name, parent_id)
    base = base_name.to_s.sub(/_copy\(\d+\)\z/, "")
    max_n = where(parent_id: parent_id)
              .where("name LIKE ?", "#{base}_copy(%")
              .filter_map { |f| f.name[/_copy\((\d+)\)\z/, 1]&.to_i }
              .max || 0
    "#{base}_copy(#{max_n + 1})"
  end

  # 指定したparent_idの下に自分自身（大元のフォルダ）のコピーを1個作り、その後、中にmemos・childrenを再帰的に複製していく
  # ▲▲▲ children.each { |child| child.duplicate_into(...) } のように、別のインスタンス(child)に対して
  # 明示的に呼び出す必要があるため、private にはできない(Rubyのprivateは基本、自分自身への暗黙のselfでしか呼べない)
  def duplicate_into(target_parent_id)
    new_folder = dup
    new_folder.parent_id = target_parent_id   # 最初は、大元のフォルダからの複製なので、nil。その後は、「大元のフォルダ_copy(N)」のidが入る。
    new_folder.name = self.class.next_copy_name(name, target_parent_id)
    new_folder.save!

    # 大元のフォルダや、その中にある子フォルダの中のメモを、複製先の新しいフォルダにコピーする
    memos.each do |memo|
      new_memo = memo.dup
      new_memo.folder_id = new_folder.id
      new_memo.title = Memo.next_copy_name(memo.title, new_folder.id)
      new_memo.save!
    end

    children.each { |child| child.duplicate_into(new_folder.id) }

    new_folder
  end
end


=begin

belongs_to :parent, class_name: 'Folder', optional: true:

「parent_idはFolder自身を指してますよ」という指定。
optional: trueは「親が無い(ルート直下の)フォルダもあり得る」という意味です
(無いと、親が無いフォルダを保存しようとした時にバリデーションエラーになります)


has_many :children, class_name: 'Folder', foreign_key: 'parent_id': 逆に「自分の子フォルダ一覧」を取れるようにする指定

=end
