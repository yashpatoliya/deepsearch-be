import { useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const useCaseOptions = [
  {
    value: "all",
    label: "All",
    categories: [
      "social_media",
      "web_mentions",
      "professional",
      "education",
      "dating_profiles",
      "family_relations",
      "business_profiles",
      "location_history",
    ],
  },
  { value: "education", label: "Education", categories: ["education"] },
  { value: "public_mentions", label: "Public mentions", categories: ["web_mentions"] },
  { value: "business", label: "Business", categories: ["business_profiles", "professional"] },
  { value: "social_media", label: "Social Media", categories: ["social_media"] },
  { value: "dating_lite", label: "Dating lite", categories: ["dating_profiles"] },
  { value: "family", label: "Family", categories: ["family_relations"] },
];

const popularSearches = [
  { name: "Elon Musk", description: "Entrepreneur" },
  { name: "Lady Gaga", description: "Singer" },
  { name: "MrBeast", description: "YouTuber" },
  { name: "Taylor Swift", description: "Singer" },
  { name: "Grant Cardone", description: "Investor" },
];

function App() {
  const [query, setQuery] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState(["all"]);
  const [advancedSearch, setAdvancedSearch] = useState({
    location: "",
    education: "",
    professionalBackground: "",
  });
  const [messages, setMessages] = useState([
    {
      id: "system",
      role: "assistant",
      content:
        "Ask anything about a person. Results are fetched from the live backend.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState("idle");
  const [jobProgress, setJobProgress] = useState(0);
  const [error, setError] = useState(null);
  const [rawReport, setRawReport] = useState(null);

  const selectedUseCasesView = useMemo(
    () =>
      useCaseOptions.map((option) => ({
        ...option,
        selected: selectedUseCases.includes(option.value),
      })),
    [selectedUseCases],
  );

  const toggleUseCase = (value) => {
    setSelectedUseCases((prev) => {
      if (value === "all") {
        return ["all"];
      }
      if (prev.includes("all")) {
        return [value];
      }
      if (prev.includes(value)) {
        return prev.filter((selected) => selected !== value);
      }
      return [...prev, value];
    });
  };

  const selectedCategories = useMemo(() => {
    const categories = new Set();
    selectedUseCases.forEach((useCase) => {
      const option = useCaseOptions.find((item) => item.value === useCase);
      option?.categories.forEach((category) => categories.add(category));
    });
    if (selectedUseCases.includes("all")) {
      useCaseOptions
        .find((option) => option.value === "all")
        ?.categories.forEach((category) => categories.add(category));
    }
    return Array.from(categories);
  }, [selectedUseCases]);

  const addMessage = (message) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, ...message },
    ]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setError(null);
    setLoading(true);
    setJobId(null);
    setRawReport(null);
    setJobStatus("queued");
    setJobProgress(5);

    addMessage({ role: "user", content: query });

    try {
      const response = await fetch(`${API_BASE}/api/v1/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          categories: selectedCategories,
          advanced_search: {
            location: advancedSearch.location.trim() || undefined,
            education: advancedSearch.education.trim() || undefined,
            professional_background:
              advancedSearch.professionalBackground.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to create search job");
      }

      const data = await response.json();
      setJobId(data.jobId);
      setJobStatus("processing");
      addMessage({
        role: "assistant",
        content: `Search job queued: ${data.jobId}. Waiting for results...`,
      });

      const result = await pollJob(data.jobId);
      if (result) {
        addMessage({
          role: "assistant",
          content: "Search completed. Here is the summarized result.",
        });
        setRawReport(result);
      }
    } catch (err) {
      setError(err.message || "Search request failed");
      setJobStatus("failed");
      addMessage({ role: "assistant", content: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const pollJob = async (jobId) => {
    const maxAttempts = 20;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const statusResponse = await fetch(
        `${API_BASE}/api/v1/search/job/${jobId}/status`,
      );
      if (!statusResponse.ok) break;
      const statusData = await statusResponse.json();
      setJobStatus(statusData.status || "processing");
      setJobProgress(statusData.progress || 0);

      if (statusData.status === "completed") {
        return await fetchResult(jobId);
      }
      if (statusData.status === "failed") {
        throw new Error("Search job failed to complete");
      }
    }

    throw new Error("Search timed out. Please try again later.");
  };

  const fetchResult = async (jobId) => {
    const response = await fetch(`${API_BASE}/api/v1/search/job/${jobId}/result`);
    if (!response.ok) {
      throw new Error("Failed to fetch search result");
    }
    return response.json();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-row">
            <span className="brand-logo">deepsearch</span>
            <button className="menu-icon" type="button" aria-label="Menu">
              <span />
              <span />
              <span />
            </button>
          </div>
          <button
            className="new-search-btn"
            type="button"
            onClick={() => {
              setQuery("");
              setRawReport(null);
              setJobId(null);
              setError(null);
              setJobStatus("idle");
              setJobProgress(0);
            }}
            disabled={loading}
          >
            New Search
          </button>
        </div>

        <div className="sidebar-nav">
          <button type="button" className="nav-item">
            <span className="nav-icon">★</span>
            Saved
          </button>
          <button type="button" className="nav-item">
            <span className="nav-icon">⟳</span>
            History
          </button>
        </div>

        <div className="sidebar-footer">
          <button type="button" className="pro-btn" disabled={loading}>
            Go Pro →
          </button>
        </div>
      </aside>

      <main className="main-content">
        <section className="hero-panel">
          <div className="hero-copy">
            <h1>Who are you looking for?</h1>
          </div>

          <div className="hero-card">
            <form className="hero-form" onSubmit={handleSubmit}>
              <div className="search-field">
                <span className="search-prefix">🔍</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Full Name"
                  disabled={loading}
                />
                <button type="submit" disabled={loading}>
                  Enter
                </button>
              </div>

              <div className="advanced-fields">
                <input
                  type="text"
                  value={advancedSearch.location}
                  onChange={(e) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Location"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={advancedSearch.education}
                  onChange={(e) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      education: e.target.value,
                    }))
                  }
                  placeholder="Education"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={advancedSearch.professionalBackground}
                  onChange={(e) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      professionalBackground: e.target.value,
                    }))
                  }
                  placeholder="Professional Background"
                  disabled={loading}
                />
              </div>

              <div className="usecase-row">
                {selectedUseCasesView.map((useCase) => (
                  <button
                    key={useCase.value}
                    type="button"
                    className={useCase.selected ? "chip active" : "chip"}
                    onClick={() => toggleUseCase(useCase.value)}
                    disabled={loading}
                  >
                    {useCase.label}
                  </button>
                ))}
              </div>

              {jobStatus !== "idle" && (
                <div className="search-status">
                  <span className="loader-dot" />
                  <span>
                    {jobStatus === "queued" && "Queued for processing"}
                    {jobStatus === "processing" && "Processing search results"}
                    {jobStatus === "completed" && "Processing complete"}
                    {jobStatus === "failed" && "Search failed"}
                    {jobStatus !== "completed" && jobProgress
                      ? ` · ${jobProgress}%`
                      : ""}
                  </span>
                </div>
              )}
            </form>
          </div>

          <div className="popular-section">
            <div className="popular-heading">
              <h2>Popular Searches</h2>
            </div>
            <div className="popular-grid">
              {popularSearches.map((item) => (
                <div className="popular-card" key={item.name}>
                  <div className="popular-avatar" />
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && <div className="error-banner">{error}</div>}

        {rawReport && (
          <section className="report-panel">
            <div className="report-summary">
              <div>
                <h2>Summary</h2>
                <p>{rawReport.summary}</p>
              </div>
              <div className="analysis-grid">
                <div>
                  <strong>Risk score</strong>
                  <p>{rawReport.aiAnalysis.riskScore}</p>
                </div>
                <div>
                  <strong>Duplicate detected</strong>
                  <p>{rawReport.aiAnalysis.duplicateDetection ? "Yes" : "No"}</p>
                </div>
                <div>
                  <strong>Total results</strong>
                  <p>{rawReport.metadata.totalResults}</p>
                </div>
              </div>
            </div>

            <div className="result-list">
              {rawReport.results.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <h4>{result.identity?.fullName || `Result ${index + 1}`}</h4>
                    <span className="badge">
                      {result.publicMentions?.[0]?.source || "Person"}
                    </span>
                  </div>
                  <p className="result-snippet">
                    {result.publicMentions?.[0]?.snippet || "Profile details found."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
