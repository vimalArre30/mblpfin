import PricingClient from "./PricingClient";

export const metadata = {
  title: "Pricing — MBL PFin",
  description: "Unlimited entries. Full analytics. Always private.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0F1E40] font-inter text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* Hero */}
        <div className="text-center">
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-3">
            Upgrade to MBL PFin Pro
          </h1>
          <p className="text-white/50 text-base sm:text-lg">
            Unlimited entries. Full analytics. Always private.
          </p>
        </div>

        <PricingClient />
      </div>
    </div>
  );
}
