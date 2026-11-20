import { Inbox } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon = Inbox, title, description, action, image, className }) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center", className)}>
      {image ? (
        <Image src={image.url} alt={image.alt} className="mb-4 aspect-[16/9] w-full max-w-sm rounded-md" fittingType="fill" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}