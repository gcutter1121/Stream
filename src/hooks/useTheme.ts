import { useState, useEffect } from "react";

export function useTheme() {
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.classList.contains("light")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains("light"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const nowLight = document.documentElement.classList.toggle("light");
    localStorage.setItem("theme", nowLight ? "light" : "dark");
    setIsLight(nowLight);
  };

  return { isLight, toggle };
}
