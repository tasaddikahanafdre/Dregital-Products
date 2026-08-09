import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PublicSettings } from '../types';

const EMPTY: PublicSettings = {
  deliveryChargeInsideDhaka: 0,
  deliveryChargeOutsideDhaka: 0,
  video: { url: '', type: 'none', thumbnailUrl: null },
};

export function useSettings() {
  const [settings, setSettings] = useState<PublicSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PublicSettings>('/settings');
      setSettings(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { settings, loading, error, reload };
}
