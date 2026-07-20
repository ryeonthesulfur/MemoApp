Rails.application.routes.draw do
 resources :memos, only: [ :create, :show, :update ]
 root "top#index"
end
