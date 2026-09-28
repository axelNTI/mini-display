import { useEffect, useState } from "react";

import { connectSpotify, refreshSpotifySession, restoreSpotifySession, type SpotifyTokens } from "../utils/spotify";

export default function useSpotifySession() {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeSpotify = async () => {
      try {
        const restoredTokens = await restoreSpotifySession();
        if (cancelled) return;
        if (restoredTokens) {
          setTokens(restoredTokens);
          return;
        }

        const connectedTokens = await connectSpotify();
        if (!cancelled) setTokens(connectedTokens);
      } catch (error) {
        if (!cancelled) console.error("Could not initialize Spotify", error);
      }
    };

    void initializeSpotify();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!tokens) return;

    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const refresh = async () => {
      try {
        const refreshedTokens = await refreshSpotifySession(tokens.refresh_token);
        if (!cancelled) setTokens(refreshedTokens);
      } catch (error) {
        if (!cancelled) {
          console.error("Could not refresh Spotify access token", error);
          timeout = setTimeout(refresh, 30_000);
        }
      }
    };

    const refreshBeforeExpiryMs = Math.max((tokens.expires_in - 60) * 1000, 1000);
    timeout = setTimeout(refresh, refreshBeforeExpiryMs);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [tokens]);

  return { tokens };
}
