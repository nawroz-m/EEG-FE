import { useState } from "react";

const DATASET_COMPOSITION = [
  {
    set: "A",
    label: 1,
    electrode: "Scalp (10–20)",
    state: "Baseline, eyes open",
    color: "#22c55e",
  },
  {
    set: "B",
    label: 2,
    electrode: "Scalp (10–20)",
    state: "Baseline, eyes closed",
    color: "#3b82f6",
  },
  {
    set: "C",
    label: 3,
    electrode: "Depth (hippocampal)",
    state: "Non-seizure, outside focus",
    color: "#f59e0b",
  },
  {
    set: "D",
    label: 4,
    electrode: "Depth (hippocampal)",
    state: "Non-seizure, within focus",
    color: "#f97316",
  },
  {
    set: "E",
    label: 5,
    electrode: "Depth (epileptogenic)",
    state: "During seizure",
    color: "#ef4444",
  },
];

const MODELS = [
  {
    key: "svm_lin",
    label: "SVM Linear",
    description: "kernel=linear, C=1.0, OvO",
    paramGrid: { C: [0.1, 1, 10] },
    bestParams: { C: 1 },
  },
  {
    key: "svm_rbf",
    label: "SVM RBF",
    description: "kernel=rbf, C=1.0, OvO",
    paramGrid: { C: [0.1, 1, 10], gamma: [1, 0.1, 0.01] },
    bestParams: { C: 10, gamma: 0.01 },
  },
  {
    key: "tree",
    label: "Decision Tree",
    description: "gini, max_depth=20",
    paramGrid: { max_depth: [5, 10, 20] },
    bestParams: { max_depth: 20 },
  },
  {
    key: "knn",
    label: "k-NN",
    description: "k=5, Minkowski p=2",
    paramGrid: { n_neighbors: [3, 5, 7] },
    bestParams: { n_neighbors: 5 },
  },
];
const TRAINING_METHODS = [
  {
    key: "norm",
    label: "Standard classifier",
    description: "default hyperparams",
  },
  {
    key: "grid",
    label: "Grid Search CV",
    description: "5-fold, exhaustive param grid",
    badge: "recommended",
  },
];

type DUMMY_RESPONSE = {
  y_pred: number[];
  prob: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  }[];
};

