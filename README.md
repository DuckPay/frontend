# DuckPay Frontend

DuckPay is a modern payment management system with a beautiful and intuitive user interface.

## Tech Stack

- **React 19** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm package manager

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/          # React Context providers
├── i18n/              # Internationalization files
├── pages/             # Page components
├── utils/             # Utility functions
├── App.jsx            # Root component
├── main.jsx           # Application entry point
└── index.css          # Global styles
```

## Features

- User authentication and authorization
- Dashboard with payment statistics
- Payment records management
- Category management
- Responsive design
- Real-time updates

## Development

### Code Style

- Use ESLint and Prettier for code linting and formatting
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling

### Testing

```bash
pnpm test
```

## License

MIT
