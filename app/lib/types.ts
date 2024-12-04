export interface MetricData {
  timestamp: Date;
  value: number;
  type: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface DataCollector {
  collect(): Promise<MetricData>;
  validate(data: MetricData): boolean;
  store(data: MetricData): Promise<void>;
} 