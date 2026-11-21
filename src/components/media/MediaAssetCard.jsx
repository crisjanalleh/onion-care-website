export default function MediaAssetCard({ asset }) {
  return <article className="rounded-xl border p-4"><h3 className="font-medium">{asset?.fileName ?? "Media asset"}</h3><p className="text-sm text-muted-foreground">{asset?.verificationStatus ?? "needs_review"}</p></article>;
}
