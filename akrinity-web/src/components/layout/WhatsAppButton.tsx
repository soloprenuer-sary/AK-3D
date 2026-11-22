import { site } from '@/lib/site-config';

/** A round WhatsApp button in the corner of every page. Shown only once the owner sets the WhatsApp number. */
export function WhatsAppButton() {
  if (!site.whatsappLink) return null;
  return (
    <a
      className="wa-fab"
      href={`${site.whatsappLink}?text=${encodeURIComponent('Hi Akrinity, I have a question.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" fill="currentColor">
        <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.55 4.18 1.6 6L4 28l7.1-1.86a12 12 0 0 0 4.94 1.06h.01c6.64 0 12.04-5.4 12.04-12.04C28.1 8.4 22.68 3 16.04 3Zm0 21.9a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-4.2 1.1 1.12-4.1-.24-.38a9.86 9.86 0 0 1-1.5-5.2c0-5.46 4.44-9.9 9.92-9.9 5.46 0 9.9 4.44 9.9 9.9 0 5.46-4.44 9.9-9.9 9.9Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.8-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      </svg>
    </a>
  );
}
