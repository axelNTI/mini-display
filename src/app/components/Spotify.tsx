import { useEffect, useState } from "react";
import useSpotifySession from "../hooks/useSpotifySession";

export default () => {
  const [playerState, setPlayerState] = useState<any>(null);

  const { tokens } = useSpotifySession();

  console.log(tokens);

  useEffect(() => {
    if (!tokens) return;

    const updatePlayer = async () => {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens?.access_token}` },
      });

      const data = await response.json();
      console.log(data);
      setPlayerState(data);
    };

    void updatePlayer();
  }, [tokens]);

  return (
    <div className="transparent rd-4">
      {playerState && (
        <div>
          <img
            src={playerState.item?.album?.images[0]?.url}
            alt={playerState.item?.name}
            className="rounded-lg"
          />
          <p>{playerState.item?.name}</p>
          <p>{playerState.item?.artists.map((artist: any) => artist.name).join(", ")}</p>
        </div>
      )}
    </div>
  );
};
