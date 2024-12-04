# Home Automation Dashboard

A comprehensive energy monitoring and automation solution built with Next.js and deployed on Vercel.

## Features

- Real-time energy consumption monitoring
- Gas usage tracking
- Environmental metrics integration
- Weather data integration
- Automated control capabilities

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS
- **Database**: Vercel Postgres
- **Caching**: Vercel KV
- **Charts**: Chart.js with react-chartjs-2
- **Analytics**: Vercel Analytics
- **Real-time Updates**: SWR

## Prerequisites

- Node.js 18.17 or later
- npm
- Vercel account (for deployment)

## Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd home-automation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   POSTGRES_URL=
   KV_URL=
   KV_REST_API_URL=
   KV_REST_API_TOKEN=
   KV_REST_API_READ_ONLY_TOKEN=
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── metrics/
│   │   ├── automation/
│   │   └── auth/
│   └── page.tsx
└── lib/
    ├── db.ts
    └── cache.ts
```

## Development

- **API Routes**: Located in `src/app/api/`
- **Database**: Database utilities in `src/lib/db.ts`
- **Caching**: Caching utilities in `src/lib/db.ts`
- **Frontend**: Main dashboard in `src/app/page.tsx`

## Deployment

The application is configured for deployment on Vercel:

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
