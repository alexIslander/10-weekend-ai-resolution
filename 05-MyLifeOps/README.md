# MyLifeOps

A production-grade Lit & Supabase application for personal productivity and habit tracking.

## Features

- Habit tracking with XP system
- Modular learning approach
- Real-time data synchronization
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your Supabase credentials in `.env`

### Development

Start the development server:
```bash
npm run dev
```

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Documentation

- [Development Guide](docs/development.md)
- [Component API](docs/component-api.md)

## Deployment

This application is designed to deploy to Cloudflare Pages. See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT