/**
 * Minimal, standards-based client-side router.
 * URLPattern matches routes and the Navigation API intercepts same-origin
 * navigations (link clicks, back / forward) with built-in focus and scroll handling.
 * Named path parameters (e.g. /positions/:oll) are passed to the routed
 * component as attributes.
 * Non-matching URLs fall through to regular browser navigation.
 * Reloads also fire an interceptable navigate event — intercepting would turn
 * them into same-document re-renders with stale modules and in-memory state,
 * so they are skipped and reach the browser as full document reloads.
 */
export const initRouter = (outlet, routeConfig) => {
    const routes = routeConfig.map(({ path, component }) => ({
        pattern: new URLPattern({ pathname: path }),
        component
    }));

    const render = url => {
        const match = routes
            .map(({ pattern, component }) => ({ result: pattern.exec(url), component }))
            .find(({ result }) => result);
        if (!match) return false;
        var routeComponent = document.createElement(match.component);
        Object.entries(match.result.pathname.groups)
            .filter(([, value]) => value !== undefined)
            .forEach(([name, value]) => routeComponent.setAttribute(name, value));
        outlet.replaceChildren(routeComponent);
        // an intercepted navigation never reaches the browser's own fragment
        // scrolling, so a deep link such as /scores#board-random-test is
        // scrolled here, after the routed element has rendered
        if (url.hash) {
            const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
            target?.scrollIntoView({ block: 'start' });
        }
        return true;
    };

    navigation.addEventListener('navigate', event => {
        if (!event.canIntercept || event.hashChange || event.downloadRequest) return;
        if (event.navigationType === 'reload') return;
        const url = new URL(event.destination.url);
        if (!routes.some(({ pattern }) => pattern.test(url))) return;
        event.intercept({ handler: () => { render(url); } });
    });

    render(new URL(location.href));
}
