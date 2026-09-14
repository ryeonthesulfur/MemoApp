class MemosController < ApplicationController
  before_action :set_memo, only: [ :show, :update, :destroy, :duplicate ]

  def create
    memo = Memo.new(memo_params)

    if memo.save
      render json: memo, status: :created
    else
      render json: memo.errors, status: :unprocessable_entity
    end
  end

  # ▲▲▲ このメモを、同じfolder_idの中に複製する(名前の重複はMemo.next_copy_nameが避けてくれる)
  def duplicate
    new_memo = @memo.dup  # 「@memo」は、コピー対象となる大元のメモインスタンス。dupで複製して、new_memoに入れる。
    new_memo.title = Memo.next_copy_name(@memo.title, @memo.folder_id)

    if new_memo.save
      render json: new_memo, status: :created
    else
      render json: new_memo.errors, status: :unprocessable_entity
    end
  end

  def show
    render json: @memo
  end

  def update
    if @memo.update(memo_params)
      render json: @memo
    else
      render json: @memo.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @memo.destroy
    head :no_content
  end

private

  def memo_params
    params.require(:memo).permit(:content, :title, :color, :folder_id) # ▲▲▲ folder_idを追加(これが無いと、JSから送ってもStrong Parametersで無視されてしまう)
  end

  def set_memo
    @memo = Memo.find(params[:id])
  end
end
