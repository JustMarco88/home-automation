# Home Automation

A comprehensive energy monitoring and automation solution built with Next.js and deployed on Vercel.

## Features

- Real-time energy consumption monitoring
- Environmental metrics integration
- Weather data integration
- Automated control capabilities

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/JustMarco88/home-automation.git
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- Next.js 14
- TypeScript
- TailwindCSS
- Neon PostgreSQL
- Vercel KV

## Project Structure

```
app/
├── api/          # API routes
├── components/   # Reusable components
├── lib/         # Utility functions and configurations
└── (routes)/    # App routes and pages
```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database
DATABASE_URL=

# API Keys
OPENWEATHER_API_KEY=
NETATMO_CLIENT_ID=
NETATMO_CLIENT_SECRET=
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request
