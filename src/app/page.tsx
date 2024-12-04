'use client';

import Weather from '@/components/Weather';
import Energy from '@/components/Energy';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Home Automation Dashboard</h1>
        
        {/* Energy Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Energy Monitoring</h2>
          <Energy />
        </section>

        {/* Weather Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Weather Information</h2>
          <Weather />
        </section>
      </div>
    </main>
  );
}
