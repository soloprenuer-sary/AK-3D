'use client';

import { useState, type FormEvent } from 'react';

const ALLOWED = ['stl', '3mf', 'obj', 'step', 'stp', 'iges', 'igs', 'jpg', 'jpeg', 'png', 'pdf'];
const MAX_MB = 300;
const MATERIALS = ['PLA / PLA+', 'PETG', 'ABS / ASA', 'Resin', 'Not sure'];

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  file?: string;
  gstin?: string;
  consent?: string;
}

/**
 * Custom quote request. Validates the fields and the file (type and size) in the browser.
 * Uploads to private storage are not connected yet, so nothing is sent.
 */
export function QuoteForm() {
  const [job, setJob] = useState<'print' | 'design'>('print');
  const [biz, setBiz] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [fileName, setFileName] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next: Errors = {};
    const name = String(f.get('name') ?? '').trim();
    const phone = String(f.get('phone') ?? '').replace(/\s+/g, '');
    const email = String(f.get('email') ?? '').trim();
    const gstin = String(f.get('gstin') ?? '').trim().toUpperCase();
    const file = f.get('file');

    if (!name) next.name = 'Enter your name so we know who to reply to.';
    if (!/^\+?\d{10,13}$/.test(phone)) next.phone = 'Enter a 10-digit mobile number, with or without +91.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter an email like name@example.com.';
    if (biz && gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) next.gstin = 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.';
    if (job === 'print' || job === 'design') {
      if (file instanceof File && file.size > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED.includes(ext)) next.file = `“${file.name}” is not a supported type. Use ${ALLOWED.join(', ').toUpperCase()}.`;
        else if (file.size > MAX_MB * 1024 * 1024) next.file = `“${file.name}” is over ${MAX_MB} MB. Export a smaller file or message us.`;
      } else {
        next.file = job === 'print' ? 'Add your 3D file so we can quote it.' : 'Add a sketch, photo or reference so we can start.';
      }
    }
    if (!f.get('consent')) next.consent = 'Tick the box to confirm you have the right to print the file.';

    setErrors(next);
    setDone(Object.keys(next).length === 0);
  };

  return (
    <form className="quote-form" onSubmit={onSubmit} noValidate aria-describedby="quote-note">
      <fieldset className="opt-block">
        <legend className="label">What do you need?</legend>
        <div className="job-pick" role="radiogroup" aria-label="Job type">
          <button type="button" role="radio" aria-checked={job === 'print'} className="pill" onClick={() => setJob('print')}>
            Print my file
          </button>
          <button type="button" role="radio" aria-checked={job === 'design'} className="pill" onClick={() => setJob('design')}>
            Design and print
          </button>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="file">{job === 'print' ? '3D file' : 'Sketch, photo or reference'}</label>
        <input
          id="file"
          name="file"
          type="file"
          accept={job === 'print' ? '.stl,.3mf,.obj,.step,.stp,.iges,.igs' : '.jpg,.jpeg,.png,.pdf'}
          aria-invalid={Boolean(errors.file)}
          aria-describedby="file-hint"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
        />
        <span id="file-hint" className="meta">
          {job === 'print' ? 'STL, 3MF, OBJ, STEP or IGES' : 'JPG, PNG or PDF'} · up to {MAX_MB} MB · private, only the studio can open it
          {fileName ? ` · selected: ${fileName}` : ''}
        </span>
        {errors.file && <p className="err" role="alert">{errors.file}</p>}
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="material">Material</label>
          <select id="material" name="material" defaultValue="Not sure">
            {MATERIALS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="qty">Quantity</label>
          <input id="qty" name="qty" type="number" min={1} max={500} defaultValue={1} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={4} placeholder="What is it for? Size, strength or finish you want?" />
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" autoComplete="name" aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="err" role="alert">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="phone">WhatsApp or phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <p className="err" role="alert">{errors.phone}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">Email (optional)</label>
        <input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className="err" role="alert">{errors.email}</p>}
      </div>

      <label className="check">
        <input type="checkbox" checked={biz} onChange={(e) => setBiz(e.target.checked)} />
        I am ordering for a business and need a GST invoice
      </label>
      {biz && (
        <div className="grid2">
          <div className="field">
            <label htmlFor="company">Company name</label>
            <input id="company" name="company" type="text" />
          </div>
          <div className="field">
            <label htmlFor="gstin">GSTIN</label>
            <input id="gstin" name="gstin" type="text" maxLength={15} aria-invalid={Boolean(errors.gstin)} />
            {errors.gstin && <p className="err" role="alert">{errors.gstin}</p>}
          </div>
        </div>
      )}

      <label className="check">
        <input name="consent" type="checkbox" aria-invalid={Boolean(errors.consent)} />
        I confirm I have the right to print this file (my own design, or permission from its owner).
      </label>
      {errors.consent && <p className="err" role="alert">{errors.consent}</p>}

      <button className="btn btn-primary btn-wide" type="submit">
        Request my quote
      </button>

      <p id="quote-note" className="meta">
        We reply within [X] hours. No payment is taken at this step.
      </p>
      {done && (
        <p className="ok" role="status">
          Looks good. Sending quote requests is not connected yet, so nothing was sent. Once the backend is live, this request goes to the studio.
        </p>
      )}
    </form>
  );
}
