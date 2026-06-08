# Lit Developer & Coding Agent Knowledge Base

This document serves as a comprehensive runtime knowledge base and instruction set for an AI coding agent or developer working with **Lit (v2/v3)**. It captures architectural paradigms, concrete syntax patterns, lifecycle execution steps, and strict engineering guardrails required to write performant, bug-free web components.

---

## 1. Architectural Core Paradigm

Lit is a lightweight library built on top of the native web platform standards: **Custom Elements, Shadow DOM, and ES Modules**.

* **Framework Agnostic:** Every Lit component is a standard HTML element. It can be consumed seamlessly in vanilla HTML, React, Vue, Angular, or any other framework.
* **Performance Model:** Data flow is push-based for internal properties and utilizes tagged template literals (`html`) to separate static strings from dynamic expressions. Lit evaluates templates once and selectively updates only the exact DOM nodes that change.

### Component Skeleton (TypeScript Decorators Pattern)

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  // 1. Scoped CSS Styles
  static styles = css`
    :host {
      display: block;
      color: var(--primary-color, #333);
    }
  `;

  // 2. Public Attributes/Properties
  @property({ type: String }) 
  message = 'Hello World';

  // 3. Private/Internal Reactive State
  @state() 
  private _counter = 0;

  // 4. Declarative Template Rendering
  render() {
    return html`
      <p>${this.message}</p>
      <button @click=${this._increment}>Clicks: ${this._counter}</button>
    `;
  }

  private _increment() {
    this._counter++;
  }
}

```

---

## 2. Declarative Templates & Binding Syntax

Lit uses specific prefixes within the `html` tagged template literal to interpret how a variable should be mapped to the DOM.

| Binding Type | Syntax Example | Use Case |
| --- | --- | --- |
| **Text Content** | `<div>${this.text}</div>` | Renders strings, numbers, or sub-templates as text nodes. |
| **Standard Attribute** | `<div id=${this.elementId}></div>` | Binds a string value to an HTML element attribute. |
| **Boolean Attribute** | `<button ?disabled=${this.isDisabled}>` | Adds the attribute if truthy; removes it entirely if falsy. |
| **Property Binding** | `<input .value=${this.inputValue}>` | Direct JavaScript property assignment on the element node. |
| **Event Listener** | `<button @click=${this._onHandler}>` | Registers an event listener on the element. |

### Critical Bindings Rules:

1. **The Boolean Trap (`?`):** In HTML, `disabled="false"` is evaluated as **true** because the presence of the attribute itself signifies truthiness. You **must** use the `?` prefix (`?disabled=${this.isDisabled}`) so Lit completely strips the attribute when the value is falsy.
2. **Property vs Attribute (`.`):** Use the `.` prefix when passing complex data structures (Arrays, Objects) down to subcomponents, or when modifying DOM properties that do not map 1:1 to structural attributes (like `.value` or `.checked` on input elements).

---

## 3. Reactive Properties & State Management

Lit components track internal state using Reactive Properties. When a property changes, an asynchronous update cycle is queued.

### `@property()` vs `@state()`

* **`@property(options)`:** Defines a **public API** for the component. It exposes a JavaScript property and automatically links it to an HTML attribute (e.g., `my-prop` matches `@property() myProp`).
* **`@state()`:** Defines **internal reactive state**. These properties trigger a re-render when mutated but are completely hidden from the external HTML attribute API.

### Mutation Rules for Objects and Arrays

Lit performs a strict shallow inequality check (`oldValue !== newValue`) to determine if a property changed. **Directly mutating an object or an array will not trigger a re-render.**

#### Pattern A: Immutable Updates (Recommended)

```typescript
// Construct a clean instance/reference
this.myArray = [...this.myArray, newItem];

this.myObject = { ...this.myObject, updatedField: 'newValue' };

```

#### Pattern B: Manual Triggering (Alternative)

```typescript
// Mutate directly, then explicitly notify Lit
this.myArray.push(newItem);
this.requestUpdate(); 

```

*Warning: `requestUpdate()` only forces the local component to update. If `this.myArray` is passed as a property down to a subcomponent, that subcomponent will miss the change because the reference did not alter.*

---

## 4. Scoped Styles & Theming

Lit isolates structural styles from the outside ecosystem using Shadow DOM.

### Key Selectors

* **`:host`:** Styles the outermost boundary wrapper of the component itself (e.g., setting display behaviors like `display: block` or `display: flex`).
* **`:host(.active)`:** Styles the wrapper only if it carries the `.active` class externally.
* **`::slotted(selector)`:** Styles elements provided via the Light DOM through `<slot>` tags. It can *only* target the top-level slotted nodes, not nested descendants.

### Best Practices for Styles

1. **Expressions Limitation:** The `css` template tag only accepts expressions that evaluate to a `css` literal or numbers. Strings cannot be arbitrarily injected unless safe-wrapped via `unsafeCSS(str)`.
2. **Performance:** `static styles` evaluate **once per class configuration**, not per component instance. Do not inject per-instance variables into static styles.
3. **Dynamic Customizations:** To inject element-specific style flags, map styles inline within the template using `styleMap` or `classMap`, or rely on CSS Custom Properties:

```typescript
static styles = css`
  :host {
    background-color: var(--component-bg, #ffffff);
  }
`;

