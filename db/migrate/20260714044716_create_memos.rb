class CreateMemos < ActiveRecord::Migration[8.1]
  def change
    create_table :memos do |t|
      t.timestamps
      t.string :title
      t.text :content
      t.references :folder
      t.string :color
    end
  end
end
