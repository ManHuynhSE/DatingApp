import * as Location from 'expo-location';

export interface CurrentCoordinates {
  latitude: number;
  longitude: number;
}

/** Requests foreground access and reads one fresh location fix. */
export async function requestCurrentCoordinates(): Promise<CurrentCoordinates | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.warn('Could not read current location:', error);
    return null;
  }
}
