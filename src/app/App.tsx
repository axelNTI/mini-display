import { useEffect, useState } from "react";

import Clock from "@/app/components/Clock";
import Discord from "@/app/components/Discord";
import Spotify from "@/app/components/Spotify";

import image1 from "@/app/images/image1.jpeg";
import image2 from "@/app/images/image2.jpeg";
import image3 from "@/app/images/image3.jpeg";
import image4 from "@/app/images/image4.jpeg";
import image5 from "@/app/images/image5.jpeg";
import image6 from "@/app/images/image6.jpeg";
import image7 from "@/app/images/image7.jpeg";
import image8 from "@/app/images/image8.png";
import image9 from "@/app/images/image9.jpeg";
import image10 from "@/app/images/image10.jpeg";
import image11 from "@/app/images/image11.jpeg";
import image12 from "@/app/images/image12.jpeg";
import image13 from "@/app/images/image13.jpeg";
import image14 from "@/app/images/image14.jpeg";
import image15 from "@/app/images/image15.jpeg";

const images = [
  image1,
  image2,
  image3,
  image4,
  image5,
  image6,
  image7,
  image8,
  image9,
  image10,
  image11,
  image12,
  image13,
  image14,
  image15,
];

const randomImage = (): string => images[Math.floor(Math.random() * images.length)];

const preloadImage = async (src: string) => {
  const image = new Image();
  image.src = src;
  await image.decode().catch(() => {});
};

export default () => {
  const [imagesState, setImagesState] = useState<[string, string]>(() => {
    const first = randomImage();
    return [first, first];
  });

  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = async () => {
      const next = randomImage();

      // Make sure the next image is fully loaded before showing it.
      await preloadImage(next);

      setImagesState((current) => {
        const nextState = [...current] as [string, string];
        nextState[1 - active] = next;
        return nextState;
      });

      // Crossfade to the newly loaded image.
      setActive((current) => 1 - current);

      const delay = 60 * 1000 - (Date.now() % (60 * 1000));
      timeout = setTimeout(update, delay);
    };

    let timeout = setTimeout(update, 60 * 1000 - (Date.now() % (60 * 1000)));

    return () => clearTimeout(timeout);
  }, [active]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          active === 0 ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${imagesState[0]})` }}
      />

      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
          active === 1 ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${imagesState[1]})` }}
      />

      <div className="relative z-10 grid h-full w-full grid-cols-3 grid-rows-1 gap-4 p-4">
        <Discord />
        <Clock />
        <Spotify />
      </div>
    </div>
  );
};