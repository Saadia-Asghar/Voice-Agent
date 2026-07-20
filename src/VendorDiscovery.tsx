import { useEffect, useState } from "react";
import { MapPin, Search, ShieldCheck } from "lucide-react";
import { providerCallList } from "./caseModel";

const sources = ["Google Maps", "Yelp", "Approved vendor list"] as const;

export function VendorDiscovery({ site = "City Labs" }: { site?: string }) {
  const [phase, setPhase] = useState<"searching" | "results">("searching");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const showResults = window.setTimeout(() => setPhase("results"), 1400);
    return () => window.clearTimeout(showResults);
  }, []);

  useEffect(() => {
    if (phase !== "results") return;
    if (visibleCount >= providerCallList.length) return;
    const tick = window.setTimeout(() => setVisibleCount((count) => count + 1), 320);
    return () => window.clearTimeout(tick);
  }, [phase, visibleCount]);

  return (
    <section className="vendor-discovery" aria-label="How vendors are found">
      <div className="section-title">
        <div>
          <span className="eyebrow">Vendor discovery</span>
          <h2>How repair shops get on your call list</h2>
        </div>
        <Search />
      </div>

      {phase === "searching" ? (
        <div className="vendor-discovery-search" role="status" aria-live="polite">
          <span className="vendor-discovery-spinner" aria-hidden="true" />
          <p>
            Searching <strong>Google Maps</strong>, <strong>Yelp</strong>, and your <strong>approved vendor list</strong> near {site}…
          </p>
          <small>Demo preview — production uses live APIs. This demo shows the top 3 matches for the SpinPro X2 case.</small>
        </div>
      ) : (
        <>
          <p className="vendor-discovery-lede">
            <ShieldCheck size={14} />
            Found {providerCallList.length} repair shops that service centrifuges near {site}. BenchDial picks the best three and calls them with your locked brief.
          </p>
          <div className="vendor-discovery-grid">
            {providerCallList.slice(0, visibleCount).map((item, index) => (
              <article key={item.name}>
                <header>
                  <strong>{item.name}</strong>
                  <span className="vendor-source">{sources[index] ?? "Directory"}</span>
                </header>
                <p>{item.discovery}</p>
                <footer>
                  <MapPin size={12} /> {item.phone} · {item.rating}
                </footer>
              </article>
            ))}
          </div>
          <p className="vendor-discovery-note">
            <b>You cannot upload vendor PDFs or phone lists yet.</b> Upload is for the repair report only. Vendor numbers come from search + your approved list.
          </p>
        </>
      )}
    </section>
  );
}
