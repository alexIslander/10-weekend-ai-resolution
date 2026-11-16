import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { until } from 'lit/directives/until.js';

export const AppTemplate = (state) => html`
  <header>
    <nav aria-label="Primary">
      <a href="/" aria-current=${state.route === '/' ? 'page' : 'false'}>Home</a>
      <a href="/about" aria-current=${state.route === '/about' ? 'page' : 'false'}>About</a>
      <a href="/list" aria-current=${state.route === '/list' ? 'page' : 'false'}>List</a>
    </nav>
  </header>

  <main>
    ${state.route === '/' ? html`<h1>Welcome Home</h1><p>Standalone lit-html app.</p>` : ''}

    ${state.route === '/about'
      ? html`
          <h1>About Us</h1>
          <p>${until(state.dataPromise, html`<span>Loading heavy data...</span>`)}</p>
        `
      : ''}

    ${state.route === '/list'
      ? html`
          <h1>Product List</h1>
          <ul>
            ${repeat(
              state.items,
              (item) => item,
              (item, index) => html`
                <li @click=${function onItemClick() {
                  this.handleItemClick(item);
                }}>
                  ${index + 1}: ${item} (Click me)
                </li>
              `
            )}
          </ul>
        `
      : ''}
  </main>
`;
