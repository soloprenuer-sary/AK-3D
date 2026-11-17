import type { Metadata } from 'next';
import { LegalPage, type LegalSection } from '@/components/layout/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Akrinity collects, uses and protects your personal information.',
};

const NEEDED = [
  'Legal name of the business and its registered address',
  'GSTIN and, if registered, the company or LLP number',
  'Name, email and phone of the grievance officer (required under Indian law)',
  'The email and phone customers should write to about their data',
  'The payment gateway used (for example Razorpay, PhonePe, PayU) and whether card details ever touch our server',
  'Courier partners used for delivery',
  'Analytics, advertising or chat tools used on the site (each one collects data)',
  'Email and SMS providers used for order and marketing messages',
  'Where data is stored (the website host, the WordPress host, and whether any of it is outside India)',
  'How long each kind of data is kept (orders and tax records, uploaded 3D files, marketing lists)',
  'Whether anyone under 18 may order, and who consents for them',
  'What happens if there is a data breach, and who is told',
];

const SECTIONS: LegalSection[] = [
  {
    id: 'who',
    heading: 'Who we are',
    body: [
      '[[LEGAL ENTITY NAME]] ("Akrinity", "we", "us") runs this website and the 3D printing studio behind it. Our registered address is [[REGISTERED ADDRESS]], Mumbai, India.',
      'This policy explains what personal information we collect when you use akrinity.in, why we collect it, who we share it with, and the choices you have. It follows the Digital Personal Data Protection Act, 2023 and other Indian law that applies to us.',
    ],
  },
  {
    id: 'collect',
    heading: 'Information we collect',
    body: [
      'We collect only what we need to run the shop and make your order.',
      [
        'Account details: your name, email address, phone number and password (the password is stored in a protected form, never as plain text).',
        'Order details: the products you order, delivery and billing addresses, and your GSTIN if you give one for a GST invoice.',
        'Quote and design requests: what you ask for, your measurements and notes, and the files you upload.',
        'Messages you send us through the contact, quote or business forms.',
        'Technical data: your device type, browser, approximate location from your IP address and the pages you visit, collected through cookies (see below).',
        'Payment status from our payment provider. We do not store your full card number, UPI PIN or net-banking password. [[CONFIRM WITH PAYMENT GATEWAY]]',
      ],
    ],
  },
  {
    id: 'use',
    heading: 'How we use your information',
    body: [
      [
        'To create and manage your account and to sign you in.',
        'To take, print, pack, ship and invoice your orders, and to tell you about their progress.',
        'To prepare quotes and to model or repair files you send us.',
        'To answer your questions and handle returns, refunds and complaints.',
        'To send order and account emails. These are not marketing.',
        'To send offers and news, only if you agree. You can stop at any time.',
        'To keep the site secure, prevent fraud and fix problems.',
        'To meet legal duties, such as tax and accounting records.',
      ],
    ],
  },
  {
    id: 'consent',
    heading: 'Consent and your choices',
    body: [
      'We process your information with your consent, or where the law allows it because you asked for a service (for example, an order) or because we must keep records.',
      'You can withdraw consent at any time by writing to [[PRIVACY EMAIL]]. Withdrawing consent does not affect what we did before you withdrew it, and we may still need to keep some records the law requires.',
      'We ask separately before sending marketing messages. Account and order messages are not marketing.',
    ],
  },
  {
    id: 'share',
    heading: 'Who we share it with',
    body: [
      'We do not sell your personal information. We share it only with the services that help us run the shop, and only what they need:',
      [
        'Payment provider: [[PAYMENT GATEWAY NAME]], to take your payment.',
        'Courier partners: [[COURIER NAMES]], to deliver your order (your name, address and phone number).',
        'Email and messaging providers: [[EMAIL / SMS PROVIDER]], to send order and account messages.',
        'Website and hosting providers: our website is hosted on [[WEBSITE HOST]] and our store data on [[WORDPRESS HOST]].',
        'Our accountant and tax advisers, where needed for records.',
        'Authorities, when the law requires it.',
      ],
    ],
  },
  {
    id: 'files',
    heading: 'Your 3D files',
    body: [
      'Files you upload for a quote or an order are private. Only you and the studio team can open them. We use them only to quote and make your order.',
      'We delete uploaded files [[FILE RETENTION PERIOD]] after your order is complete or your quote expires, unless you ask us to keep them. See also the {{/terms/files|file terms}}.',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookies and similar technology',
    body: [
      'We use a small number of cookies:',
      [
        'Essential: keep you signed in and remember your cart. The site does not work without them.',
        'Analytics: [[ANALYTICS TOOL, OR "NONE"]], to see which pages are used. Only with your consent where the law requires it.',
        'Security: help us block automated abuse of sign-up and contact forms.',
      ],
      'You can clear or block cookies in your browser settings, but parts of the site may then stop working.',
    ],
  },
  {
    id: 'keep',
    heading: 'How long we keep information',
    body: [
      [
        'Account details: while your account is open, and for [[PERIOD]] after you close it.',
        'Order and invoice records: [[PERIOD, AT LEAST AS THE TAX LAW REQUIRES]].',
        'Quote requests and messages: [[PERIOD]].',
        'Uploaded files: see "Your 3D files" above.',
        'Marketing contact details: until you unsubscribe.',
      ],
    ],
  },
  {
    id: 'rights',
    heading: 'Your rights',
    body: [
      'You can ask us to:',
      [
        'tell you what personal information we hold about you,',
        'correct information that is wrong or out of date,',
        'delete your information, where we are not required to keep it,',
        'stop sending you marketing messages,',
        'nominate someone to act for you if you cannot.',
      ],
      'Write to [[PRIVACY EMAIL]]. We may ask you to confirm who you are first. You can also change your details yourself in your {{/account|account}}.',
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    body: [
      "[[CONFIRM POLICY]] Our shop is meant for adults. If you are under 18, please ask a parent or guardian to place orders for you. We do not knowingly collect information from children without a parent or guardian's consent.",
    ],
  },
  {
    id: 'security',
    heading: 'How we protect your information',
    body: [
      'We use encrypted connections (HTTPS), store passwords in a protected form, limit who can open your data and files, and use rate limits and checks to block abuse. No system is perfectly secure. If a breach affects your information we will tell you and the authorities as the law requires.',
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    body: [
      'We may update this policy. The "last updated" date at the top shows when. If a change matters to you we will tell you by email or on the site.',
    ],
  },
  {
    id: 'grievance',
    heading: 'Grievance officer and contact',
    body: [
      'If you have a question or complaint about your information, contact our grievance officer:',
      [
        'Name: [[GRIEVANCE OFFICER NAME]]',
        'Email: [[GRIEVANCE EMAIL]]',
        'Phone: [[PHONE]]',
        'Address: [[REGISTERED ADDRESS]]',
      ],
      'We aim to reply within [[NUMBER]] days. See also the {{/grievance|grievance page}}.',
    ],
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What we collect, why we collect it, who sees it, and what you can ask us to do with it."
      needed={NEEDED}
      sections={SECTIONS}
    />
  );
}
