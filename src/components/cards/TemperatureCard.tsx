'use client';

import React from 'react';

export default function TemperatureCard() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Temperature & Humidity</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg dark:bg-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Temperature</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">21.5°C</span>
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg dark:bg-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">45%</span>
          </div>
        </div>
      </div>
    </div>
  );
} 