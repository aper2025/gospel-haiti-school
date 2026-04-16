"use client";

import { useTranslations } from "next-intl";
import type { Staff } from "@prisma/client";

type Props = {
  action: (formData: FormData) => void;
  staff?: Staff;
  isPending: boolean;
};

export function StaffForm({ action, staff, isPending }: Props) {
  const t = useTranslations();

  return (
    <form action={action} className="space-y-8">
      <Section title="Identité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required defaultValue={staff?.firstName} />
          <Field label="Nom" name="lastName" required defaultValue={staff?.lastName} />
          <SelectField label="Genre" name="gender" defaultValue={staff?.gender ?? ""}>
            <option value="">—</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </SelectField>
          <Field label="Date de naissance" name="dateOfBirth" type="date" defaultValue={staff?.dateOfBirth ? fmt(staff.dateOfBirth) : ""} />
          <Field label="Téléphone" name="phone" type="tel" defaultValue={staff?.phone ?? ""} />
          <Field label="Courriel" name="email" type="email" defaultValue={staff?.email ?? ""} />
        </div>
      </Section>

      <Section title="Poste">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField label="Rôle" name="role" defaultValue={staff?.role ?? "HOMEROOM_TEACHER"}>
            <option value="DIRECTOR">{t("roles.DIRECTOR")}</option>
            <option value="ADMIN">{t("roles.ADMIN")}</option>
            <option value="HOMEROOM_TEACHER">{t("roles.HOMEROOM_TEACHER")}</option>
            <option value="SUBJECT_TEACHER">{t("roles.SUBJECT_TEACHER")}</option>
            <option value="ASSISTANT">{t("roles.ASSISTANT")}</option>
            <option value="SUPPORT">{t("roles.SUPPORT")}</option>
          </SelectField>
          <SelectField label="Contrat" name="contractType" defaultValue={staff?.contractType ?? ""}>
            <option value="">—</option>
            <option value="FULL_TIME">Temps plein</option>
            <option value="PART_TIME">Temps partiel</option>
            <option value="CONTRACT">Contrat</option>
            <option value="VOLUNTEER">Bénévole</option>
          </SelectField>
          <Field label="Date de début" name="startDate" type="date" defaultValue={staff?.startDate ? fmt(staff.startDate) : ""} />
          <Field label="Code PIN" name="staffPin" defaultValue={staff?.staffPin ?? ""} />
        </div>
      </Section>

      <Section title="Adresse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Village" name="addressVillage" defaultValue={staff?.addressVillage ?? ""} />
          <Field label="Quartier" name="addressNeighborhood" defaultValue={staff?.addressNeighborhood ?? ""} />
          <Field label="Commune" name="addressCommune" defaultValue={staff?.addressCommune ?? ""} />
          <Field label="Département" name="addressDepartment" defaultValue={staff?.addressDepartment ?? ""} />
        </div>
      </Section>

      <Section title="Contact d'urgence">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" name="emergencyContactName" defaultValue={staff?.emergencyContactName ?? ""} />
          <Field label="Téléphone" name="emergencyContactPhone" type="tel" defaultValue={staff?.emergencyContactPhone ?? ""} />
        </div>
      </Section>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
        <a href="/dashboard/staff" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          {t("common.cancel")}
        </a>
        <button type="submit" disabled={isPending} className="rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
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

function Field({ label, name, type = "text", required, defaultValue }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </div>
  );
}

function SelectField({ label, name, defaultValue, children }: { label: string; name: string; defaultValue?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        {children}
      </select>
    </div>
  );
}

function fmt(d: Date): string { return d.toISOString().split("T")[0]; }
