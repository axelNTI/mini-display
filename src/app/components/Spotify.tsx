import useSpotifySession from "../hooks/useSpotifySession";

export default function Spotify() {
  const { tokens } = useSpotifySession();

  console.log(tokens);

  return <div className="transparent rd-4"></div>;
}
