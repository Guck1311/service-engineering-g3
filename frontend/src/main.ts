import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/main.scss';

import {createPinia} from 'pinia';
import {createApp} from 'vue';

import {setUserIdProvider} from './api/http';
import App from './App.vue';
import router from './router';
import {useNotificationsStore} from './stores/notifications';
import {useSessionStore} from './stores/session';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// The HTTP client sends the selected user as X-User-Id.
const session = useSessionStore();
setUserIdProvider(() => session.currentUserId);

// Last line of defence: errors that no component handled become a toast.
app.config.errorHandler = (error, _instance, info) => {
  console.error(`Unhandled error (${info}):`, error);
  useNotificationsStore().error(error);
};

app.mount('#app');
