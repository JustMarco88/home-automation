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