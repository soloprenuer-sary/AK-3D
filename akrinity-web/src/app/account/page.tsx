import type { Metadata } from 'next';
import Link from 'next/link';
import { AccountArea } from '@/components/account/AccountArea';

export const metadata: Metadata = { title: 'Account', robots: { index: false } };

export default function AccountPage() {
  return (
    <main id="main">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Account</span>
      </nav>

      <AccountArea />
    </main>
  );
}
