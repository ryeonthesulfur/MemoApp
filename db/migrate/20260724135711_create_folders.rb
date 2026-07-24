class CreateFolders < ActiveRecord::Migration[8.1]
  def change
    create_table :folders do |t|
      t.string :name
      t.references :parent, foreign_key: { to_table: :folders }
      t.string :color
      t.timestamps
    end
  end
end


=begin

- `t.references :parent` → `parent_id`カラムを自動で作る(渡した名前に`_id`が付く)
- `foreign_key: { to_table: :folders }` → 「`parent_id`に入れていい値は、
`folders`テーブルに実在する`id`だけ」という制約を付ける。`to_table: :folders`は、
「参照先は`folders`ですよ」と明示するためのもの
(何も書かないと、Railsは`parent`という名前から`parents`という無いテーブルを参照先だと推測してしまうため)

=end
