const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <>
        <rect
          x="2.75"
          y="2.75"
          width="18.5"
          height="18.5"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="4.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <path
        fill="currentColor"
        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"
      />
    ),
  },
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.8 7.77L23.2 22h-7.1l-5.56-7.27L4.2 22H1.1l7.27-8.3L.8 2h7.28l5.02 6.64L18.9 2Zm-1.1 18.2h1.73L6.3 3.7H4.44l13.36 16.5Z"
      />
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <path
        fill="currentColor"
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z"
      />
    ),
  },
];

export function SocialLinks({ className }: { className?: string }) {
  return (
    <ul className={className}>
      {socialLinks.map((social) => (
        <li key={social.label}>
          <a
            href={social.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${social.label} (opens in a new tab)`}
            className="flex size-9 items-center justify-center rounded-full border border-cream/15 bg-white/5 text-cream/70 transition-all hover:-translate-y-0.5 hover:border-brand-gold hover:bg-brand-gold hover:text-brand-brown"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-[18px]"
            >
              {social.icon}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
