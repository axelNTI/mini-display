import { useEffect, useState } from "react";

export default () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const update = () => {
      setTime(new Date());

      const delay = 1000 - (Date.now() % 1000);
      timeout = setTimeout(update, delay);
    };

    let timeout = setTimeout(update, 1000 - (Date.now() % 1000));

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center transparent rd-4">
      <p
        className="
        font-mono
        text-[9rem]
        leading-none
        font-300
        tracking-[-0.06em]
        tabular-nums
        select-none
      "
      >
        {time.toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
      </p>

      <p className="mt-6 text-3xl opacity-50 tracking-widest uppercase select-none">
        {time.toLocaleDateString("sv-SE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
    </div>
  );
};
