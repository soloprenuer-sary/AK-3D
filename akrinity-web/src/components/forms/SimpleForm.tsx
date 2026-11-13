'use client';

import { useState, type FormEvent } from 'react';

type Rule = 'phone' | 'email' | 'gstin' | 'password';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'textarea' | 'select' | 'number';
  required?: boolean;
  rule?: Rule;
  options?: string[];
  /** Two fields with half set share a row on wide screens. */
  half?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

interface SimpleFormProps {
  /** Unique prefix for field ids, so several forms can sit on one page. */
  id: string;
  fields: FieldDef[];
  submitLabel: string;
  /** Shown after a valid submit. Forms are not connected to a backend yet. */
  successNote: string;
  /** Optional tick box the visitor must agree to. */
  consent?: string;
  note?: string;
}

const RULES: Record<Rule, { test: (v: string) => boolean; message: string }> = {
  phone: { test: (v) => /^\+?\d{10,13}$/.test(v.replace(/\s+/g, '')), message: 'Enter a 10-digit mobile number, with or without +91.' },
  email: { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Enter an email like name@example.com.' },
  gstin: { test: (v) => /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.toUpperCase()), message: 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.' },
  password: { test: (v) => v.length >= 8, message: 'Use at least 8 characters.' },
};

/**
 * Small validated form used on the contact, business, login and track-order pages. It checks the
 * fields in the browser and shows a note. Nothing is sent or stored: no backend is connected yet.
 */
export function SimpleForm({ id, fields, submitLabel, successNote, consent, note }: SimpleFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = String(f.get(field.name) ?? '').trim();
      if (field.required && !value) {
        next[field.name] = `Enter your ${field.label.toLowerCase()}.`;
        continue;
      }
      if (value && field.rule && !RULES[field.rule].test(value)) next[field.name] = RULES[field.rule].message;
    }
    if (consent && !f.get('consent')) next.consent = 'Tick the box to continue.';
    setErrors(next);
    setDone(Object.keys(next).length === 0);
  };

  return (
    <form className="quote-form simple-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        {fields.map((field) => {
          const fid = `${id}-${field.name}`;
          const type = field.type ?? 'text';
          return (
            <div key={field.name} className={field.half ? 'field' : 'field full'}>
              <label htmlFor={fid}>
                {field.label}
                {field.required ? '' : ' (optional)'}
              </label>
              {type === 'textarea' ? (
                <textarea id={fid} name={field.name} rows={4} placeholder={field.placeholder} aria-invalid={Boolean(errors[field.name])} />
              ) : type === 'select' ? (
                <select id={fid} name={field.name} defaultValue={field.options?.[0]}>
                  {field.options?.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  id={fid}
                  name={field.name}
                  type={type}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  aria-invalid={Boolean(errors[field.name])}
                />
              )}
              {errors[field.name] && (
                <p className="err" role="alert">
                  {errors[field.name]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {consent && (
        <>
          <label className="check">
            <input name="consent" type="checkbox" aria-invalid={Boolean(errors.consent)} />
            {consent}
          </label>
          {errors.consent && (
            <p className="err" role="alert">
              {errors.consent}
            </p>
          )}
        </>
      )}

      <button className="btn btn-primary btn-wide" type="submit">
        {submitLabel}
      </button>
      {note && <p className="meta">{note}</p>}
      {done && (
        <p className="ok" role="status">
          {successNote}
        </p>
      )}
    </form>
  );
}
