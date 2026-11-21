import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Ruler, Stethoscope } from "lucide-react";
import { SYMPTOM_GROUPS } from "@/lib/domain/catalogue";
import {
  calculateAffectedArea,
  LOT_AREA_UNITS,
  evaluateDiagnosis,
  validateAreaInputs,
} from "@/lib/domain/diagnosis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STEPS = ["Symptom group", "Symptoms", "Affected area", "Review"];

export default function DiagnosisWizard({ onComplete, busy }) {
  const [step, setStep] = useState(0);
  const [categoryId, setCategoryId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [lotArea, setLotArea] = useState("");
  const [lotAreaUnit, setLotAreaUnit] = useState("sqm");
  const [affectedAreaPercent, setAffectedAreaPercent] = useState("");
  const [errors, setErrors] = useState({});

  const group = useMemo(() => SYMPTOM_GROUPS.find((g) => g.id === categoryId) ?? null, [categoryId]);
  const areaEstimate = step === 3
    ? calculateAffectedArea({ lotArea, lotAreaUnit, affectedAreaPercent })
    : null;

  const toggleSymptom = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const chooseCategory = (id) => {
    setCategoryId(id);
    setSelected([]);
    setErrors({});
    setStep(1);
  };

  const goNext = () => {
    if (step === 1) {
      if (selected.length === 0) {
        setErrors({ symptoms: "Select at least one symptom you can see." });
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }
    if (step === 2) {
      const nextErrors = validateAreaInputs({ lotArea, lotAreaUnit, affectedAreaPercent });
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) setStep(3);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const finish = () => {
    const result = evaluateDiagnosis(categoryId, selected);
    onComplete({
      symptomCategory: categoryId,
      selectedSymptoms: selected,
      lotArea,
      lotAreaUnit,
      affectedAreaPercent,
      result,
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
          {categoryId ? (
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setCategoryId(null);
                setSelected([]);
                setErrors({});
              }}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Change group
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn("h-1.5 flex-1 rounded-full", index <= step ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>
      </div>

      <div className="px-5 py-6">
        {step === 0 ? (
          <div>
            <h2 className="text-lg font-semibold">Where is the problem most obvious?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Choose the group that best describes what you are seeing. You can go back at any time
              without losing your answers.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {SYMPTOM_GROUPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseCategory(item.id)}
                  className="group flex min-h-[92px] flex-col items-start gap-1.5 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Stethoscope className="h-4 w-4 text-primary" strokeWidth={2} />
                    {item.label}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{item.summary}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 && group ? (
          <div>
            <h2 className="text-lg font-semibold">Which of these can you see?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{group.guidance}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {group.symptoms.map((symptom) => {
                const active = selected.includes(symptom.id);
                return (
                  <button
                    key={symptom.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSymptom(symptom.id)}
                    className={cn(
                      "flex min-h-[52px] items-start gap-3 rounded-md border p-3 text-left transition-colors",
                      active ? "border-primary bg-accent" : "border-border bg-background hover:bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card",
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{symptom.label}</span>
                      {symptom.help ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{symptom.help}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.symptoms ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-destructive">
                <CircleAlert className="h-4 w-4" /> {errors.symptoms}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 && group ? (
          <div>
            <h2 className="text-lg font-semibold">How much of the field is affected?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              These answers are recorded with your diagnosis so your administrator can see the extent of
              the problem. No chemical amount is calculated from them.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <Label htmlFor="lotArea">Lot area</Label>
                <Input
                  id="lotArea"
                  inputMode="decimal"
                  value={lotArea}
                  onChange={(event) => setLotArea(event.target.value)}
                  placeholder="e.g. 2500"
                  className="mt-1.5"
                  aria-invalid={Boolean(errors.lotArea)}
                />
                {errors.lotArea ? <p className="mt-1 text-xs text-destructive">{errors.lotArea}</p> : null}
              </div>
              <div>
                <Label htmlFor="lotAreaUnit">Unit</Label>
                <select
                  id="lotAreaUnit"
                  value={lotAreaUnit}
                  onChange={(event) => setLotAreaUnit(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {LOT_AREA_UNITS.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="affectedArea">Affected area (%)</Label>
                <Input
                  id="affectedArea"
                  inputMode="decimal"
                  value={affectedAreaPercent}
                  onChange={(event) => setAffectedAreaPercent(event.target.value)}
                  placeholder="0 – 100"
                  className="mt-1.5"
                  aria-invalid={Boolean(errors.affectedAreaPercent)}
                />
                {errors.affectedAreaPercent ? (
                  <p className="mt-1 text-xs text-destructive">{errors.affectedAreaPercent}</p>
                ) : null}
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-md bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
              <Ruler className="mt-0.5 h-4 w-4 flex-none text-primary" />
              The legacy lot-area to mixture formula is not used here. Its units were never verified, so
              OnionCare does not convert your lot area into a chemical quantity.
            </p>
          </div>
        ) : null}

        {step === 3 && group ? (
          <div>
            <h2 className="text-lg font-semibold">Check your answers</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              The assessment is produced from these answers only. Nothing is saved until you choose to save it.
            </p>
            <dl className="mt-5 divide-y divide-border rounded-lg border border-border">
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                <dt className="text-sm text-muted-foreground">Symptom group</dt>
                <dd className="text-sm font-medium">{group.label}</dd>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between sm:gap-6">
                <dt className="text-sm text-muted-foreground">Symptoms selected</dt>
                <dd className="text-sm font-medium sm:max-w-[26rem] sm:text-right">
                  {selected.map((id) => group.symptoms.find((s) => s.id === id)?.label ?? id).join(", ")}
                </dd>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                <dt className="text-sm text-muted-foreground">Lot area</dt>
                <dd className="text-sm font-medium">
                  {lotArea} {LOT_AREA_UNITS.find((u) => u.id === lotAreaUnit)?.label}
                </dd>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                <dt className="text-sm text-muted-foreground">Affected area</dt>
                <dd className="text-sm font-medium">{affectedAreaPercent}%</dd>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:justify-between">
                <dt className="text-sm text-muted-foreground">Estimated affected area</dt>
                <dd className="text-sm font-medium">{areaEstimate.estimatedAffectedAreaM2} m²</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              This is an area estimate only. It is not a treatment area or a chemical quantity.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || busy}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={goNext} disabled={step === 0 || busy} className="gap-1.5">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={finish} disabled={busy}>
            {busy ? "Assessing…" : "See the assessment"}
          </Button>
        )}
      </div>
    </div>
  );
}