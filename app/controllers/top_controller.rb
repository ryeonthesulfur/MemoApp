class TopController < ApplicationController
  def index
    @memos = Memo.all
  end
end
