import { create } from 'zustand';
import type { CurrentCoordinates } from '../location/currentLocation';

interface LocationState {
  coordinates: CurrentCoordinates | null;
  setCoordinates: (coordinates: CurrentCoordinates | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coordinates: null,
  setCoordinates: (coordinates) => set({ coordinates }),
}));
