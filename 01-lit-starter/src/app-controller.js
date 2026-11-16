import { render } from 'lit';
import { AppTemplate } from './templates/app.js';

export class App {
  constructor({ root = document.getElementById('app'), initialRoute = window.location.pathname } = {}) {
    this.root = root;
    this.state = {
      route: initialRoute,
      items: ['Apple', 'Banana', 'Cherry'],
      dataPromise: this.fetchData()
    };

    this.update = this.update.bind(this);
    this.navigate = this.navigate.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handlePopState = this.handlePopState.bind(this);

    this.initRouter();
    this.update();
  }

  async fetchData() {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return 'Async Data Loaded Successfully!';
  }

  handleItemClick(item) {
    window.alert(`Selected: ${item}`);
  }

  navigate(path) {
    if (!path || path === this.state.route) {
      return;
    }
    window.history.pushState({}, '', path);
    this.state.route = path;
    this.update();
  }

  handlePopState() {
    this.state.route = window.location.pathname;
    this.update();
  }

  handleDocumentClick(event) {
    const link = event.composedPath().find((el) => el.tagName === 'A');
    if (!link) {
      return;
    }

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) {
      return;
    }

    event.preventDefault();
    this.navigate(href);
  }

  initRouter() {
    window.addEventListener('popstate', this.handlePopState);
    document.addEventListener('click', this.handleDocumentClick);
  }

  destroy() {
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('click', this.handleDocumentClick);
  }

  update() {
    render(AppTemplate(this.state), this.root, { host: this });
  }
}
