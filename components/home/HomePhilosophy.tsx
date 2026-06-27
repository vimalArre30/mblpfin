import Link from "next/link";

export default function HomePhilosophy() {
  return (
    <section className="bg-[#060F20]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="font-playfair text-2xl lg:text-3xl font-bold text-white leading-snug mb-6">
            &ldquo;Every rupee tracked is a decision understood.&rdquo;
          </blockquote>
          <p className="font-inter text-sm text-white/50 mb-10">
            This isn't about guilt-tripping yourself over every coffee.
            It's about knowing — clearly, completely, without friction —
            where your money goes. Knowledge compounds. So does awareness.
          </p>
          <Link
            href="/tracker/login"
            className="font-inter text-sm font-semibold bg-white text-[#060F20] px-6 py-3 rounded-lg hover:bg-white/90 transition-colors inline-block"
          >
            Start tracking today →
          </Link>
        </div>
      </div>
    </section>
  );
}
