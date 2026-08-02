Rails.application.routes.draw do
 resources :memos, only: [ :create, :show, :update ]
 resources :folders, only: [ :create, :show ]
 root "top#index"
end
