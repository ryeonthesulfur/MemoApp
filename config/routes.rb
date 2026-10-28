Rails.application.routes.draw do
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
 root "top#index"
 get "memory", to: "top#memory" # サイドバー「憶」のページ
 get "sound", to: "top#sound"   # サイドバー「音」のページ
end
