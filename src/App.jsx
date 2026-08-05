import { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";

const COUNTRY_API =
  "https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,subregion,population,area,flags,currencies,languages,timezones,maps,latlng,demonyms,idd,tld,car,independent,status,continents";

function formatNumber(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US").format(value)
    : "N/A";
}

function getCurrency(country) {
  if (!country?.currencies) return "N/A";
  return Object.entries(country.currencies)
    .map(([code, item]) => `${item.name}${item.symbol ? ` (${item.symbol})` : ""} · ${code}`)
    .join(", ");
}

function getLanguages(country) {
  return country?.languages
    ? Object.values(country.languages).join(", ")
    : "N/A";
}

function getNationality(country) {
  return (
    country?.demonyms?.eng?.m ||
    country?.demonyms?.eng?.f ||
    country?.demonyms?.fra?.m ||
    "N/A"
  );
}

function getCallingCode(country) {
  const root = country?.idd?.root || "";
  const suffixes = country?.idd?.suffixes || [];
  if (!root) return "N/A";
  if (!suffixes.length) return root;
  return suffixes.slice(0, 4).map((suffix) => `${root}${suffix}`).join(", ");
}

export default function App() {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState(
    localStorage.getItem("mapverse-theme") || "dark"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mapverse-theme", theme);
  }, [theme]);

  useEffect(() => {
    async function loadCountries() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(COUNTRY_API);
        if (!response.ok) throw new Error("Country data load failed.");

        const data = await response.json();
        const sorted = data.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );

        setCountries(sorted);
        setSelectedCountry(
          sorted.find((country) => country.cca3 === "ARE") || sorted[0]
        );
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadCountries();
  }, []);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    return countries
      .filter((country) => {
        const currencies = country.currencies
          ? Object.keys(country.currencies).join(" ").toLowerCase()
          : "";
        const languages = country.languages
          ? Object.values(country.languages).join(" ").toLowerCase()
          : "";
        const capital = country.capital?.join(" ").toLowerCase() || "";
        const nationality = getNationality(country).toLowerCase();

        return [
          country.name.common.toLowerCase(),
          country.name.official.toLowerCase(),
          country.cca2.toLowerCase(),
          country.cca3.toLowerCase(),
          capital,
          currencies,
          languages,
          nationality,
        ].some((item) => item.includes(value));
      })
      .slice(0, 10);
  }, [countries, query]);

  function chooseCountry(country) {
    setSelectedCountry(country);
    setQuery("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setSelectedCountry(null)}>
          <span className="brand-icon">◎</span>
          <span>
            <strong>MapVerse</strong>
            <small>Explore every country</small>
          </span>
        </button>

        <button
          className="theme-button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">INTERACTIVE WORLD EXPLORER</p>
          <h1>Explore countries with complete details.</h1>
          <p className="hero-copy">
            Search by country, capital, nationality, currency or language.
          </p>
        </div>

        <div className="stats">
          <div>
            <strong>{countries.length || "—"}</strong>
            <span>Countries</span>
          </div>
          <div>
            <strong>7</strong>
            <span>Continents</span>
          </div>
          <div>
            <strong>1</strong>
            <span>World</span>
          </div>
        </div>
      </section>

      <section className="workspace">
        <div className="map-column">
          <div className="search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country, nationality, capital..."
            />

            {query && (
              <button className="clear-button" onClick={() => setQuery("")}>
                ×
              </button>
            )}

            {query && (
              <div className="search-results">
                {results.length ? (
                  results.map((country) => (
                    <button
                      key={country.cca3}
                      onClick={() => chooseCountry(country)}
                    >
                      <img
                        src={country.flags.svg}
                        alt={`${country.name.common} flag`}
                      />
                      <span>
                        <strong>{country.name.common}</strong>
                        <small>
                          {getNationality(country)} · {country.capital?.[0] || "No capital"}
                        </small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No country found.</p>
                )}
              </div>
            )}
          </div>

          <div className="main-live-map">
            <MapView country={selectedCountry} large />
          </div>
        </div>

        <aside className="details-card">
          {loading ? (
            <div className="state-message">
              <span className="loader" />
              <p>Loading country data...</p>
            </div>
          ) : error ? (
            <div className="state-message error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          ) : selectedCountry ? (
            <>
              <div className="country-cover">
                <img
                  src={selectedCountry.flags.svg}
                  alt={`${selectedCountry.name.common} flag`}
                />
                <div>
                  <p>{selectedCountry.region}</p>
                  <h2>{selectedCountry.name.common}</h2>
                  <span>{selectedCountry.name.official}</span>
                </div>
              </div>

              <div className="nationality-banner">
                <span>Nationality</span>
                <strong>{getNationality(selectedCountry)}</strong>
              </div>

              <div className="detail-grid">
                <article>
                  <span>Capital</span>
                  <strong>{selectedCountry.capital?.[0] || "N/A"}</strong>
                </article>
                <article>
                  <span>Population</span>
                  <strong>{formatNumber(selectedCountry.population)}</strong>
                </article>
                <article>
                  <span>Area</span>
                  <strong>{formatNumber(selectedCountry.area)} km²</strong>
                </article>
                <article>
                  <span>Continent</span>
                  <strong>{selectedCountry.continents?.join(", ") || "N/A"}</strong>
                </article>
                <article>
                  <span>Calling Code</span>
                  <strong>{getCallingCode(selectedCountry)}</strong>
                </article>
                <article>
                  <span>Driving Side</span>
                  <strong className="capitalize">{selectedCountry.car?.side || "N/A"}</strong>
                </article>
                <article>
                  <span>Internet Domain</span>
                  <strong>{selectedCountry.tld?.join(", ") || "N/A"}</strong>
                </article>
                <article>
                  <span>Independent</span>
                  <strong>
                    {selectedCountry.independent === true
                      ? "Yes"
                      : selectedCountry.independent === false
                      ? "No"
                      : "N/A"}
                  </strong>
                </article>
              </div>

              <div className="long-detail">
                <span>Currency</span>
                <strong>{getCurrency(selectedCountry)}</strong>
              </div>

              <div className="long-detail">
                <span>Languages</span>
                <strong>{getLanguages(selectedCountry)}</strong>
              </div>

              <div className="long-detail">
                <span>Region & Subregion</span>
                <strong>
                  {selectedCountry.region || "N/A"}
                  {selectedCountry.subregion ? ` · ${selectedCountry.subregion}` : ""}
                </strong>
              </div>

              <div className="long-detail">
                <span>Coordinates</span>
                <strong>
                  {selectedCountry.latlng?.length === 2
                    ? `${selectedCountry.latlng[0].toFixed(2)}, ${selectedCountry.latlng[1].toFixed(2)}`
                    : "N/A"}
                </strong>
              </div>

              <div className="long-detail">
                <span>Time Zones</span>
                <strong>
                  {selectedCountry.timezones?.slice(0, 4).join(", ") || "N/A"}
                </strong>
              </div>

              <a
                className="maps-link"
                href={selectedCountry.maps?.googleMaps}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps ↗
              </a>
            </>
          ) : (
            <div className="state-message">
              <p>Search and select a country.</p>
            </div>
          )}
        </aside>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} MapVerse</span>
        <span>OpenStreetMap · REST Countries</span>
      </footer>
    </main>
  );
}
