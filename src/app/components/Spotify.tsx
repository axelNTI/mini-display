import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";

import {
  createAuthorizationUrl,
  createCodeChallenge,
  createCodeVerifier,
  exchangeCode,
  refreshAccessToken,
  type SpotifyTokens,
} from "../utils/spotify";

export default function Spotify() {
  const [restoring, setRestoring] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState("Spotify not connected");
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const refreshToken = await invoke<string | null>("load_spotify_refresh_token");
        if (!refreshToken) return;

        setStatus("Restoring Spotify session");
        const restoredTokens = await refreshAccessToken(refreshToken);
        await invoke("store_spotify_refresh_token", {
          refreshToken: restoredTokens.refresh_token,
        });

        if (!cancelled) {
          setTokens(restoredTokens);
          setStatus("Connected to Spotify");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Could not restore Spotify session");
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = async () => {
    setConnecting(true);
    setStatus("Waiting for Spotify authorization");

    let unlistenCallback: (() => void) | undefined;
    let unlistenTimeout: (() => void) | undefined;
    const stopListening = () => {
      unlistenCallback?.();
      unlistenTimeout?.();
    };

    try {
      const verifier = createCodeVerifier();
      const state = createCodeVerifier();
      const challenge = await createCodeChallenge(verifier);

      unlistenCallback = await listen<string>("spotify-auth-callback", ({ payload }) => {
        stopListening();
        void (async () => {
          try {
            const callback = new URL(payload);
            if (callback.searchParams.get("state") !== state) {
              throw new Error("Spotify authorization state did not match");
            }

            const authorizationError = callback.searchParams.get("error");
            if (authorizationError) throw new Error(`Spotify authorization failed: ${authorizationError}`);

            const code = callback.searchParams.get("code");
            if (!code) throw new Error("Spotify callback did not include an authorization code");

            const tokens = await exchangeCode(code, verifier);
            await invoke("store_spotify_refresh_token", {
              refreshToken: tokens.refresh_token,
            });
            setTokens(tokens);
            setStatus("Connected to Spotify");
          } catch (error) {
            setStatus(error instanceof Error ? error.message : "Spotify authorization failed");
          } finally {
            setConnecting(false);
          }
        })();
      });
      unlistenTimeout = await listen("spotify-auth-timeout", () => {
        stopListening();
        setStatus("Spotify authorization timed out");
        setConnecting(false);
      });

      await invoke("start_spotify_callback");
      await openUrl(createAuthorizationUrl(state, challenge));
    } catch (error) {
      stopListening();
      setStatus(error instanceof Error ? error.message : "Could not start Spotify authorization");
      setConnecting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center transparent rd-4">
      <p className="text-2xl">{status}</p>
      {!tokens?.refresh_token && (
        <button
          className="mt-4 px-5 py-3 rounded bg-green-500 text-black disabled:opacity-50"
          disabled={connecting || restoring}
          onClick={() => void connect()}
          type="button"
        >
          {restoring ? "Restoring..." : connecting ? "Connecting..." : "Connect Spotify"}
        </button>
      )}
    </div>
  );
}
