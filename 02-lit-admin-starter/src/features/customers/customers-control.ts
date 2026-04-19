import {
  type Customer,
  type CustomerDraft,
  emptyCustomerDraft,
  seedCustomers,
} from './customer-entity'

type StatusFilter = 'All' | Customer['health']

function cloneDraft(draft: CustomerDraft): CustomerDraft {
  return { ...draft }
}

function toDraft(customer: Customer): CustomerDraft {
  return {
    id: customer.id,
    name: customer.name,
    company: customer.company,
    email: customer.email,
    tier: customer.tier,
    owner: customer.owner,
    seats: String(customer.seats),
    monthlyRevenue: String(customer.monthlyRevenue),
    health: customer.health,
    priority: customer.priority,
  }
}

function toCustomer(draft: CustomerDraft): Customer {
  return {
    id: draft.id.trim() || `CUS-${Math.floor(1000 + Math.random() * 9000)}`,
    name: draft.name.trim(),
    company: draft.company.trim(),
    email: draft.email.trim(),
    tier: draft.tier,
    owner: draft.owner.trim(),
    seats: Number.parseInt(draft.seats, 10) || 0,
    monthlyRevenue: Number.parseInt(draft.monthlyRevenue, 10) || 0,
    health: draft.health,
    priority: draft.priority,
  }
}

export class CustomersControl {
  private readonly notify: () => void
  private customers = [...seedCustomers]
  private search = ''
  private statusFilter: StatusFilter = 'All'
  private draft = cloneDraft(emptyCustomerDraft)
  private editingId: string | null = null
  private formVisible = false

  constructor(notify: () => void) {
    this.notify = notify
  }

  get view() {
    const query = this.search.trim().toLowerCase()
    const filtered = this.customers.filter((customer) => {
      const matchesQuery =
        query.length === 0 ||
        [customer.name, customer.company, customer.email, customer.owner]
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        this.statusFilter === 'All' || customer.health === this.statusFilter

      return matchesQuery && matchesStatus
    })

    const monthlyRevenue = filtered.reduce((sum, customer) => sum + customer.monthlyRevenue, 0)
    const priorityCount = filtered.filter((customer) => customer.priority).length

    return {
      customers: filtered,
      search: this.search,
      statusFilter: this.statusFilter,
      draft: this.draft,
      editingId: this.editingId,
      formVisible: this.formVisible,
      stats: {
        totalCustomers: filtered.length,
        monthlyRevenue,
        priorityCount,
      },
    }
  }

  setSearch(value: string) {
    this.search = value
    this.notify()
  }

  setStatusFilter(value: StatusFilter) {
    this.statusFilter = value
    this.notify()
  }

  startCreate() {
    this.editingId = null
    this.draft = cloneDraft(emptyCustomerDraft)
    this.formVisible = true
    this.notify()
  }

  startEdit(id: string) {
    const customer = this.customers.find((entry) => entry.id === id)
    if (!customer) {
      return
    }

    this.editingId = id
    this.draft = toDraft(customer)
    this.formVisible = true
    this.notify()
  }

  cancelEdit() {
    this.editingId = null
    this.formVisible = false
    this.draft = cloneDraft(emptyCustomerDraft)
    this.notify()
  }

  updateDraft<K extends keyof CustomerDraft>(field: K, value: CustomerDraft[K]) {
    this.draft = {
      ...this.draft,
      [field]: value,
    }
    this.notify()
  }

  saveDraft() {
    const nextCustomer = toCustomer(this.draft)
    if (!nextCustomer.name || !nextCustomer.company || !nextCustomer.email || !nextCustomer.owner) {
      return
    }

    if (this.editingId) {
      this.customers = this.customers.map((customer) =>
        customer.id === this.editingId ? nextCustomer : customer
      )
    } else {
      this.customers = [nextCustomer, ...this.customers]
    }

    this.cancelEdit()
  }

  deleteCustomer(id: string) {
    this.customers = this.customers.filter((customer) => customer.id !== id)
    if (this.editingId === id) {
      this.cancelEdit()
      return
    }
    this.notify()
  }

  togglePriority(id: string) {
    this.customers = this.customers.map((customer) =>
      customer.id === id ? { ...customer, priority: !customer.priority } : customer
    )
    this.notify()
  }
}
