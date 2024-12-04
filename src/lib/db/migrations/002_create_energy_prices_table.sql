-- Create energy prices table
CREATE TABLE IF NOT EXISTS energy_prices (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL UNIQUE,
    price_energy DECIMAL(10, 4),
    p1_counter_energy DECIMAL(10, 4),
    price_gas DECIMAL(10, 4),
    p1_counter_gas DECIMAL(10, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_energy_prices_timestamp ON energy_prices (timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_energy_prices_updated_at
    BEFORE UPDATE ON energy_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 