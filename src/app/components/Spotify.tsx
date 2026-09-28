import { useEffect } from "react";

import { connectSpotify, restoreSpotifySession } from "../utils/spotify";

export default function Spotify() {
  useEffect(() => {
    let cancelled = false;

    const initializeSpotify = async () => {
      try {
        const restoredTokens = await restoreSpotifySession();
        if (cancelled || restoredTokens) return;
        await connectSpotify();
      } catch (error) {
        if (!cancelled) console.error("Could not initialize Spotify", error);
      }
    };

    void initializeSpotify();
    return () => {
      cancelled = true;
    };
  }, []);

  return <div className="transparent rd-4"></div>;
}
