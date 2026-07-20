import { useEffect, useState } from "react";
import { MapPin, Phone, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { searchVendorsLive, sourceLabel, type LiveVendor } from "./vendorLive";

export function VendorDiscovery({
  site = "City Labs",
  model,
  onVendors,
}: {
  site?: string;
  model?: string;
  onVendors?: (vendors: LiveVendor[], meta: { searchMode: string; query: string; error?: string }) => void;
}) {
  const [phase, setPhase] = useState<"searching" | "results">("searching");
  const [vendors, setVendors] = useState<LiveVendor[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [searchMode, setSearchMode] = useState("starting");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const runSearch = async () => {
    setBusy(true);
    setPhase("searching");
    setVisibleCount(0);
    setError(undefined);
    const result = await searchVendorsLive({
      site,
      region: "Charlotte MSA",
      category: "laboratory equipment repair",
      model,
    });
    setVendors(result.vendors);
    setSearchMode(result.searchMode);
    setQuery(result.query);
    setError(result.error);
    onVendors?.(result.vendors, { searchMode: result.searchMode, query: result.query, error: result.error });
    setPhase("results");
    setBusy(false);
  };

  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site, model]);

  useEffect(() => {
    if (phase !== "results") return;
    if (visibleCount >= vendors.length) return;
    const tick = window.setTimeout(() => setVisibleCount((count) => count + 1), 280);
    return () => window.clearTimeout(tick);
  }, [phase, visibleCount, vendors.length]);

  const live = searchMode.includes("tavily") || searchMode === "live";

  return (
    <section className="vendor-discovery" aria-label="Live vendor search">
      <div className="section-title">
        <div>
          <span className="eyebrow">Real-time vendor search</span>
          <h2>Find repair shops near your site — then dial them</h2>
        </div>
        <Search />
      </div>

      {phase === "searching" ? (
        <div className="vendor-discovery-search" role="status" aria-live="polite">
          <span className="vendor-discovery-spinner" aria-hidden="true" />
          <p>
            Searching the web for <strong>laboratory equipment repair</strong> near <strong>{site}</strong>…
          </p>
          <small>Uses Tavily live search + your approved vendor list. Phone numbers are extracted when available.</small>
        </div>
      ) : (
        <>
          <p className="vendor-discovery-lede">
            <ShieldCheck size={14} />
            {live
              ? `Live search found ${vendors.length} shops.`
              : `Showing ${vendors.length} vendors (${searchMode}).`}
            {query ? ` Query: “${query}”.` : ""}
          </p>
          {error && <p className="vendor-discovery-note" role="status">{error}</p>}
          <div className="vendor-discovery-grid">
            {vendors.slice(0, visibleCount).map((item) => (
              <article key={`${item.name}-${item.phoneE164 ?? item.phone}`}>
                <header>
                  <strong>{item.name}</strong>
                  <span className="vendor-source">{sourceLabel(item.source)}</span>
                </header>
                <p>{item.discovery}</p>
                <footer>
                  <Phone size={12} /> {item.phone}
                  {item.dialable ? " · dialable" : " · no real phone yet"}
                  {item.rating !== "—" ? ` · ${item.rating}` : ""}
                </footer>
                {item.url && (
                  <a className="vendor-link" href={item.url} target="_blank" rel="noreferrer">
                    <MapPin size={12} /> Source page
                  </a>
                )}
              </article>
            ))}
          </div>
          <div className="vendor-discovery-actions">
            <button type="button" className="secondary-button" disabled={busy} onClick={() => void runSearch()}>
              <RefreshCw size={14} /> Search again
            </button>
            <p className="vendor-discovery-note">
              <b>Dialable</b> = real phone extracted (not a demo 555 number). Click <b>Dial vendor</b> in the call lanes to place an outbound call.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
