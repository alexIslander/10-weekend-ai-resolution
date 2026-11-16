export type CustomerTier = 'Enterprise' | 'Growth' | 'Starter'
export type CustomerHealth = 'Healthy' | 'At Risk' | 'New'

export interface Customer {
  id: string
  name: string
  company: string
  email: string
  tier: CustomerTier
  owner: string
  seats: number
  monthlyRevenue: number
  health: CustomerHealth
  priority: boolean
}

export interface CustomerDraft {
  id: string
  name: string
  company: string
  email: string
  tier: CustomerTier
  owner: string
  seats: string
  monthlyRevenue: string
  health: CustomerHealth
  priority: boolean
}

export const emptyCustomerDraft: CustomerDraft = {
  id: '',
  name: '',
  company: '',
  email: '',
  tier: 'Starter',
  owner: '',
  seats: '1',
  monthlyRevenue: '0',
  health: 'New',
  priority: false,
}

export const seedCustomers: Customer[] = [
  {
    id: 'CUS-1024',
    name: 'Alice Chen',
    company: 'Northstar Health',
    email: 'alice@northstar.example',
    tier: 'Enterprise',
    owner: 'Morgan Lee',
    seats: 128,
    monthlyRevenue: 12400,
    health: 'Healthy',
    priority: true,
  },
  {
    id: 'CUS-1042',
    name: 'Marcus Reid',
    company: 'BrightLine Commerce',
    email: 'marcus@brightline.example',
    tier: 'Growth',
    owner: 'Taylor Shaw',
    seats: 42,
    monthlyRevenue: 4300,
    health: 'At Risk',
    priority: true,
  },
  {
    id: 'CUS-1061',
    name: 'Sofia Patel',
    company: 'Atlas Cloud',
    email: 'sofia@atlas.example',
    tier: 'Enterprise',
    owner: 'Morgan Lee',
    seats: 92,
    monthlyRevenue: 9600,
    health: 'Healthy',
    priority: false,
  },
  {
    id: 'CUS-1108',
    name: 'Emma Wilson',
    company: 'Signal Forge',
    email: 'emma@signalforge.example',
    tier: 'Starter',
    owner: 'Devon Price',
    seats: 12,
    monthlyRevenue: 820,
    health: 'New',
    priority: false,
  },
]
