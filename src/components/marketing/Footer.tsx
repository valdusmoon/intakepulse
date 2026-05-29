import Link from "next/link"

export function Footer() {
  const navigation = {
    product: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
    ],
    support: [
      { name: "Contact", href: "/contact" },
      { name: "Email Support", href: "mailto:hello@yourapp.com" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/legal/privacy" },
      { name: "Terms of Service", href: "/legal/terms" },
      { name: "Refund Policy", href: "/legal/refunds" },
    ],
  }

  return (
    <footer
      className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          {/* Brand */}
          <div className="space-y-4 text-center sm:text-left">
            <Link href="/" className="inline-flex items-center gap-2">
              {/* TODO: Replace with your logo */}
              <div className="h-8 w-8 rounded-md bg-primary" />
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                Your<span className="font-normal text-slate-500 dark:text-slate-300">App</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
              {/* TODO: Your app tagline */}
              Your short app description goes here.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12 sm:gap-16">
            <div>
              <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                Product
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm leading-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                Support
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.support.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm leading-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                Legal
              </h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm leading-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-200 dark:border-slate-700 pt-8">
          <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} YourApp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
