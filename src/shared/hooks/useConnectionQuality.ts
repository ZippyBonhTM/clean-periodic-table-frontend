'use client';

import { useEffect, useState } from 'react';

type ConnectionQuality = 'wifi' | 'limited' | 'unknown';

type NetworkInformationLike = {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

function resolveConnectionQuality(connection: NetworkInformationLike | undefined): ConnectionQuality {
  if (connection === undefined) {
    return 'unknown';
  }

  const connectionType = connection.type?.toLowerCase();
  const effectiveType = connection.effectiveType?.toLowerCase();

  if (connection.saveData === true) {
    return 'limited';
  }

  if (connectionType === 'wifi' || connectionType === 'ethernet') {
    return 'wifi';
  }

  if (effectiveType !== undefined && ['slow-2g', '2g', '3g'].includes(effectiveType)) {
    return 'limited';
  }

  if (effectiveType === '4g' || effectiveType === '5g') {
    return 'wifi';
  }

  return 'unknown';
}

function useConnectionQuality(): ConnectionQuality {
  const [quality, setQuality] = useState<ConnectionQuality>('unknown');

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const connection = (
      navigator as Navigator & {
        connection?: NetworkInformationLike;
      }
    ).connection;

    const updateQuality = () => {
      setQuality(resolveConnectionQuality(connection));
    };

    updateQuality();

    connection?.addEventListener?.('change', updateQuality);

    return () => {
      connection?.removeEventListener?.('change', updateQuality);
    };
  }, []);

  return quality;
}

export default useConnectionQuality;
export type { ConnectionQuality };
