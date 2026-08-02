class AddForeignKeyToMemosFolderId < ActiveRecord::Migration[8.1]
  def change
    add_foreign_key :memos, :folders
  end
end
