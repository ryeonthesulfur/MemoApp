Rails.application.routes.draw do
 resources :memos, only: [ :create ]
 root "top#index"
end
