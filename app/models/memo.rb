class Memo < ApplicationRecord
  belongs_to :folder, optional: true # ▲▲▲ どのフォルダに属してるか(無くてもいい=ルート直下もあり得る)
end
