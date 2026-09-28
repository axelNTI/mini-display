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

const randomImage = (): string => {
  return images[Math.floor(Math.random() * images.length)];
};

export default () => {
  const [image, setImage] = useState<string>(randomImage());

  useEffect(() => {
    const update = () => {
      setImage(randomImage());

      const delay = 60 * 1000 - (Date.now() % (60 * 1000));
      timeout = setTimeout(update, delay);
    };

    let timeout = setTimeout(update, 60 * 1000 - (Date.now() % (60 * 1000)));

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      style={{ backgroundImage: `url(${image})` }}
      className="h-screen w-screen grid grid-cols-3 grid-rows-1 p-4 gap-4 bg-cover bg-center"
    >
      <Discord />
      <Clock />
      <Spotify />
    </div>
  );
};
