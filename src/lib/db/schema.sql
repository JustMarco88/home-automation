-- Weather history table
CREATE TABLE IF NOT EXISTS weather_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    temp DECIMAL(5,2) NOT NULL,
    feels_like DECIMAL(5,2) NOT NULL,
    humidity INTEGER NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    -- Additional weather data
    wind_speed DECIMAL(5,2),
    wind_deg INTEGER,
    pressure INTEGER,
    clouds INTEGER,
    rain_1h DECIMAL(5,2),
    snow_1h DECIMAL(5,2),
    -- Location data
    lat DECIMAL(8,6) NOT NULL,
    lon DECIMAL(9,6) NOT NULL,
    location_name TEXT,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB -- Store complete API response for future reference
);

-- Index for efficient time-based queries
CREATE INDEX IF NOT EXISTS idx_weather_history_timestamp ON weather_history (timestamp);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_weather_history_location ON weather_history (lat, lon);

-- Function to clean up old weather data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_weather_history() RETURNS void AS $$
BEGIN
    DELETE FROM weather_history
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create energy prices table
CREATE TABLE IF NOT EXISTS energy_prices (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    price_energy DECIMAL(10, 4),
    p1_counter_energy DECIMAL(10, 4),
    price_gas DECIMAL(10, 4),
    p1_counter_gas DECIMAL(10, 4),
    temperature DECIMAL(5, 2),
    humidity INTEGER,
    clouds INTEGER,
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