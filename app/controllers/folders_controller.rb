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
    render json: @folder.as_json(include: [ :children ])
  end

  private

  def folder_params
    params.require(:folder).permit(:name, :color, :parent_id)
  end
end
