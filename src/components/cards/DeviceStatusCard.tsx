'use client';

import React from 'react';

export default function DeviceStatusCard() {
  const devices = [
    { name: 'Living Room Lights', status: 'On', type: 'light' },
    { name: 'Kitchen Thermostat', status: 'Active', type: 'thermostat' },
    { name: 'Front Door Lock', status: 'Locked', type: 'security' },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Device Status</h3>
      </div>
      <div className="space-y-3">
        {devices.map((device, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{device.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{device.type}</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
              {device.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 