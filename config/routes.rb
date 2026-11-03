Rails.application.routes.draw do
  root "top#index"
 resources :memos, only: [ :create, :show, :update, :destroy ] do
   member do
     post :duplicate
   end
 end
 resources :folders, only: [ :create, :show, :update, :destroy ] do
   member do
     post :duplicate
   end
 end
  get "memory", to: "top#memory"
  get "sound",  to: "top#sound"
end
