'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TemperatureCard from '@/components/cards/TemperatureCard';
import EnergyUsageCard from '@/components/cards/EnergyUsageCard';
import DeviceStatusCard from '@/components/cards/DeviceStatusCard';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <TemperatureCard />
        <EnergyUsageCard />
        <DeviceStatusCard />
      </div>
    </DashboardLayout>
  );
} 