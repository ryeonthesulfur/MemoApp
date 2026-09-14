class Memo < ApplicationRecord
  belongs_to :folder, optional: true # ▲▲▲ どのフォルダに属してるか(無くてもいい=ルート直下もあり得る)

  # 「folder.rb」の「new_memo.title = Memo.next_copy_name(memo.title, new_folder.id)」から呼ばれる。
  # 同じfolder_idを持つ兄弟の中で、ベース名の"_copy(N)"のうち最大のNを探し、その+1を使った名前を返す
  # (Folder#deep_duplicateが、複製したフォルダの中のメモに名前を付ける時に使う)
  def self.next_copy_name(base_title, folder_id)
    base = base_title.to_s.sub(/_copy\(\d+\)\z/, "")
    max_n = where(folder_id: folder_id)
              .where("title LIKE ?", "#{base}_copy(%")
              .filter_map { |m| m.title[/_copy\((\d+)\)\z/, 1]&.to_i }
              .max || 0
    "#{base}_copy(#{max_n + 1})"
  end
end
