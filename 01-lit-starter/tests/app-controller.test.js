import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { App } from '../src/app-controller.js';

describe('App controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders home route initially', () => {
    const app = new App();
    expect(document.querySelector('h1')?.textContent).toContain('Welcome Home');
    app.destroy();
  });

  it('navigates to list without full reload', () => {
    const app = new App();
    app.navigate('/list');
    expect(window.location.pathname).toBe('/list');
    expect(document.querySelector('h1')?.textContent).toContain('Product List');
    app.destroy();
  });

  it('intercepts internal anchor clicks through the document listener', () => {
    const app = new App();

    const aboutLink = document.querySelector('a[href="/about"]');
    expect(aboutLink).not.toBeNull();

    aboutLink?.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true
      })
    );

    expect(window.location.pathname).toBe('/about');
    expect(document.querySelector('h1')?.textContent).toContain('About Us');
    app.destroy();
  });

  it('re-renders from location changes on popstate', () => {
    const app = new App();

    window.history.pushState({}, '', '/about');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(window.location.pathname).toBe('/about');
    expect(document.querySelector('h1')?.textContent).toContain('About Us');
    app.destroy();
  });

  it('calls alert on list item click through host event scope', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const app = new App();
    app.navigate('/list');

    const listItem = document.querySelector('li');
    expect(listItem).not.toBeNull();

    listItem?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(alertSpy).toHaveBeenCalledWith('Selected: Apple');
    app.destroy();
  });
});
