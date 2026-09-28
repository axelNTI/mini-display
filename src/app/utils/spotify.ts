export const spotifyRedirectUri = "http://127.0.0.1:43821/callback";

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface SpotifyTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export function createCodeVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return encodeBase64Url(bytes);
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
}

function encodeBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createAuthorizationUrl(state: string, challenge: string): string {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error("VITE_SPOTIFY_CLIENT_ID is not configured");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: spotifyRedirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: "user-read-currently-playing user-read-playback-state",
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string, verifier: string): Promise<SpotifyTokens> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error("VITE_SPOTIFY_CLIENT_ID is not configured");

  const body = await requestToken({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: spotifyRedirectUri,
    code_verifier: verifier,
  });

  if (!body.access_token || !body.refresh_token || !body.expires_in || !body.token_type || !body.scope) {
    throw new Error("Spotify returned an incomplete token response");
  }

  return body as SpotifyTokens;
}

export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error("VITE_SPOTIFY_CLIENT_ID is not configured");

  const body = await requestToken({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  if (!body.access_token || !body.expires_in || !body.token_type || !body.scope) {
    throw new Error("Spotify returned an incomplete refreshed token response");
  }

  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token ?? refreshToken,
    expires_in: body.expires_in,
    token_type: body.token_type,
    scope: body.scope,
  };
}

async function requestToken(params: URLSearchParams | Record<string, string>): Promise<SpotifyTokenResponse> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const responseText = await response.text();
  let body: SpotifyTokenResponse = {};
  try {
    body = JSON.parse(responseText);
  } catch {
    // Keep the raw response text in the error below.
  }

  if (!response.ok) {
    const reason = body.error_description || body.error || responseText || response.statusText;
    throw new Error(`Spotify token request failed (${response.status}): ${reason}`);
  }

  return body;
}
