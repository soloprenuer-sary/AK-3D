'use client';

import { useRef, useState, type FormEvent } from 'react';
import { FilePreview } from '@/components/three/FilePreview';
import { COLOURS, type ColourKey } from '@/lib/shop-data';
import { sendQuoteRequest } from '@/lib/auth-client';
import { uploadQuoteFile, type UploadTicket } from '@/lib/quote-upload';

const ALLOWED = ['stl', '3mf', 'obj', 'step', 'stp', 'iges', 'igs', 'jpg', 'jpeg', 'png', 'pdf'];
const MAX_MB = 300;
const MATERIALS = ['PLA / PLA+', 'PETG', 'ABS / ASA', 'Resin', 'Not sure'];
const PREVIEW_COLOURS: ColourKey[] = ['white', 'black', 'orange', 'violet', 'lime'];

interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  file?: string;
  gstin?: string;
  consent?: string;
}

/**
 * Custom quote request. Validates the fields and the file (type and size) in the browser, then
 * sends the details to WordPress, which saves them under Quote requests and emails the studio.
 * The file is then uploaded in pieces straight to WordPress, which keeps it in a private folder.
 * If the upload fails, the request is already saved and the customer can retry or send the file by
 * WhatsApp or email, quoting the reference.
 */
export function QuoteForm() {
  const [job, setJob] = useState<'print' | 'design'>('print');
  const [biz, setBiz] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [fileName, setFileName] = useState('');
  const [model, setModel] = useState<File | null>(null);
  const [previewColour, setPreviewColour] = useState<ColourKey>('white');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [reference, setReference] = useState('');
  const [sentFile, setSentFile] = useState('');
  const [upload, setUpload] = useState<{
    state: 'idle' | 'sending' | 'done' | 'failed';
    pct: number;
    error: string;
  }>({
    state: 'idle',
    pct: 0,
    error: '',
  });
  const pending = useRef<{ file: File; ticket: UploadTicket } | null>(null);

  const runUpload = async () => {
    const p = pending.current;
    if (!p) return;
    setUpload({ state: 'sending', pct: 0, error: '' });
    const err = await uploadQuoteFile(p.file, p.ticket, (pct) =>
      setUpload({ state: 'sending', pct, error: '' }),
    );
    if (err) setUpload({ state: 'failed', pct: 0, error: err });
    else {
      pending.current = null;
      setUpload({ state: 'done', pct: 100, error: '' });
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const next: Errors = {};
    const name = String(f.get('name') ?? '').trim();
    const phone = String(f.get('phone') ?? '').replace(/\s+/g, '');
    const email = String(f.get('email') ?? '').trim();
    const gstin = String(f.get('gstin') ?? '')
      .trim()
      .toUpperCase();
    const file = f.get('file');

    if (!name) next.name = 'Enter your name so we know who to reply to.';
    if (!/^\+?\d{10,13}$/.test(phone))
      next.phone = 'Enter a 10-digit mobile number, with or without +91.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Enter an email like name@example.com.';
    if (biz && gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin))
      next.gstin = 'GSTIN should be 15 characters, for example 27ABCDE1234F1Z5.';
    if (job === 'print' || job === 'design') {
      if (file instanceof File && file.size > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED.includes(ext))
          next.file = `“${file.name}” is not a supported type. Use ${ALLOWED.join(', ').toUpperCase()}.`;
        else if (file.size > MAX_MB * 1024 * 1024)
          next.file = `“${file.name}” is over ${MAX_MB} MB. Export a smaller file or message us.`;
      }
    }
    if (!f.get('consent'))
      next.consent = 'Tick the box to confirm you have the right to print the file.';

    setErrors(next);
    setServerError('');
    if (Object.keys(next).length > 0) return;

    const picked = file instanceof File && file.size > 0 ? file : null;
    setBusy(true);
    const r = await sendQuoteRequest({
      job,
      name,
      phone,
      email,
      material: String(f.get('material') ?? ''),
      quantity: String(f.get('qty') ?? ''),
      company: biz ? String(f.get('company') ?? '').trim() : '',
      gstin: biz ? gstin : '',
      notes: String(f.get('notes') ?? '').trim(),
      fileName: picked?.name ?? '',
      fileSize: picked ? `${(picked.size / (1024 * 1024)).toFixed(1)} MB` : '',
    });
    setBusy(false);
    if (r.error) {
      setServerError(r.error);
      return;
    }
    setReference(r.reference);
    setSentFile(picked?.name ?? '');
    setUpload({ state: 'idle', pct: 0, error: '' });
    pending.current = picked && r.ticket ? { file: picked, ticket: r.ticket } : null;
    form.reset();
    setFileName('');
    setModel(null);
    setBiz(false);
    if (pending.current) {
      setBusy(true);
      await runUpload();
      setBusy(false);
    }
  };

  return (
    <form className="quote-form" onSubmit={onSubmit} noValidate aria-describedby="quote-note">
      <fieldset className="opt-block">
        <legend className="label">What do you need?</legend>
        <div className="job-pick" role="radiogroup" aria-label="Job type">
          <button
            type="button"
            role="radio"
            aria-checked={job === 'print'}
            className="pill"
            onClick={() => setJob('print')}
          >
            Print my file
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={job === 'design'}
            className="pill"
            onClick={() => setJob('design')}
          >
            Design and print
          </button>
        </div>
      </fieldset>

      <div className="grid2">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <p className="err" role="alert">
              {errors.name}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="phone">WhatsApp or phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && (
            <p className="err" role="alert">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="email">Email (optional)</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <p className="err" role="alert">
              {errors.email}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="material">Material</label>
          <select id="material" name="material" defaultValue="Not sure">
            {MATERIALS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="qty">Quantity</label>
          <input id="qty" name="qty" type="number" min={1} max={500} defaultValue={1} />
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label className="check">
            <input type="checkbox" checked={biz} onChange={(e) => setBiz(e.target.checked)} />I am
            ordering for a business and need a GST invoice
          </label>
        </div>
      </div>

      {biz && (
        <div className="grid2">
          <div className="field">
            <label htmlFor="company">Company name</label>
            <input id="company" name="company" type="text" />
          </div>
          <div className="field">
            <label htmlFor="gstin">GSTIN</label>
            <input
              id="gstin"
              name="gstin"
              type="text"
              maxLength={15}
              aria-invalid={Boolean(errors.gstin)}
            />
            {errors.gstin && (
              <p className="err" role="alert">
                {errors.gstin}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="What is it for? Size, strength or finish you want?"
        />
      </div>

      <div className="file-box">
        <div className="file-box-head">
          <div className="field" style={{ flex: '1 1 260px' }}>
            <label htmlFor="file">
              {job === 'print'
                ? '3D file (optional here)'
                : 'Sketch, photo or reference (optional here)'}
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept={
                job === 'print' ? '.stl,.3mf,.obj,.step,.stp,.iges,.igs' : '.jpg,.jpeg,.png,.pdf'
              }
              aria-invalid={Boolean(errors.file)}
              aria-describedby="file-hint"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFileName(picked?.name ?? '');
                setModel(picked);
              }}
            />
          </div>
          {job === 'print' && (
            <div className="file-colours" role="group" aria-label="Preview colour">
              <span className="label">Preview colour: {previewColour}</span>
              <div className="swatches">
                {PREVIEW_COLOURS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="sw"
                    aria-label={`Preview colour ${key}`}
                    aria-pressed={previewColour === key}
                    style={{ background: COLOURS[key] }}
                    onClick={() => setPreviewColour(key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {job === 'print' && (
          <FilePreview
            key={model ? `${model.name}-${model.size}` : 'none'}
            file={model}
            colour={COLOURS[previewColour]}
          />
        )}

        <span id="file-hint" className="meta">
          {job === 'print' ? 'STL, 3MF, OBJ, STEP or IGES' : 'JPG, PNG or PDF'} · up to {MAX_MB} MB.
          We upload it with your request. It is kept privately and only the studio can open it.
          {fileName ? ` Selected: ${fileName}` : ''}
        </span>
        {errors.file && (
          <p className="err" role="alert">
            {errors.file}
          </p>
        )}
      </div>

      <label className="check">
        <input name="consent" type="checkbox" aria-invalid={Boolean(errors.consent)} />I confirm I
        have the right to print this file (my own design, or permission from its owner).
      </label>
      {errors.consent && (
        <p className="err" role="alert">
          {errors.consent}
        </p>
      )}

      <button className="btn btn-primary btn-wide" type="submit" disabled={busy} aria-busy={busy}>
        {busy
          ? upload.state === 'sending'
            ? 'Uploading your file…'
            : 'Sending your request…'
          : 'Request my quote'}
      </button>

      <p id="quote-note" className="meta">
        We reply within [X] hours. No payment is taken at this step.
      </p>
      {serverError && (
        <p className="err" role="alert">
          {serverError}
        </p>
      )}
      {reference && (
        <p className="ok" role="status">
          Thank you. We received your request ({reference}).
          {sentFile
            ? upload.state === 'done'
              ? ` Your file (${sentFile}) was uploaded.`
              : upload.state === 'sending'
                ? ' Uploading your file…'
                : upload.state === 'idle'
                  ? ` Please send your file (${sentFile}) to us on WhatsApp or by email and mention ${reference}, so we can quote it.`
                  : ''
            : ' We will reply with a price and lead time.'}
        </p>
      )}
      {upload.state === 'sending' && (
        <div
          className="upload-bar"
          role="progressbar"
          aria-valuenow={upload.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <span style={{ width: `${upload.pct}%` }} />
          <em>{upload.pct}%</em>
        </div>
      )}
      {upload.state === 'failed' && (
        <div className="err" role="alert">
          <p>
            {upload.error} Your request is saved ({reference}) but your file did not arrive. You can
            try again, or send the file on WhatsApp or by email and mention {reference}.
          </p>
          <button
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              setBusy(true);
              await runUpload();
              setBusy(false);
            }}
          >
            Try the upload again
          </button>
        </div>
      )}
    </form>
  );
}
