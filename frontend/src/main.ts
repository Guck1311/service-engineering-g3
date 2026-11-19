// Global styles: our Bootstrap theme (SCSS) and the Bootstrap icon font.
import './styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { errorHandling } from './plugins/error-handling'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// After Pinia: the error handlers show their messages through the notifications store.
app.use(errorHandling, { router })

app.mount('#app')
