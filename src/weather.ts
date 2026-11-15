import * as Location from 'expo-location';

export type WeatherResult = { status: 'ok'; tempC: number } | { status: 'denied' } | { status: 'error' };

/** Today's forecast high from Open-Meteo using coarse location (foreground only). */
export async function fetchTodayHigh(): Promise<WeatherResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { status: 'denied' };
    const pos = await Location.getLastKnownPositionAsync() ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const { latitude, longitude } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&daily=temperature_2m_max&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return { status: 'error' };
    const json = (await res.json()) as { daily?: { temperature_2m_max?: number[] } };
    const t = json.daily?.temperature_2m_max?.[0];
    return typeof t === 'number' ? { status: 'ok', tempC: Math.round(t) } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}