function ConfidenceBar({
  value,
  color,
  isTop,
}: {
  value: number;
  color: string;
  isTop: boolean;
}) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}
    >
      <div
        style={{
          flex: 1,
          height: 5,
          background: "#1e293b",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value * 100}%`,
            height: "100%",
            background: isTop ? color : "#334155",
            borderRadius: 99,
            transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: isTop ? "#cbd5e1" : "#475569",
          minWidth: 36,
          textAlign: "right",
          fontFamily: "monospace",
        }}
      >
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "16px 20px",
        flex: 1,
        minWidth: 130,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#f1f5f9",
          fontFamily: "monospace",
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

const api_url = "https://nawroz-m-eeg.hf.space/pred";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("svm_lin");
  const [selectedTraining, setSelectedTraining] = useState("norm");
  const [response, setResponse] = useState<DUMMY_RESPONSE | null>(null);
  const [loading, setLoading] = useState(false);
  const [useDemo, setUseDemo] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };
  const handleUseDemo = async () => {
    try {
      const response = await fetch("/EEG-test-data.xlsx");
      const blob = await response.blob();

      const demoFile = new File([blob], "EEG-test-data.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      setFile(demoFile);
      setUseDemo(true);
    } catch (err) {
      console.error("Failed to load demo file", err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);
    try {
      // Check if a file was selected
      if (!file) {
        alert("Please select a file to upload");
        return;
      }
      //Create FormData and append the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_name", selectedModel); // svm_lin
      formData.append("training", selectedTraining); // norm

      const api_response = await fetch(api_url, {
        method: "POST",
        body: formData,
      });
      const api_responseData = await api_response.json(); // Parse the JSON response
      setResponse(api_responseData?.result);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };
  const probsAsArrays = response?.prob?.map((row) =>
    DATASET_COMPOSITION.map(
      (d) => row[String(d.label) as keyof typeof row] as number,
    ),
  );

  const avgConfidence =
    response && probsAsArrays
      ? response.y_pred.reduce(
          (sum, pred, i) => sum + (probsAsArrays[i][pred - 1] || 0),
          0,
        ) / response.y_pred.length
      : 0;

  const labelCounts = response
    ? DATASET_COMPOSITION.map((d) => ({
        ...d,
        count: response.y_pred.filter((p) => p === d.label).length,
      }))
    : [];

  const dominantClass = labelCounts.length
    ? labelCounts.reduce((a, b) => (a.count >= b.count ? a : b))
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020817",
        color: "#f1f5f9",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "32px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=file]::file-selector-button {
          background: #1e293b; color: #94a3b8; border: 1px solid #334155;
          padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;
        }
        input[type=file]::file-selector-button:hover { background: #334155; }
        input[type=file] { color: #64748b; font-size: 13px; }
        .model-btn:hover { border-color: #334155 !important; background: #0f172a !important; }
        .signal-card:hover { background: #080d1a !important; border-color: #334155 !important; }
        .run-btn:hover:not(:disabled) { background: #2563eb !important; }
        .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "#22c55e",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontWeight: 500,
              }}
            >
              Bonn EEG Dataset
            </span>
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
            }}
          >
            EEG Signal Classifier
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
            Upload an Excel file of EEG features, select a model, and get
            per-signal class predictions with probability scores.
          </p>
        </div>

        {/* Dataset Legend */}
        <div
          style={{
            background: "#0a0f1e",
            border: "1px solid #1e293b",
            borderRadius: 14,
            padding: "18px 22px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            Classes — Sets A to E
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DATASET_COMPOSITION.map((d) => (
              <div
                key={d.set}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#0f172a",
                  border: `1px solid ${d.color}30`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  flex: "1 1 130px",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: d.color + "20",
                    border: `1.5px solid ${d.color}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{ fontSize: 11, fontWeight: 700, color: d.color }}
                  >
                    {d.set}
                  </span>
                </div>
                <div>
                  <div
                    style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1" }}
                  >
                    {d.state}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    {d.electrode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Selector */}
        <div
          style={{
            background: "#0a0f1e",
            border: "1px solid #1e293b",
            borderRadius: 14,
            padding: "18px 22px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            Training method
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {TRAINING_METHODS.map((t) => {
              const active = selectedTraining === t.key;
              return (
                <button
                  key={t.key}
                  className="model-btn"
                  onClick={() => setSelectedTraining(t.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: active ? "#1e3a5f" : "#0f172a",
                    border: `1.5px solid ${active ? "#3b82f6" : "#1e293b"}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1.5px solid ${active ? "#3b82f6" : "#334155"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: active ? "#3b82f6" : "transparent",
                        transition: "background 0.15s",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: active ? "#93c5fd" : "#94a3b8",
                      }}
                    >
                      {t.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: active ? "#60a5fa80" : "#334155",
                        marginTop: 2,
                        fontFamily: "monospace",
                      }}
                    >
                      {t.description}
                    </div>
                  </div>
                  {t.badge && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "#1e3a5f",
                        color: "#60a5fa",
                        border: "1px solid #3b82f620",
                        flexShrink: 0,
                      }}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 12,
            }}
          >
            Algorithm
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODELS.map((m) => {
              const active = selectedModel === m.key;
              const isGSCV = selectedTraining === "grid";
              return (
                <button
                  key={m.key}
                  className="model-btn"
                  onClick={() => setSelectedModel(m.key)}
                  style={{
                    flex: "1 1 140px",
                    background: active ? "#1e3a5f" : "#0f172a",
                    border: `1.5px solid ${active ? "#3b82f6" : "#1e293b"}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: active ? "#93c5fd" : "#94a3b8",
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: active ? "#60a5fa80" : "#334155",
                      marginTop: 3,
                      fontFamily: "monospace",
                    }}
                  >
                    {m.description}
                  </div>
                  {isGSCV && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: `1px solid ${active ? "#3b82f620" : "#1e293b"}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 5,
                        }}
                      >
                        Param grid
                      </div>
                      {Object.entries(m.paramGrid).map(([param, values]) => {
                        const best =
                          m.bestParams[param as keyof typeof m.bestParams];
                        return (
                          <div
                            key={param}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginBottom: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                color: active ? "#60a5fa" : "#475569",
                                fontFamily: "monospace",
                                minWidth: 60,
                              }}
                            >
                              {param}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                gap: 3,
                                flexWrap: "wrap",
                              }}
                            >
                              {(values as number[]).map((v) => (
                                <span
                                  key={v}
                                  style={{
                                    fontSize: 10,
                                    fontFamily: "monospace",
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background:
                                      v === best
                                        ? active
                                          ? "#3b82f630"
                                          : "#1e3a5f"
                                        : "transparent",
                                    color:
                                      v === best
                                        ? active
                                          ? "#93c5fd"
                                          : "#3b82f6"
                                        : "#334155",
                                    border: `1px solid ${v === best ? (active ? "#3b82f660" : "#3b82f640") : "#1e293b"}`,
                                  }}
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 9,
                          color: "#475569",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Best params{" "}
                        <span
                          style={{
                            color: active ? "#93c5fd" : "#3b82f6",
                            textTransform: "none",
                            letterSpacing: 0,
                            fontFamily: "monospace",
                            fontSize: 10,
                          }}
                        >
                          {Object.entries(m.bestParams)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(", ")}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload */}
        <div
          style={{
            background: "#0a0f1e",
            border: "1px solid #1e293b",
            borderRadius: 14,
            padding: "18px 22px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            Input File
          </div>

          {/* DEMO OPTIONS */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              // onClick={() => setUseDemo(true)}
              onClick={handleUseDemo}
              style={{
                background: useDemo ? "#16a34a" : "#0f172a",
                color: useDemo ? "#fff" : "#94a3b8",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Use Demo File
            </button>

            <a
              href="/EEG-test-data.xlsx"
              download
              style={{
                background: "#0f172a",
                color: "#94a3b8",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              Download Demo
            </a>
          </div>

          {/* FILE INPUT */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                setUseDemo(false); // disable demo if user uploads
                handleUpload(e);
              }}
              style={{
                flex: 1,
                minWidth: 200,
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            />

            <button
              className="run-btn"
              onClick={handleSubmit}
              disabled={(!file && !useDemo) || loading}
              style={{
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Running…" : "Run Classification"}
            </button>
          </div>

          {/* INFO */}
          {!loading && (
            <div style={{ marginTop: 10, fontSize: 11, color: "#475569" }}>
              {useDemo
                ? "Using demo dataset"
                : file
                  ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB`
                  : "No file selected"}
              {" · Model: "}
              {MODELS.find((m) => m.key === selectedModel)?.label}
            </div>
          )}
        </div>

        {/* Results */}
        {response && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Summary */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <StatCard
                label="Signals"
                value={response.y_pred.length}
                sub="classified"
              />
              <StatCard
                label="Classes Detected"
                value={new Set(response.y_pred).size}
                sub={`of ${DATASET_COMPOSITION.length} total`}
              />
              <StatCard
                label="Avg Confidence"
                value={`${(avgConfidence || 0 * 100).toFixed(1)}%`}
                sub="predicted class prob."
              />
              <StatCard
                label="Dominant Class"
                value={dominantClass?.count ? `Set ${dominantClass.set}` : "—"}
                sub={dominantClass?.state}
              />
            </div>
            {/* Distribution */}
            <div
              style={{
                background: "#0a0f1e",
                border: "1px solid #1e293b",
                borderRadius: 14,
                padding: "18px 22px",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 14,
                }}
              >
                Prediction Distribution
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {labelCounts.map((d) => (
                  <div
                    key={d.set}
                    style={{
                      flex: "1 1 100px",
                      background: "#0f172a",
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: `1px solid ${d.count > 0 ? d.color + "40" : "#1e293b"}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: d.color,
                        }}
                      >
                        Set {d.set}
                      </span>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: d.count > 0 ? "#f1f5f9" : "#334155",
                          fontFamily: "monospace",
                        }}
                      >
                        {d.count}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: "#475569" }}>
                      {d.state}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-signal */}
            {response && avgConfidence ? (
              <div
                style={{
                  background: "#0a0f1e",
                  border: "1px solid #1e293b",
                  borderRadius: 14,
                  padding: "18px 22px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Per-signal Results
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#334155",
                      fontFamily: "monospace",
                    }}
                  >
                    {MODELS.find((m) => m.key === selectedModel)?.label}
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {response.y_pred.map((pred, idx) => {
                    const meta = DATASET_COMPOSITION.find(
                      (d) => d.label === pred,
                    )!;
                    const probs = probsAsArrays?.[idx];
                    const confidence = probs?.[pred || 1 - 1];
                    return (
                      <div
                        key={idx}
                        className="signal-card"
                        style={{
                          background: "#080d1a",
                          border: "1px solid #1e293b",
                          borderRadius: 10,
                          padding: "14px 16px",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "#334155",
                              fontFamily: "monospace",
                              minWidth: 56,
                            }}
                          >
                            Signal {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                background: meta.color + "25",
                                border: `1.5px solid ${meta.color}60`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: meta.color,
                                }}
                              >
                                {meta.set}
                              </span>
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                }}
                              >
                                {meta.state}
                              </div>
                              <div style={{ fontSize: 10, color: "#475569" }}>
                                {meta.electrode}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{ marginLeft: "auto", textAlign: "right" }}
                          >
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: meta.color,
                                fontFamily: "monospace",
                              }}
                            >
                              {(confidence || 0 * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: 10, color: "#475569" }}>
                              confidence
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {DATASET_COMPOSITION.map((cls, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: i + 1 === pred ? cls.color : "#334155",
                                  minWidth: 14,
                                  fontWeight: 600,
                                }}
                              >
                                {cls.set}
                              </span>
                              <ConfidenceBar
                                value={probs?.[i] || 0}
                                color={cls.color}
                                isTop={i + 1 === pred}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div
              style={{
                marginTop: 14,
                fontSize: 11,
                color: "#1e293b",
                textAlign: "center",
              }}
            >
              Dummy inference · connect model endpoint for live predictions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
