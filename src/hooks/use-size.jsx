import * as React from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/**
 * Measures an element's rendered box and keeps the value current.
 *
 * Returns `null` until the first measurement so callers can skip work that
 * depends on a known width. The first measurement happens before paint, which
 * lets image transforms request the correct size on the initial render.
 */
export function useSize(ref) {
  const [size, setSize] = React.useState(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref?.current;
    if (!element) return undefined;

    const measure = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      setSize((current) =>
        current && current.width === width && current.height === height
          ? current
          : { width, height },
      );
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

export default useSize;
