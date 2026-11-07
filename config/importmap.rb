# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin "window"
pin "top"
pin "select"
pin "memo_saving"
pin "show_panel"
pin "folder_saving"
pin "folder_columns"
pin "sound"
pin "marble"
pin "background"
pin "webamp", preload: false # 約2MBあるので、全ページで先読みせず、「音」を開いた時だけ sound.js から読み込む
# 背景のビジュアライザー(ambient_background.js)で使う3Dの部品。背景を「ビジュアライザー」にした時だけ読み込むので、先読みしない
pin "three", preload: false # @0.160.0
pin "three-room-environment", preload: false # three の追加部品(金属の映り込み用の景色)。vendor/javascript に手で置いた
pin "ambient_background", preload: false
