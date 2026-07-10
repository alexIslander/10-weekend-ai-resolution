import { signal } from '@lit-labs/signals';

// Signals for global state management
export const currentViewSignal = signal<'home' | 'module-detail'>('home');
export const activeModuleIdSignal = signal<string | null>(null);
export const currentUserSignal = signal<{ id: string } | null>(null);

/**
 * Navigate to a specific view with optional module ID
 * @param view The view to navigate to
 * @param moduleId Optional module ID to activate
 */
export function navigateTo(
  view: 'home' | 'module-detail',
  moduleId?: string
): void {
  currentViewSignal.value = view;
  if (moduleId) {
    activeModuleIdSignal.value = moduleId;
  }
}