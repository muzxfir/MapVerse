import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_API =
  "https://restcountries.com/v3.1/all?fields=name,cca2,cca3,ccn3,capital,region,subregion,population,area,flags,currencies,languages,timezones,maps,latlng";

function formatNumber(value) {
  if (!Number.isFinite(value)) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
}

function getCurrency(country) {
  const currencies = country?.currencies;
  if (!currencies) return "N/A";
  return Object.values(currencies)
    .map((item) => `${item.name}${item.symbol ? ` (${item.symbol})` : ""}`)
    .join(", ");
}

function getLanguages(country) {
  if (!country?.languages) return "N/A";
  return Object.values(country.languages).join(", ");
}

function normalizeId(value) {
  if (value === undefined || value === null) return "";
  return String(value).padStart(3, "0");
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
  const [position, setPosition] = useState({
    coordinates: [0, 18],
    zoom: 1,
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mapverse-theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    async function loadCountries() {
      try {
        setLoading(true);
        const response = await fetch(COUNTRY_API);

        if (!response.ok) {
          throw new Error("Country data could not be loaded.");
        }

        const data = await response.json();
        const sorted = [...data].sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );

        if (active) {
          setCountries(sorted);
          setSelectedCountry(
            sorted.find((country) => country.cca3 === "ARE") || sorted[0]
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCountries();
    return () => {
      active = false;
    };
  }, []);

  const countryByNumericCode = useMemo(() => {
    const map = new Map();

    countries.forEach((country) => {
      if (country.ccn3) {
        map.set(normalizeId(country.ccn3), country);
      }
    });

    return map;
  }, [countries]);

  const filteredCountries = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return countries.slice(0, 8);

    return countries
      .filter((country) => {
        const name = country.name.common.toLowerCase();
        const official = country.name.official.toLowerCase();
        return (
          name.includes(value) ||
          official.includes(value) ||
          country.cca2.toLowerCase() === value ||
          country.cca3.toLowerCase() === value
        );
      })
      .slice(0, 8);
  }, [countries, query]);

  function selectCountry(country) {
    if (!country) return;

    setSelectedCountry(country);
    setQuery(country.name.common);

    if (Array.isArray(country.latlng) && country.latlng.length === 2) {
      setPosition({
        coordinates: [country.latlng[1], country.latlng[0]],
        zoom: 3,
      });
    }
  }

  function handleMoveEnd(nextPosition) {
    setPosition(nextPosition);
  }

  function resetMap() {
    setPosition({ coordinates: [0, 18], zoom: 1 });
    setQuery("");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={resetMap} aria-label="Reset map">
          <span className="brand-icon">◉</span>
          <span>
            <strong>MapVerse</strong>
            <small>Explore every country</small>
          </span>
        </button>

        <button
          className="theme-button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle color theme"
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">INTERACTIVE WORLD EXPLORER</p>
          <h1>Discover the world, one country at a time.</h1>
          <p className="hero-copy">
            Search or select a country on the map to view its flag, capital,
            population, currency, languages and more.
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
              placeholder="Search country, code..."
              aria-label="Search countries"
            />
            {query && (
              <button
                className="clear-button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            {query && (
              <div className="search-results">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.cca3}
                      onClick={() => selectCountry(country)}
                    >
                      <img
                        src={country.flags.svg}
                        alt={`${country.name.common} flag`}
                      />
                      <span>
                        <strong>{country.name.common}</strong>
                        <small>{country.region}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No country found.</p>
                )}
              </div>
            )}
          </div>

          <div className="map-card">
            {loading ? (
              <div className="state-message">
                <span className="loader" />
                <p>Loading world map...</p>
              </div>
            ) : error ? (
              <div className="state-message error">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                  Try again
                </button>
              </div>
            ) : (
              <>
                <ComposableMap
                  projectionConfig={{ scale: 145 }}
                  aria-label="Interactive world map"
                >
                  <ZoomableGroup
                    center={position.coordinates}
                    zoom={position.zoom}
                    onMoveEnd={handleMoveEnd}
                    minZoom={1}
                    maxZoom={7}
                  >
                    <Geographies geography={GEO_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const numericCode = normalizeId(geo.id);
                          const country = countryByNumericCode.get(numericCode);
                          const isSelected =
                            country?.cca3 === selectedCountry?.cca3;

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onClick={() => selectCountry(country)}
                              className={country ? "map-country" : ""}
                              tabIndex={country ? 0 : -1}
                              onKeyDown={(event) => {
                                if (
                                  country &&
                                  (event.key === "Enter" ||
                                    event.key === " ")
                                ) {
                                  selectCountry(country);
                                }
                              }}
                              style={{
                                default: {
                                  fill: isSelected
                                    ? "var(--map-selected)"
                                    : "var(--map-land)",
                                  outline: "none",
                                  stroke: "var(--map-stroke)",
                                  strokeWidth: 0.45,
                                },
                                hover: {
                                  fill: country
                                    ? "var(--map-hover)"
                                    : "var(--map-land)",
                                  outline: "none",
                                  cursor: country ? "pointer" : "default",
                                  stroke: "var(--map-stroke)",
                                  strokeWidth: 0.55,
                                },
                                pressed: {
                                  fill: "var(--map-selected)",
                                  outline: "none",
                                },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>

                <div className="map-controls">
                  <button
                    onClick={() =>
                      setPosition((current) => ({
                        ...current,
                        zoom: Math.min(current.zoom * 1.5, 7),
                      }))
                    }
                  >
                    +
                  </button>
                  <button
                    onClick={() =>
                      setPosition((current) => ({
                        ...current,
                        zoom: Math.max(current.zoom / 1.5, 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <button onClick={resetMap} title="Reset map">
                    ⟳
                  </button>
                </div>

                <p className="map-hint">
                  Drag to move · Scroll or use buttons to zoom
                </p>
              </>
            )}
          </div>
        </div>

        <aside className="details-card">
          {selectedCountry ? (
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
                  <span>Subregion</span>
                  <strong>{selectedCountry.subregion || "N/A"}</strong>
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
                <span>Time zones</span>
                <strong>
                  {selectedCountry.timezones?.slice(0, 3).join(", ") || "N/A"}
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
              <p>Select a country to view details.</p>
            </div>
          )}
        </aside>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} MapVerse</span>
        <span>Built with React · REST Countries</span>
      </footer>
    </main>
  );
}
