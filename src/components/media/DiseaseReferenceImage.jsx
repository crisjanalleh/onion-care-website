import { ImageOff } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { DISEASE_IMAGE_PLACEHOLDER } from "@/lib/domain/media";

/**
 * Shows a disease reference photograph only when one has been verified.
 * Otherwise a neutral placeholder names the disease — never a picture of a
 * different problem, and never an AI illustration posing as evidence.
 */
export default function DiseaseReferenceImage({ diseaseName, asset, className, compact = false }) {
  if (asset?.fileUrl) {
    return (
      <figure className={cn("overflow-hidden rounded-md border border-border", className)}>
        <Image
          src={asset.fileUrl}
          alt={asset.altText || `Reference photograph of ${diseaseName}`}
          className={compact ? "aspect-[16/9] w-full" : "aspect-[4/3] w-full"}
          fittingType="fill"
        />
        {!compact && (asset.caption || asset.attribution) ? (
          <figcaption className="border-t border-border bg-card px-3 py-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
            {asset.caption ? <span className="block">{asset.caption}</span> : null}
            {asset.attribution ? <span className="block">Source: {asset.attribution}</span> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-secondary/50 px-4 text-center",
        compact ? "aspect-[16/9] w-full py-4" : "py-10",
        className,
      )}
    >
      <ImageOff className={compact ? "h-5 w-5 text-muted-foreground" : "h-6 w-6 text-muted-foreground"} strokeWidth={1.6} />
      <p className={cn("mt-2 font-medium", compact ? "text-xs" : "text-sm")}>
        {compact ? "No verified image" : DISEASE_IMAGE_PLACEHOLDER.title}
      </p>
      {!compact ? (
        <p className="mt-1 max-w-[17rem] text-xs leading-relaxed text-muted-foreground">{DISEASE_IMAGE_PLACEHOLDER.body}</p>
      ) : null}
      {!compact ? <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.12em] text-muted-foreground">{diseaseName}</p> : null}
    </div>
  );
}