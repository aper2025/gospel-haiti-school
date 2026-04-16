"use client";

import { useTranslations } from "next-intl";
import type { Student, Class } from "@prisma/client";

type Props = {
  action: (formData: FormData) => void;
  classes: { id: string; label: string }[];
  student?: Student & { currentClass?: Class | null };
  isPending: boolean;
};

export function StudentForm({ action, classes, student, isPending }: Props) {
  const t = useTranslations();

  return (
    <form action={action} className="space-y-8">
      {/* Identity */}
      <Section title="Identité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required defaultValue={student?.firstName} />
          <Field label="Nom" name="lastName" required defaultValue={student?.lastName} />
          <SelectField label="Genre" name="gender" defaultValue={student?.gender ?? ""}>
            <option value="">—</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </SelectField>
          <Field
            label="Date de naissance"
            name="dateOfBirth"
            type="date"
            defaultValue={student?.dateOfBirth ? formatDate(student.dateOfBirth) : ""}
          />
        </div>
      </Section>

      {/* School */}
      <Section title="Scolarité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Classe" name="currentClassId" defaultValue={student?.currentClassId ?? ""}>
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </SelectField>
          <Field
            label="Date d'inscription"
            name="enrollmentDate"
            type="date"
            defaultValue={student?.enrollmentDate ? formatDate(student.enrollmentDate) : ""}
          />
          <SelectField label="Statut" name="enrollmentStatus" defaultValue={student?.enrollmentStatus ?? "ACTIVE"}>
            <option value="ACTIVE">Actif</option>
            <option value="WITHDRAWN">Retiré</option>
            <option value="GRADUATED">Diplômé</option>
          </SelectField>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="birthCertOnFile"
              name="birthCertOnFile"
              type="checkbox"
              defaultChecked={student?.birthCertOnFile ?? false}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="birthCertOnFile" className="text-sm text-slate-700">
              Acte de naissance fourni
            </label>
          </div>
        </div>
      </Section>

      {/* Address */}
      <Section title="Adresse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Village" name="addressVillage" defaultValue={student?.addressVillage ?? ""} />
          <Field label="Quartier" name="addressNeighborhood" defaultValue={student?.addressNeighborhood ?? ""} />
          <Field label="Commune" name="addressCommune" defaultValue={student?.addressCommune ?? ""} />
          <Field label="Département" name="addressDepartment" defaultValue={student?.addressDepartment ?? ""} />
        </div>
      </Section>

      {/* Mother */}
      <Section title="Mère">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="motherFirstName" defaultValue={student?.motherFirstName ?? ""} />
          <Field label="Nom" name="motherLastName" defaultValue={student?.motherLastName ?? ""} />
          <SelectField label="Vivante" name="motherAlive" defaultValue={student?.motherAlive ?? ""}>
            <option value="">—</option>
            <option value="YES">{t("common.yes")}</option>
            <option value="NO">{t("common.no")}</option>
          </SelectField>
          <Field label="Téléphone" name="motherPhone" type="tel" defaultValue={student?.motherPhone ?? ""} />
        </div>
      </Section>

      {/* Father */}
      <Section title="Père">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="fatherFirstName" defaultValue={student?.fatherFirstName ?? ""} />
          <Field label="Nom" name="fatherLastName" defaultValue={student?.fatherLastName ?? ""} />
          <SelectField label="Vivant" name="fatherAlive" defaultValue={student?.fatherAlive ?? ""}>
            <option value="">—</option>
            <option value="YES">{t("common.yes")}</option>
            <option value="NO">{t("common.no")}</option>
          </SelectField>
          <Field label="Téléphone" name="fatherPhone" type="tel" defaultValue={student?.fatherPhone ?? ""} />
        </div>
      </Section>

      {/* Emergency contact */}
      <Section title="Contact d'urgence">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" name="emergencyContactName" defaultValue={student?.emergencyContactName ?? ""} />
          <Field label="Téléphone" name="emergencyContactPhone" type="tel" defaultValue={student?.emergencyContactPhone ?? ""} />
        </div>
      </Section>

      {/* Notes */}
      <Section title="Notes">
        <TextArea label="Notes médicales" name="medicalNotes" defaultValue={student?.medicalNotes ?? ""} />
        <TextArea label="Notes générales" name="generalNotes" defaultValue={student?.generalNotes ?? ""} />
      </Section>

      {/* Submit */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <a
          href="/dashboard/students"
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {t("common.cancel")}
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-5">
      <legend className="px-2 text-sm font-semibold text-slate-700">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}
