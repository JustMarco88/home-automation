'use client';

import React from 'react';

export default function EnergyUsageCard() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Energy Usage</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg dark:bg-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Usage</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">2.4 kW</span>
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg dark:bg-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Today's Total</p>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">18.5 kWh</span>
          </div>
        </div>
      </div>
    </div>
  );
} 