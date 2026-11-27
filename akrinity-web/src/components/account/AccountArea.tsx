'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SimpleForm, type FieldDef } from '@/components/forms/SimpleForm';
import { ConfirmBanner } from './ConfirmBanner';
import { downloadInvoice } from '@/lib/shop-client';
import { useLiveProducts } from '@/lib/live-catalogue';
import { useCart } from '@/lib/cart-store';
import { productSlug } from '@/lib/shop-data';
import {
  changePassword,
  currentUser,
  fetchOrder,
  fetchOrders,
  saveProfile,
  signOut,
  type Address,
  type AuthUser,
  type OrderDetail,
  type OrderSummary,
} from '@/lib/auth-client';

type Tab = 'orders' | 'details' | 'addresses' | 'password';

const TABS: { id: Tab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'details', label: 'My details' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'password', label: 'Password' },
];

const money = (value: string, currency: string) => {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  const text = n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return currency === 'INR' || !currency ? `₹${text}` : `${currency} ${text}`;
};

const day = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

/** The signed-in customer's area: orders, details, saved addresses and password. */
export function AccountArea() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('orders');

  useEffect(() => {
    let live = true;
    currentUser().then((u) => {
      if (!live) return;
      setUser(u);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  if (!ready) {
    return (
      <div className="wrap page-title" aria-busy="true">
        <h1 className="d">
          Your <span className="hl">account</span>
        </h1>
        <p>Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="wrap page-title">
        <h1 className="d">
          Your <span className="hl">account</span>
        </h1>
        <p>Sign in to see your orders and saved details.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link className="btn btn-primary" href="/login">
            Sign in or create account
          </Link>
          <Link className="btn" href="/shop">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrap page-title">
        <h1 className="d">
          Your <span className="hl">account</span>
        </h1>
        <p>
          Signed in as <b>{user.name || user.email}</b> ({user.email}).
        </p>
        {user.email_verified === false && <ConfirmBanner email={user.email} />}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <Link className="btn btn-primary" href="/shop">
            Keep shopping
          </Link>
          <button type="button" className="btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      <section className="wrap" style={{ paddingBottom: 'var(--sec)' }} aria-label="Your account">
        <div
          className="job-pick"
          role="tablist"
          aria-label="Account sections"
          style={{ marginBottom: 20 }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="pill"
              aria-selected={tab === t.id}
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="info-card acct-panel">
          {tab === 'orders' && <OrdersPanel email={user.email} />}
          {tab === 'details' && <DetailsPanel user={user} onChange={setUser} />}
          {tab === 'addresses' && <AddressesPanel user={user} onChange={setUser} />}
          {tab === 'password' && <PasswordPanel />}
        </div>
      </section>
    </>
  );
}

// ---------- orders ----------

function OrdersPanel({ email }: { email: string }) {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<OrderDetail | null>(null);
  const [opening, setOpening] = useState(0);

  useEffect(() => {
    let live = true;
    fetchOrders().then((r) => {
      if (!live) return;
      setOrders(r.orders);
      setError(r.error ?? '');
    });
    return () => {
      live = false;
    };
  }, []);

  const view = async (id: number) => {
    setOpening(id);
    const r = await fetchOrder(id);
    setOpening(0);
    if (r.order) {
      setOpen(r.order);
      setError('');
    } else setError(r.error ?? 'We could not load that order.');
  };

  if (open) return <OrderView order={open} email={email} onBack={() => setOpen(null)} />;
  if (orders === null) return <p aria-busy="true">Loading your orders…</p>;
  if (error && orders.length === 0) {
    return (
      <p className="err" role="alert">
        {error}
      </p>
    );
  }
  if (orders.length === 0) {
    return (
      <>
        <h2>No orders yet</h2>
        <p className="muted">When you place an order it will show up here, with its status.</p>
        <Link className="btn btn-primary" href="/shop">
          Shop ready-made
        </Link>
      </>
    );
  }
  return (
    <>
      <h2>Your orders</h2>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <ul className="order-list">
        {orders.map((o) => (
          <li key={o.id} className="order-row">
            <div>
              <b>Order #{o.number}</b>
              <span className="muted">
                {' '}
                · {day(o.date)} · {o.item_count} {o.item_count === 1 ? 'item' : 'items'}
              </span>
              <div>
                <span className="tag">{o.status_label}</span>{' '}
                <span className="muted">{o.payment_method}</span>
              </div>
            </div>
            <div className="order-side">
              <b>{money(o.total, o.currency)}</b>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => view(o.id)}
                disabled={opening === o.id}
              >
                {opening === o.id ? 'Opening…' : 'View'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function AddressBlock({ title, a }: { title: string; a: Address }) {
  const lines = [
    [a.first_name, a.last_name].filter(Boolean).join(' '),
    a.company,
    a.address_1,
    a.address_2,
    [a.city, a.state, a.postcode].filter(Boolean).join(', '),
    a.country,
    a.phone,
  ].filter(Boolean);
  return (
    <div>
      <h3 className="label">{title}</h3>
      {lines.length ? (
        lines.map((l, i) => <div key={i}>{l}</div>)
      ) : (
        <span className="muted">Not given</span>
      )}
    </div>
  );
}

/** Statuses in which the GST invoice can be downloaded (the same rule as the order page). */
function canInvoice(o: OrderDetail): boolean {
  return (
    ['in-transit', 'completed'].includes(o.status) ||
    (o.status === 'processing' && o.date_paid !== '' && o.payment_method !== 'cod')
  );
}

function OrderView({
  order,
  email,
  onBack,
}: {
  order: OrderDetail;
  email: string;
  onBack: () => void;
}) {
  const catalogue = useLiveProducts([]);
  const cart = useCart();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const invoice = async () => {
    setBusy(true);
    setNote('');
    const error = await downloadInvoice({ order: String(order.number), contact: email });
    setBusy(false);
    if (error) setNote(error);
  };

  const reorder = () => {
    let added = 0;
    const missing: string[] = [];
    for (const it of order.items) {
      const p = catalogue.find((x) => x.id === `wc-${it.product_id}`);
      if (!p || !p.price) {
        missing.push(it.name);
        continue;
      }
      for (let n = 0; n < it.quantity; n++) {
        cart.add({
          id: p.id,
          slug: productSlug(p),
          name: p.name,
          mode: p.modes[0],
          price: p.price,
          image: p.images?.[0],
          madeToOrder: !p.inStock,
        });
      }
      added++;
    }
    setNote(
      missing.length
        ? `Added ${added} ${added === 1 ? 'item' : 'items'} to your cart. Not available now: ${missing.join(', ')}.`
        : `Added ${added} ${added === 1 ? 'item' : 'items'} to your cart.`,
    );
  };

  return (
    <>
      <button type="button" className="link-btn" onClick={onBack}>
        ← All orders
      </button>
      <h2>Order #{order.number}</h2>
      <div className="btn-row" style={{ margin: '12px 0' }}>
        {canInvoice(order) && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={invoice}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? 'Preparing…' : 'Download GST invoice (PDF)'}
          </button>
        )}
        <button type="button" className="btn btn-primary btn-sm" onClick={reorder}>
          Reorder these items
        </button>
      </div>
      {note && (
        <p className="meta" role="status">
          {note}
        </p>
      )}
      <p>
        <span className="tag">{order.status_label}</span>{' '}
        <span className="muted">
          Placed {day(order.date)}
          {order.payment_method ? ` · ${order.payment_method}` : ''}
          {order.date_paid ? ` · Paid ${day(order.date_paid)}` : ''}
        </span>
      </p>
      <ul className="order-list">
        {order.items.map((it, i) => (
          <li key={i} className="order-row">
            <div>
              <b>{it.name}</b> <span className="muted">× {it.quantity}</span>
              {it.meta.map((m) => (
                <div key={m.label} className="muted" style={{ fontSize: 14 }}>
                  {m.label}: {m.value}
                </div>
              ))}
            </div>
            <div className="order-side">
              <b>{money(it.total, order.currency)}</b>
            </div>
          </li>
        ))}
      </ul>
      <dl className="sum-rows" style={{ marginTop: 16 }}>
        <div>
          <dt>Subtotal</dt>
          <dd>{money(order.subtotal, order.currency)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{money(order.shipping_total, order.currency)}</dd>
        </div>
        {Number(order.discount_total) > 0 && (
          <div>
            <dt>Discount</dt>
            <dd>−{money(order.discount_total, order.currency)}</dd>
          </div>
        )}
        <div className="total">
          <dt>Total</dt>
          <dd>{money(order.total, order.currency)}</dd>
        </div>
      </dl>
      <div className="acct-addresses">
        <AddressBlock title="Billing address" a={order.billing} />
        <AddressBlock title="Delivery address" a={order.shipping} />
      </div>
      {order.note && <p className="muted">Your note: {order.note}</p>}
    </>
  );
}

// ---------- details ----------

function DetailsPanel({ user, onChange }: { user: AuthUser; onChange: (u: AuthUser) => void }) {
  return (
    <>
      <h2>My details</h2>
      <p className="muted">Your sign-in email is {user.email}. It cannot be changed here.</p>
      <SimpleForm
        id="profile"
        submitLabel="Save details"
        busyLabel="Saving…"
        successNote="Saved."
        onSubmit={async (v) => {
          const error = await saveProfile({
            first_name: v.first_name,
            last_name: v.last_name,
            phone: v.phone,
          });
          if (!error) {
            onChange({
              ...user,
              first_name: v.first_name,
              last_name: v.last_name,
              phone: v.phone,
              name: `${v.first_name} ${v.last_name}`.trim(),
            });
          }
          return error;
        }}
        fields={[
          {
            name: 'first_name',
            label: 'First name',
            required: true,
            half: true,
            defaultValue: user.first_name ?? '',
            autoComplete: 'given-name',
          },
          {
            name: 'last_name',
            label: 'Last name',
            half: true,
            defaultValue: user.last_name ?? '',
            autoComplete: 'family-name',
          },
          {
            name: 'phone',
            label: 'WhatsApp or phone',
            rule: 'phone',
            type: 'tel',
            defaultValue: user.phone ?? '',
            autoComplete: 'tel',
          },
        ]}
      />
    </>
  );
}

// ---------- addresses ----------

const ADDRESS_FIELDS = (a: Address, withContact: boolean, prefix: string): FieldDef[] => [
  {
    name: 'first_name',
    label: 'First name',
    required: true,
    half: true,
    defaultValue: a.first_name ?? '',
    autoComplete: `${prefix} given-name`,
  },
  {
    name: 'last_name',
    label: 'Last name',
    half: true,
    defaultValue: a.last_name ?? '',
    autoComplete: `${prefix} family-name`,
  },
  {
    name: 'company',
    label: 'Company',
    defaultValue: a.company ?? '',
    autoComplete: `${prefix} organization`,
  },
  {
    name: 'address_1',
    label: 'Address',
    required: true,
    defaultValue: a.address_1 ?? '',
    autoComplete: `${prefix} address-line1`,
  },
  {
    name: 'address_2',
    label: 'Flat, floor, landmark',
    defaultValue: a.address_2 ?? '',
    autoComplete: `${prefix} address-line2`,
  },
  {
    name: 'city',
    label: 'City',
    required: true,
    half: true,
    defaultValue: a.city ?? '',
    autoComplete: `${prefix} address-level2`,
  },
  {
    name: 'state',
    label: 'State',
    required: true,
    half: true,
    defaultValue: a.state ?? '',
    autoComplete: `${prefix} address-level1`,
  },
  {
    name: 'postcode',
    label: 'Pincode',
    required: true,
    half: true,
    defaultValue: a.postcode ?? '',
    autoComplete: `${prefix} postal-code`,
  },
  {
    name: 'country',
    label: 'Country code',
    half: true,
    defaultValue: a.country || 'IN',
    autoComplete: `${prefix} country`,
  },
  ...(withContact
    ? ([
        {
          name: 'email',
          label: 'Billing email',
          rule: 'email',
          type: 'email',
          defaultValue: a.email ?? '',
          autoComplete: 'email',
        },
        {
          name: 'phone',
          label: 'Phone',
          rule: 'phone',
          type: 'tel',
          defaultValue: a.phone ?? '',
          autoComplete: 'tel',
        },
      ] as FieldDef[])
    : []),
];

/** Saved values only, so an empty saved field does not wipe the name we already know. */
const nonEmpty = (a?: Address): Address =>
  Object.fromEntries(Object.entries(a ?? {}).filter(([, v]) => v));

function AddressesPanel({ user, onChange }: { user: AuthUser; onChange: (u: AuthUser) => void }) {
  const save = (type: 'billing' | 'shipping') => async (v: Record<string, string>) => {
    const error = await saveProfile({
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      phone: user.phone ?? '',
      [type]: v,
    });
    if (!error) onChange({ ...user, [type]: v });
    return error;
  };
  return (
    <>
      <h2>Saved addresses</h2>
      <p className="muted">
        Used to fill in checkout for you. Card details are never stored on this site.
      </p>
      <h3 className="label" style={{ marginTop: 18 }}>
        Billing address
      </h3>
      <SimpleForm
        id="billing"
        submitLabel="Save billing address"
        busyLabel="Saving…"
        successNote="Saved."
        onSubmit={save('billing')}
        fields={ADDRESS_FIELDS(
          {
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            email: user.email,
            phone: user.phone ?? '',
            ...nonEmpty(user.billing),
          },
          true,
          'billing',
        )}
      />
      <h3 className="label" style={{ marginTop: 28 }}>
        Delivery address
      </h3>
      <SimpleForm
        id="shipping"
        submitLabel="Save delivery address"
        busyLabel="Saving…"
        successNote="Saved."
        onSubmit={save('shipping')}
        fields={ADDRESS_FIELDS(
          {
            first_name: user.first_name ?? '',
            last_name: user.last_name ?? '',
            ...nonEmpty(user.shipping),
          },
          false,
          'shipping',
        )}
      />
    </>
  );
}

// ---------- password ----------

function PasswordPanel() {
  return (
    <>
      <h2>Change password</h2>
      <SimpleForm
        id="password"
        submitLabel="Change password"
        busyLabel="Saving…"
        successNote="Password changed."
        onSubmit={(v) => changePassword(v.current, v.password, v.confirm)}
        fields={[
          {
            name: 'current',
            label: 'Current password',
            required: true,
            type: 'password',
            autoComplete: 'current-password',
          },
          {
            name: 'password',
            label: 'New password',
            required: true,
            rule: 'password',
            type: 'password',
            autoComplete: 'new-password',
          },
          {
            name: 'confirm',
            label: 'Re-enter new password',
            required: true,
            type: 'password',
            autoComplete: 'new-password',
            match: 'password',
          },
        ]}
      />
    </>
  );
}
