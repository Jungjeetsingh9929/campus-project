import { useEffect } from 'react';
import { fetchAnalytics, fetchBuildings, fetchComplaints, fetchEnergy, fetchWifi } from '../api/campusApi';
import {
  analyticsSeries,
  campusBuildings,
  complaints as seededComplaints,
  energySnapshots,
  wifiAccessPoints,
} from '../data/campus';
import { useCampusStore } from '../store/campusStore';
import { useAuthStore } from '../store/authStore';
import { isDemoFallbacksEnabled } from '../api/client';

export function CampusHydrator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrateFromApi = useCampusStore((state) => state.hydrateFromApi);
  const setApiStatus = useCampusStore((state) => state.setApiStatus);
  const enableLiveApi = import.meta.env.VITE_ENABLE_LIVE_API === 'true';

  useEffect(() => {
    if (!isAuthenticated || !enableLiveApi) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const [buildings, complaints, wifi, energy, analytics] = await Promise.all([
          fetchBuildings(campusBuildings as any),
          fetchComplaints(seededComplaints as any),
          fetchWifi(wifiAccessPoints as any),
          fetchEnergy(energySnapshots as any),
          fetchAnalytics({
            CampusBuildings: campusBuildings.length,
            Complaints: seededComplaints.length,
            WifiAccessPoints: wifiAccessPoints.length,
          }),
        ]);

        if (!cancelled) {
          hydrateFromApi({
            buildings,
            complaints,
            wifiAccessPoints: wifi,
            energy,
            analytics,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Campus API is unavailable.';
        setApiStatus('offline', isDemoFallbacksEnabled() ? null : message);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enableLiveApi, hydrateFromApi, isAuthenticated, setApiStatus]);

  return null;
}
