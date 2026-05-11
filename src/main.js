import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import 'bootstrap-icons/font/bootstrap-icons.css'

const init = () => {
    createApp(App).mount('#app')
};

if (window.cordova) {
    document.addEventListener('deviceready', init, false);
} else {
    init();
}
