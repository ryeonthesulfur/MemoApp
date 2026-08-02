class Folder < ApplicationRecord
  belongs_to :parent, class_name: "Folder", optional: true
  has_many :children, class_name: "Folder", foreign_key: "parent_id"
end


=begin

belongs_to :parent, class_name: 'Folder', optional: true:

「parent_idはFolder自身を指してますよ」という指定。
optional: trueは「親が無い(ルート直下の)フォルダもあり得る」という意味です
(無いと、親が無いフォルダを保存しようとした時にバリデーションエラーになります)


has_many :children, class_name: 'Folder', foreign_key: 'parent_id': 逆に「自分の子フォルダ一覧」を取れるようにする指定

=end
