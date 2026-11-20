import * as React from "react";
import { cn } from "@/lib/utils";
import { ResponsiveImage } from "./responsive-image";
import {
  IMAGE_LOAD_MODE,
  getOriginalImageUrl,
  nextImageLoadMode,
  parseWixMediaUrl,
} from "./image-helpers";

/**
 * Renders an image.
 *
 * Canonical public media URLs are served through the transform pipeline so the
 * browser gets a correctly sized `srcset`. Anything else — external links,
 * data URLs, relative paths — renders as a plain `<img>`. If the transform
 * pipeline fails the component degrades to the original URL and then to a
 * bare element rather than showing nothing.
 */
export const Image = React.forwardRef(function Image(
  {
    src,
    alt = "",
    className,
    fittingType = "fill",
    focalPointX,
    focalPointY,
    quality = 80,
    onError,
    ...props
  },
  ref,
) {
  const parsed = React.useMemo(() => parseWixMediaUrl(src), [src]);
  const [mode, setMode] = React.useState(IMAGE_LOAD_MODE.OPTIMIZED);

  React.useEffect(() => {
    setMode(IMAGE_LOAD_MODE.OPTIMIZED);
  }, [src]);

  const handleError = (event) => {
    if (mode !== IMAGE_LOAD_MODE.FALLBACK) {
      setMode((current) => nextImageLoadMode(current));
    }
    onError?.(event);
  };

  const focalPoint =
    focalPointX != null || focalPointY != null
      ? { x: focalPointX ?? 0.5, y: focalPointY ?? 0.5 }
      : undefined;

  if (parsed && mode === IMAGE_LOAD_MODE.OPTIMIZED) {
    return (
      <ResponsiveImage
        ref={ref}
        src={src}
        parsed={parsed}
        alt={alt}
        className={className}
        fittingType={fittingType}
        focalPoint={focalPoint}
        quality={quality}
        onError={handleError}
        {...props}
      />
    );
  }

  return (
    <img
      ref={ref}
      src={getOriginalImageUrl(src, parsed)}
      alt={alt}
      className={cn(className)}
      onError={handleError}
      style={{ objectFit: fittingType === "fit" ? "contain" : "cover" }}
      {...props}
    />
  );
});

Image.displayName = "Image";

export default Image;
