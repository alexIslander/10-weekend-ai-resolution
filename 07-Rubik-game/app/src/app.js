/**
 * Application entry point that initializes routing and state persistence.
 * To deactivate localStorage persistence, comment out or remove the store.subscribe() block.
 */
import { initRouter } from "./router.js";
import './SiteHeader.js';
import './quiz/boundary/Dashboard.js';
import './quiz/boundary/NameGate.js';
import './quiz/boundary/Run.js';
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
    { path: '/', component: 'q-dashboard' },
    // the run view has its own route: the dashboard offers it as a link, and a
    // reload of a run in progress must land on the run, not on the dashboard
    { path: '/run', component: 'q-run' },
    { path: '/stats', component: 'q-stats' },
    { path: '/scores', component: 'q-scores' }
]);
console.log("router initialized");
