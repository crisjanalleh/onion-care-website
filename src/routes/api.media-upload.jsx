import { createFileRoute } from "@tanstack/react-router";
import { uploadMedia } from "@/lib/firebase/media-upload";

export const Route = createFileRoute("/api/media-upload")({
  server: {
    handlers: {
      POST: ({ request, context }) => uploadMedia(request, context),
    },
  },
});
