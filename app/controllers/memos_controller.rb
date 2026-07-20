class MemosController < ApplicationController
  before_action :set_memo, only: [ :show, :update ]

  def create
    memo = Memo.new(memo_params)

    if memo.save
      render json: memo, status: :created
    else
      render json: memo.errors, status: :unprocessable_entity
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


private

  def memo_params
    params.require(:memo).permit(:content, :title, :color)
  end

  def set_memo
    @memo = Memo.find(params[:id])
  end
end
