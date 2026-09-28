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
    <div className="transparent">
      <p>{time.toTimeString().split(" ")[0]}</p>
    </div>
  );
};
