'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface MigrationResult {
  success: boolean;
  message: string;
  results?: {
    successful: number;
    failed: number;
    total: number;
    currentBatch: {
      start: number;
      size: number;
      processed: number;
    };
    progress: string;
    isComplete: boolean;
    nextBatch: number | null;
  };
  error?: string;
  details?: string;
}

export default function MigrationStatus() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [migrationHistory, setMigrationHistory] = useState<MigrationResult[]>([]);

  // Fetch current migration status
  const { data: migrationStatus, mutate } = useSWR<MigrationResult>(
    isRunning ? `/api/migrations/sqlite?start=${currentBatch}` : null,
    {
      refreshInterval: 0,
      revalidateOnFocus: false
    }
  );

  // Process next batch if available
  useEffect(() => {
    if (migrationStatus && isRunning) {
      setMigrationHistory(prev => [...prev, migrationStatus]);

      if (migrationStatus.success && migrationStatus.results?.nextBatch !== null) {
        // Wait a bit before processing next batch to prevent rate limiting
        setTimeout(() => {
          setCurrentBatch(migrationStatus.results!.nextBatch!);
          mutate();
        }, 1000);
      } else {
        setIsRunning(false);
      }
    }
  }, [migrationStatus, isRunning, mutate]);

  // Start migration
  const startMigration = async () => {
    try {
      setError(null);
      setMigrationHistory([]);
      setCurrentBatch(0);
      setIsRunning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start migration');
      setIsRunning(false);
    }
  };

  // Stop migration
  const stopMigration = () => {
    setIsRunning(false);
  };

  // Calculate total progress
  const totalProgress = migrationHistory.length > 0 
    ? migrationHistory[migrationHistory.length - 1].results?.progress 
    : 'Not started';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">SQLite Migration Status</h2>
        <div className="space-x-2">
          <button
            onClick={startMigration}
            disabled={isRunning}
            className={`px-4 py-2 rounded ${
              isRunning
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Start Migration
          </button>
          <button
            onClick={stopMigration}
            disabled={!isRunning}
            className={`px-4 py-2 rounded ${
              !isRunning
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Stop Migration
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Progress</h3>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-sm text-gray-600">Status: {isRunning ? 'Running' : 'Stopped'}</p>
          <p className="text-sm text-gray-600">Progress: {totalProgress}</p>
          {error && (
            <p className="text-sm text-red-500 mt-2">Error: {error}</p>
          )}
        </div>
      </div>

      {/* Migration History */}
      <div>
        <h3 className="text-lg font-medium mb-2">Migration History</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {migrationHistory.map((result, index) => {
            const start = result.results?.currentBatch?.start ?? 0;
            const processed = result.results?.currentBatch?.processed ?? 0;
            const successful = result.results?.successful ?? 0;
            const failed = result.results?.failed ?? 0;

            return (
              <div
                key={index}
                className={`p-3 rounded text-sm ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <p className="font-medium">
                  Batch {start} - {start + processed}
                </p>
                <p>
                  Success: {successful} | Failed: {failed}
                </p>
                {result.error && <p className="text-red-500">{result.error}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 