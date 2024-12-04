import { db } from './db';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  timestamp: number;
  wind_speed?: number;
  wind_deg?: number;
  pressure?: number;
  clouds?: number;
  rain_1h?: number;
  snow_1h?: number;
}

// Rate limit: 60 calls per minute = 1 call per second to be safe
const MIN_TIME_BETWEEN_CALLS = 1000; // 1 second in milliseconds
let lastCallTime = 0;

async function saveWeatherHistory(weatherData: any, lat: number, lon: number) {
  const query = `
    INSERT INTO weather_history (
      timestamp,
      temp,
      feels_like,
      humidity,
      description,
      icon,
      wind_speed,
      wind_deg,
      pressure,
      clouds,
      rain_1h,
      snow_1h,
      lat,
      lon,
      location_name,
      raw_data
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
  `;

  const values = [
    new Date(weatherData.dt * 1000), // Convert Unix timestamp to Date
    weatherData.main.temp,
    weatherData.main.feels_like,
    weatherData.main.humidity,
    weatherData.weather[0].description,
    weatherData.weather[0].icon,
    weatherData.wind?.speed,
    weatherData.wind?.deg,
    weatherData.main.pressure,
    weatherData.clouds?.all,
    weatherData.rain?.['1h'],
    weatherData.snow?.['1h'],
    lat,
    lon,
    weatherData.name,
    weatherData // Store complete response
  ];

  try {
    await db.query(query, values);
  } catch (error) {
    console.error('Error saving weather history:', error);
    // Don't throw error to avoid breaking the API response
  }
}

export async function fetchWeatherData(): Promise<WeatherData> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < MIN_TIME_BETWEEN_CALLS) {
    throw new Error('Rate limit: Please wait before making another request');
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenWeather API key is not configured');
  }

  try {
    lastCallTime = now;
    
    // Default to Amsterdam coordinates - you can make this configurable
    const lat = 52.3676;
    const lon = 4.9041;
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Save complete weather data to database
    await saveWeatherHistory(data, lat, lon);
    
    // Return simplified data for the frontend
    return {
      temp: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: now,
      wind_speed: data.wind?.speed,
      wind_deg: data.wind?.deg,
      pressure: data.main.pressure,
      clouds: data.clouds?.all,
      rain_1h: data.rain?.['1h'],
      snow_1h: data.snow?.['1h'],
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
} 