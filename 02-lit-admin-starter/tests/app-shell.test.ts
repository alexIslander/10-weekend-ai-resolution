import { beforeEach, describe, expect, it } from 'vitest'

import '../src/main.ts'

describe('app-shell', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('renders the login screen by default', async () => {
    const element = document.createElement('app-shell')
    document.body.append(element)
    await customElements.whenDefined('app-shell')
    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    expect(element.shadowRoot?.querySelector('login-card')).not.toBeNull()
  })

  it('restores the persisted theme on connect', async () => {
    localStorage.setItem('dashboard-theme', 'light')

    const element = document.createElement('app-shell')
    document.body.append(element)
    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    expect(element.getAttribute('theme')).toBe('light')
  })

  it('shows the dashboard after a successful login submit', async () => {
    const element = document.createElement('app-shell')
    document.body.append(element)
    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    const loginCard = element.shadowRoot?.querySelector('login-card') as HTMLElement & {
      shadowRoot: ShadowRoot
      updateComplete: Promise<void>
    }

    const form = loginCard.shadowRoot.querySelector('form')
    expect(form).not.toBeNull()

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await loginCard.updateComplete
    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    expect(element.shadowRoot?.querySelector('top-navbar')).not.toBeNull()
    expect(element.shadowRoot?.querySelector('dashboard-boundary')).not.toBeNull()
  })

  it('switches to the customers feature after navigation', async () => {
    const element = document.createElement('app-shell')
    document.body.append(element)
    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    const loginCard = element.shadowRoot?.querySelector('login-card') as HTMLElement & {
      shadowRoot: ShadowRoot
      updateComplete: Promise<void>
    }

    loginCard.shadowRoot.querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )

    await loginCard.updateComplete
    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    const sidebar = element.shadowRoot?.querySelector('app-sidebar')
    sidebar?.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { page: 'customers' },
        bubbles: true,
        composed: true,
      })
    )

    await (element as HTMLElement & { updateComplete: Promise<void> }).updateComplete

    expect(element.shadowRoot?.querySelector('customers-boundary')).not.toBeNull()
  })
})
