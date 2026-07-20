import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, ShieldCheck } from "lucide-react";
import { providerCallList } from "./caseModel";

type DiscoveredVendor = {
  name: string;
  source: string;
  phone: string;
  rating: string;
  detail: string;
};

const SOURCE_LABEL: Record<string, string> = {
  google_maps: "Google Maps",
  yelp: "Yelp",
  approved_list: "Approved list",
  demo_seed: "Demo seed",
};

export function VendorDiscovery({ site = "City Labs" }: { site?: string }) {
  const [phase, setPhase] = useState<"searching" | "results">("searching");
  const [visibleCount, setVisibleCount] = useState(0);
  const [vendors, setVendors] = useState<DiscoveredVendor[]>(() =>
    providerCallList.map((item, index) => ({
      name: item.name,
      source: ["google_maps", "yelp", "approved_list"][index] ?? "demo_seed",
      phone: item.phone,
      rating: item.rating,
      detail: item.discovery,
    })),
  );
  const [loadSource, setLoadSource] = useState<"local" | "database" | "providers_fallback">("local");

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
    if (!supabaseUrl || !publishableKey) return;

    void (async () => {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/list-vendors?region=Charlotte%20MSA`, {
          headers: { apikey: publishableKey },
        });
        if (!response.ok) return;
        const body = await response.json() as {
          source?: string;
          vendors?: { display_name: string; phone: string | null; source: string; rating: string | null; notes: string | null }[];
        };
        if (!body.vendors?.length) return;
        setLoadSource(body.source === "database" ? "database" : "providers_fallback");
        setVendors(body.vendors.slice(0, 3).map((row) => ({
          name: row.display_name,
          source: row.source,
          phone: row.phone ?? "—",
          rating: row.rating ?? "—",
          detail: row.notes ?? "Matched for laboratory equipment repair near your site.",
        })));
      } catch {
        // Keep local fixture list
      }
    })();
  }, []);

  useEffect(() => {
    const showResults = window.setTimeout(() => setPhase("results"), 1400);
    return () => window.clearTimeout(showResults);
  }, []);

  useEffect(() => {
    if (phase !== "results") return;
    if (visibleCount >= vendors.length) return;
    const tick = window.setTimeout(() => setVisibleCount((count) => count + 1), 320);
    return () => window.clearTimeout(tick);
  }, [phase, visibleCount, vendors.length]);

  const sourceNote = useMemo(() => {
    if (loadSource === "database") return "Loaded from your approved vendor list in Postgres.";
    if (loadSource === "providers_fallback") return "Loaded from seeded demo providers in Postgres.";
    return "Showing local demo vendors — connect Supabase to load from database.";
  }, [loadSource]);

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
          <small>{sourceNote}</small>
        </div>
      ) : (
        <>
          <p className="vendor-discovery-lede">
            <ShieldCheck size={14} />
            Found {vendors.length} repair shops that service centrifuges near {site}. BenchDial picks the best three and calls them with your locked brief.
          </p>
          <div className="vendor-discovery-grid">
            {vendors.slice(0, visibleCount).map((item) => (
              <article key={item.name}>
                <header>
                  <strong>{item.name}</strong>
                  <span className="vendor-source">{SOURCE_LABEL[item.source] ?? item.source}</span>
                </header>
                <p>{item.detail}</p>
                <footer>
                  <MapPin size={12} /> {item.phone} · {item.rating}
                </footer>
              </article>
            ))}
          </div>
          <p className="vendor-discovery-note">
            <b>Upload is for repair reports only.</b> Vendor numbers come from search + your approved list in the database.
          </p>
        </>
      )}
    </section>
  );
}
