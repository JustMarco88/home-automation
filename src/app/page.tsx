import { Analytics } from '@vercel/analytics/react';
import Weather from '@/components/Weather';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Home Automation Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Energy Consumption Card */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Energy Consumption</h2>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              Chart Coming Soon
            </div>
          </div>

          {/* Gas Usage Card */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Gas Usage</h2>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              Chart Coming Soon
            </div>
          </div>

          {/* Weather Card */}
          <Weather />
        </div>
      </div>
      <Analytics />
    </main>
  );
}
