Rails.application.routes.draw do
 resources :memos, only: [ :create, :show, :update, :destroy ]
 resources :folders, only: [ :create, :show, :update, :destroy ]
 root "top#index"
end
