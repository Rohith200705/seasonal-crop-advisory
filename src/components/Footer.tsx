import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">🌾 Seasonal Crop Advisory</p>
          <p className="mt-2 text-sm text-brand-200">
            Smarter seasons. Better yields. Resilient farms.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Product</p>
          <ul className="space-y-1.5">
            <li>
              <Link href="/advisory" className="hover:text-white">
                Get Advisory
              </Link>
            </li>
            <li>
              <Link href="/crops" className="hover:text-white">
                Crop Catalogue
              </Link>
            </li>
            <li>
              <Link href="/prices" className="hover:text-white">
                Baseline Prices
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Project</p>
          <p className="text-brand-200">
            IT in Agriculture (U24CSP56)
            <br />
            Meenakshi Sundararajan Engineering College
            <br />
            Kodambakkam, Chennai — 600024
          </p>
        </div>
      </div>
      <div className="border-t border-brand-800 px-4 py-4 text-center text-xs text-brand-300">
        Built with Next.js · MongoDB · Python (scikit-learn / XGBoost) — trained on the Kaggle Crop
        Recommendation dataset (2,200 rows, 22 crops).
      </div>
    </footer>
  );
}
