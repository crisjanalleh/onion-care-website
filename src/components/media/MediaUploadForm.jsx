const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveMediaAsset } from "@/lib/server/content";
import { DISEASES, PESTS } from "@/lib/domain/catalogue";
import { MEDIA_CATEGORIES, MEDIA_ORIGINS, VERIFICATION_STATUSES } from "@/lib/domain/media";

const EMPTY = {
  title: "",
  category: "disease",
  relatedDiseaseId: "",
  relatedPestId: "",
  altText: "",
  caption: "",
  attribution: "",
  source: "",
  license: "",
  origin: "admin_upload",
  approvalStatus: "pending",
  verificationStatus: "needs_review",
};

const selectClass = "mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function MediaUploadForm({ onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isDisease = form.category === "disease";

  const chooseFile = async (selected) => {
    setFile(selected ?? null);
    setDimensions(null);
    if (!selected) return;
    if (!form.title) {
      setForm((previous) => ({ ...previous, title: selected.name.replace(/\.[^.]+$/, "").slice(0, 120) }));
    }
    const measured = await new Promise((resolve) => {
      const probe = new window.Image();
      probe.onload = () => resolve({ width: probe.naturalWidth, height: probe.naturalHeight });
      probe.onerror = () => resolve(null);
      probe.src = URL.createObjectURL(selected);
    });
    setDimensions(measured);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Choose an image file first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { file_url } = await db.integrations.Core.UploadPublicFile({ file });
      await saveMediaAsset({
        data: {
          title: form.title,
          category: form.category,
          fileUrl: file_url,
          fileName: file.name,
          contentType: file.type || undefined,
          fileSizeBytes: file.size,
          width: dimensions?.width,
          height: dimensions?.height,
          relatedDiseaseId: isDisease ? form.relatedDiseaseId || undefined : undefined,
          relatedPestId: form.category === "pest" ? form.relatedPestId || undefined : undefined,
          altText: form.altText || undefined,
          caption: form.caption || undefined,
          attribution: form.attribution || undefined,
          source: form.source || undefined,
          license: form.license || undefined,
          origin: form.origin,
          approvalStatus: form.approvalStatus,
          verificationStatus: isDisease ? form.verificationStatus : "not_applicable",
          isActive: true,
        },
      });
      setForm(EMPTY);
      setFile(null);
      setDimensions(null);
      event.target.reset?.();
      onSaved?.("Asset saved.");
    } catch (submitError) {
      setError(submitError?.message ?? "The upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Upload className="h-4 w-4 text-primary" /> Upload an asset
      </h2>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="media-file">Image file</Label>
          <Input id="media-file" type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} className="mt-1.5" />
          {file ? (
            <p className="mt-1.5 text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024).toFixed(0)} KB
              {dimensions ? ` · ${dimensions.width}×${dimensions.height} px` : ""}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="media-title">Title</Label>
          <Input id="media-title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-1.5" required />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="media-category">Category</Label>
            <select id="media-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={selectClass}>
              {MEDIA_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="media-origin">Origin</Label>
            <select id="media-origin" value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))} className={selectClass}>
              {MEDIA_ORIGINS.map((origin) => (
                <option key={origin.id} value={origin.id}>
                  {origin.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isDisease ? (
          <div>
            <Label htmlFor="media-disease">Disease shown in the photograph</Label>
            <select id="media-disease" value={form.relatedDiseaseId} onChange={(e) => setForm((p) => ({ ...p, relatedDiseaseId: e.target.value }))} className={selectClass}>
              <option value="">Not linked</option>
              {DISEASES.map((disease) => (
                <option key={disease.id} value={disease.id}>
                  {disease.legacyLabel}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">One photograph belongs to one disease. Never reuse a photo to fill another disease.</p>
          </div>
        ) : null}

        {form.category === "pest" ? (
          <div>
            <Label htmlFor="media-pest">Related pest</Label>
            <select id="media-pest" value={form.relatedPestId} onChange={(e) => setForm((p) => ({ ...p, relatedPestId: e.target.value }))} className={selectClass}>
              <option value="">Not linked</option>
              {PESTS.map((pest) => (
                <option key={pest.id} value={pest.id}>
                  {pest.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <Label htmlFor="media-alt">Alt text</Label>
          <Input id="media-alt" value={form.altText} onChange={(e) => setForm((p) => ({ ...p, altText: e.target.value }))} className="mt-1.5" />
          <p className="mt-1 text-xs text-muted-foreground">Describe what the photograph shows, not the file name.</p>
        </div>

        <div>
          <Label htmlFor="media-caption">Caption</Label>
          <Input id="media-caption" value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} className="mt-1.5" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="media-source">Source</Label>
            <Input id="media-source" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} className="mt-1.5" placeholder="Where the image came from" />
          </div>
          <div>
            <Label htmlFor="media-license">Licence</Label>
            <Input id="media-license" value={form.license} onChange={(e) => setForm((p) => ({ ...p, license: e.target.value }))} className="mt-1.5" placeholder="e.g. CC BY 4.0" />
          </div>
        </div>

        <div>
          <Label htmlFor="media-attribution">Attribution</Label>
          <Input id="media-attribution" value={form.attribution} onChange={(e) => setForm((p) => ({ ...p, attribution: e.target.value }))} className="mt-1.5" placeholder="Photographer or institution to credit" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="media-approval">Approval</Label>
            <select id="media-approval" value={form.approvalStatus} onChange={(e) => setForm((p) => ({ ...p, approvalStatus: e.target.value }))} className={selectClass}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {isDisease ? (
            <div>
              <Label htmlFor="media-verification">Verification</Label>
              <select id="media-verification" value={form.verificationStatus} onChange={(e) => setForm((p) => ({ ...p, verificationStatus: e.target.value }))} className={selectClass}>
                {VERIFICATION_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {isDisease && form.origin === "illustrative" ? (
          <p className="rounded-md border border-border bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
            A illustration can never be verified as a disease reference. Keep it as a clearly labelled illustration, or upload a real
            photograph with its source and licence.
          </p>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload asset"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Files are stored publicly — anyone with the link can open them, which farmer-facing reference images require.
        </p>
      </div>
    </form>
  );
}