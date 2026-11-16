import { icons } from '../icons'

export type AppPage = 'dashboard' | 'customers' | 'orders' | 'analytics' | 'settings'

export interface NavItem {
  id: AppPage
  label: string
  icon: keyof typeof icons
  description: string
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    description: 'Operational overview and KPIs',
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'users',
    description: 'Manage accounts, tiers, and owners',
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'orders',
    description: 'Track recent transactions and status',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'analytics',
    description: 'Review revenue and demand trends',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    description: 'Tune workspace preferences and policies',
  },
]

export const defaultPage: AppPage = 'dashboard'

export function getPageMeta(page: AppPage) {
  return navItems.find((item) => item.id === page) ?? navItems[0]
}
