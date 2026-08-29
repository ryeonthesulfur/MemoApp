Rails.application.routes.draw do
 resources :memos, only: [ :create, :show, :update ]
 resources :folders, only: [ :create, :show, :update ]
 root "top#index"
end
