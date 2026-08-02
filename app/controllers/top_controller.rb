class TopController < ApplicationController
  def index
    @memos = Memo.all
    @folders = Folder.all
  end
end
