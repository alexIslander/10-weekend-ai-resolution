/**
 * Application entry point that initializes routing and state persistence.
 * To deactivate localStorage persistence, comment out or remove the store.subscribe() block.
 */
import { initRouter } from "./router.js";
import './SiteHeader.js';
import './quiz/boundary/Play.js';
import './quiz/boundary/Scores.js';
import './quiz/boundary/Stats.js';
import store from "./store.js";
import { save } from "./localstorage/control/StorageControl.js";

/**
 * To deactivate localStorage persistence, comment out or remove the store.subscribe() block below.
 */
store.subscribe(_ => {
    const state = store.getState();
    save(state);
})
initRouter(document.querySelector('.view'), [
    { path: '/', component: 'q-play' },
    { path: '/stats', component: 'q-stats' },
    { path: '/scores', component: 'q-scores' }
]);
console.log("router initialized");
