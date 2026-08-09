class TopController < ApplicationController
  def index
    @memos = Memo.all
    @folders = Folder.where(parent_id: nil)
  end
end
