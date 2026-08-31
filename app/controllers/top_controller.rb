class TopController < ApplicationController
  def index
    @memos = Memo.where(folder_id: nil) # ▲▲▲ フォルダ内のメモがメインパネルにも重複して出てしまうのを防ぐ(Folderのparent_idと同じ考え方)
    @folders = Folder.where(parent_id: nil)
  end
end
