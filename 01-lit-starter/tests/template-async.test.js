import { describe, expect, it } from 'vitest';
import { render } from 'lit';
import { AppTemplate } from '../src/templates/app.js';

describe('App template async state', () => {
  it('shows resolved about content from until directive', async () => {
    const host = {
      handleItemClick() {}
    };
    const root = document.createElement('div');
    const state = {
      route: '/about',
      items: [],
      dataPromise: Promise.resolve('Async Data Loaded Successfully!')
    };

    render(AppTemplate(state), root, { host });
    await state.dataPromise;
    await Promise.resolve();

    expect(root.textContent).toContain('About Us');
    expect(root.textContent).toContain('Async Data Loaded Successfully!');
  });
});