```

---

## 5. Lifecycle Hooks

A Lit component relies on two stacked lifecycles: the native Custom Element Lifecycle and the Lit Reactive Update Lifecycle.

### Execution Chronology (First Render Stack)

1. **`constructor()`** -> Initialize default state values. Accessing DOM nodes or reading HTML attributes here is strictly invalid.
2. **`connectedCallback()`** -> Element is injected into the document DOM. Safe for setting global event listeners (`window`, `document`). **Must always execute `super.connectedCallback()**`.
3. **`willUpdate(changedProperties)`** -> Perfect place to compute properties or derive state values relative to incoming attribute modifications before `render()` fires.
4. **`render()`** -> Returns the Lit template result. Must remain entirely pure; no side effects or property writes allowed here.
5. **`firstUpdated(changedProperties)`** -> The element template is rendered into the Shadow tree for the first time. Safe to query DOM targets using `@query` or `this.shadowRoot.getElementById()`.
6. **`updated(changedProperties)`** -> Executes on subsequent data pushes. Used for performing imperative side effects relative to state shifts.

### Teardown Phase

* **`disconnectedCallback()`** -> Element is pulled from the document DOM. You **must** teardown any global event listeners, intervals, or WebSocket subscriptions initialized during the component lifespan to avoid memory leaks.

### Managing Asynchronous Updates

Updates are batched microtasks. If you perform multiple state alterations in one synchronous stack, only a single render loop will trigger. To execute code immediately after the DOM catches up to state shifts, await the `updateComplete` promise:

```typescript
async updateData() {
  this.counter = 5;
  await this.updateComplete; // Wait for the DOM rendering step to complete
  this.dispatchEvent(new CustomEvent('counter-synced'));
}

```

---

## 6. Component Composition & Communication

### Structural Principle: "Properties Down, Events Up"

```
    [ Parent Component ]
       │            ▲
  .data│ (Property) │ @custom-event (Event)
       ▼            │
    [ Child Component ]

```

1. **Passing Data Down:** Always bind variables through declarative attributes or properties inside parent templates. Prefer property binding (`.items=${this.list}`) over imperative method calls (`this.child.setItems()`).
2. **Emitting Events Up:** Components should emit Custom Events to communicate status mutations upstream.

```typescript
// Child component notifying a value block modification
private _notifyChange() {
  this.dispatchEvent(new CustomEvent('value-changed', {
    detail: { value: this.internalValue },
    bubbles: true,    // Allows event to travel up the DOM tree
    composed: true    // Allows event to cross the Shadow DOM boundary
  }));
}

```

### Light DOM Children Management (`<slot>`)

Components can wrap external nodes via the `<slot>` placeholder.

* `<slot></slot>` catches fallback child content.
* Named slots (`<slot name="header"></slot>`) fetch designated nodes matching slot signatures (`<div slot="header">...</div>`).

---

## 7. State Synchronization with Signals (`@lit-labs/signals`)

*Note: `@lit-labs/signals` is currently an experimental ecosystem addition for aligning state with the upcoming ECMAScript Signals specification.*

Signals capture multi-node observable reactive state. They allow deep global shared states to selectively update explicit DOM targets without triggering complete upstream template evaluation.

### Usage Pattern

Apply the `SignalWatcher` mixin pattern to the component definition, then reference your state signal instances directly.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher, signal } from '@lit-labs/signals';

// Globally accessible shared atomic state
export const appThemeSignal = signal('light');

@customElement('themed-element')
export class ThemedElement extends SignalWatcher(LitElement) {
  
  render() {
    // Component automatically registers tracking on appThemeSignal.get()
    return html`
      <div class="panel ${appThemeSignal.get()}">
        Current Theme: ${appThemeSignal.get()}
      </div>
    `;
  }
}

```

### Pinpoint DOM Updating Using `watch()`

To completely bypass the Lit reactive batch cycle and optimize granular text modifications, use the `watch()` directive:

```typescript
import { watch } from '@lit-labs/signals';

render() {
  // Using watch() isolates DOM updates entirely to this specific text node
  return html`<p>Shared Count: ${watch(mySharedCountSignal)}</p>`;
}

```

---

## 8. Critical Coding Agent Guardrails & Best Practices

When building, modifying, or refactoring Lit components, adhere strictly to the following implementation guardrails:

* **DO NOT** use query selectors on the document root (`document.querySelector`) to find internal nodes. Use Lit's scoped property decorator queries (`@query('#id')`) which look inside `this.shadowRoot`.
* **DO NOT** perform state-modifying property mutations inside `render()`, `willUpdate()`, or getters. This creates loop overruns and throws infinite update cycle errors.
* **DO** ensure all event listener bindings within templates point to a structured class method bound to the execution context (`@click=${this._handleClick}`).
* **DO** use the boolean operator syntax `?` for standard attributes that denote state via availability (`disabled`, `checked`, `hidden`, `required`).
* **DO** call `super.connectedCallback()` and `super.disconnectedCallback()` immediately upon overriding native web component lifecycle triggers.
* **DO** sanitize dynamic properties that break static structural constraints using `unsafeCSS` or `unsafeHTML` only if inputs are fully trusted or rigorously sanitized beforehand.