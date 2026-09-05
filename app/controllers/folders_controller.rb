class FoldersController < ApplicationController
  def create
    folder = Folder.new(folder_params)

    if folder.save
      render json: folder, status: :created
    else
      render json: folder.errors, status: :unprocessable_entity
    end
  end

  def show
    @folder = Folder.find(params[:id])
    render json: @folder.as_json(include: [ :children, :memos ]) # ▲▲▲ 子フォルダに加えて、このフォルダの中のメモも一緒に返す
  end

  def update
    @folder = Folder.find(params[:id])
    if @folder.update(folder_params)
      render json: @folder
    else
      render json: @folder.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @folder = Folder.find(params[:id])
    @folder.destroy
    head :no_content
  end

  private

  def folder_params
    params.require(:folder).permit(:name, :color, :parent_id)
  end
end
