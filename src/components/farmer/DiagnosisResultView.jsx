export default function DiagnosisResultView({ result }) {
  return <section className="rounded-xl border bg-card p-5"><h2 className="text-xl font-semibold">{result?.diseaseName ?? "Diagnosis result"}</h2>{result?.description ? <p className="mt-3 text-sm text-muted-foreground">{result.description}</p> : null}</section>;
}
