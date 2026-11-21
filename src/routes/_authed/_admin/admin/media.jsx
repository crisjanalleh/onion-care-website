import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import MediaUploadForm from "@/components/media/MediaUploadForm";
import { VERIFICATION_STATUSES } from "@/lib/domain/media";
import { listMediaAssets, updateMediaAssetReview } from "@/lib/server/content";

export const Route = createFileRoute("/_authed/_admin/admin/media")({
  component: MediaPage,
  head: () => ({ meta: [{ title: "Media library — OnionCare administration" }] }),
});

function MediaPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await listMediaAssets();
      setAssets(page.items ?? []);
    } catch (loadError) {
      setError(loadError?.message ?? "Unable to load media assets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const updateReview = async (asset, changes) => {
    setBusyId(asset.id);
    setError("");
    setNotice("");
    try {
      const result = await updateMediaAssetReview({
        data: {
          id: asset.id,
          approvalStatus: changes.approvalStatus ?? asset.approvalStatus ?? "pending",
          verificationStatus: changes.verificationStatus ?? asset.verificationStatus ?? "needs_review",
          isActive: changes.isActive ?? asset.isActive !== false,
        },
      });
      setAssets((current) => current.map((item) => item.id === asset.id ? result.asset : item));
      setNotice("Media review saved.");
    } catch (updateError) {
      setError(updateError?.message ?? "Unable to update this media asset.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Media library"
        description="Upload sourced images, then review approval and verification before disease photographs can appear in farmer guidance."
      />

      <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <MediaUploadForm onSaved={(message) => { setNotice(message); loadAssets(); }} />
        <section aria-labelledby="media-review-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="media-review-heading" className="text-sm font-semibold">Uploaded assets</h2>
              <p className="mt-1 text-xs text-muted-foreground">New uploads stay pending until reviewed.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadAssets} disabled={loading}>
              Refresh
            </Button>
          </div>

          {error ? <p role="alert" className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
          {notice ? <p role="status" className="mb-3 text-sm text-muted-foreground">{notice}</p> : null}

          {loading && assets.length === 0 ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading media assets…
            </div>
          ) : !loading && assets.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No media assets yet"
              description="Uploaded images will appear here for approval and verification."
            />
          ) : (
            <div className="max-h-[48rem] space-y-3 overflow-y-auto pr-1">
              {assets.map((asset) => (
                <article key={asset.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex gap-3">
                    <img
                      src={asset.fileUrl}
                      alt={asset.altText || asset.title || ""}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-20 w-24 shrink-0 rounded-md bg-secondary object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium">{asset.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {asset.category || "uncategorized"} · {asset.fileName || "Unnamed file"}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {asset.source || "Source not recorded"}{asset.license ? ` · ${asset.license}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-muted-foreground">
                      Approval
                      <select
                        aria-label={`Approval for ${asset.title}`}
                        value={asset.approvalStatus || "pending"}
                        onChange={(event) => updateReview(asset, { approvalStatus: event.target.value })}
                        disabled={busyId === asset.id}
                        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Verification
                      <select
                        aria-label={`Verification for ${asset.title}`}
                        value={asset.verificationStatus || "needs_review"}
                        onChange={(event) => updateReview(asset, { verificationStatus: event.target.value })}
                        disabled={busyId === asset.id || asset.origin === "illustrative"}
                        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground disabled:opacity-60"
                      >
                        {VERIFICATION_STATUSES.map((status) => (
                          <option key={status.id} value={status.id}>{status.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      {asset.isActive === false ? "Inactive" : "Active"}
                      {asset.category === "disease" && asset.approvalStatus === "approved" && asset.verificationStatus === "verified" && asset.source && asset.license
                        ? " · eligible for farmer reference"
                        : ""}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateReview(asset, { isActive: asset.isActive === false })}
                      disabled={busyId === asset.id}
                    >
                      {busyId === asset.id ? "Saving…" : asset.isActive === false ? "Activate" : "Deactivate"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
