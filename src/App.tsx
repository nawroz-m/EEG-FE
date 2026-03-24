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
  },
  { key: "svm_rbf", label: "SVM RBF", description: "kernel=rbf, C=1.0, OvO" },
  { key: "tree", label: "Decision Tree", description: "gini, max_depth=20" },
  { key: "knn", label: "k-NN", description: "k=5, Minkowski p=2" },
];

const DUMMY_RESPONSE = {
  y_pred: [5, 4, 3, 2, 1],
  prob: [
    {
      "1": 0.2041686484099359,
      "2": 0.10711166756127753,
      "3": 0.061419571475947086,
      "4": 0.2828321355186476,
      "5": 0.34446797703419196,
    },
    {
      "1": 0.21736260184085485,
      "2": 0.1399482807416206,
      "3": 0.08911703335113257,
      "4": 0.35824995549947636,
      "5": 0.19532212856691555,
    },
    {
      "1": 0.17100272354862328,
      "2": 0.09126398431952276,
      "3": 0.4429822913680627,
      "4": 0.1498827982862392,
      "5": 0.14486820247755183,
    },
    {
      "1": 0.1969885208162514,
      "2": 0.42603304388415014,
      "3": 0.08389731919570678,
      "4": 0.16336228141947734,
      "5": 0.12971883468441395,
    },
    {
      "1": 0.42410123304660113,
      "2": 0.31958652490588235,
      "3": 0.060026560080898385,
      "4": 0.08465630597396821,
      "5": 0.11162937599265019,
    },
  ],
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

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState("svm_lin");
  const [response, setResponse] = useState<typeof DUMMY_RESPONSE | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    setLoading(true);
    setResponse(null);
    setTimeout(() => {
      setResponse(DUMMY_RESPONSE);
      setLoading(false);
    }, 1200);
  };

  const probsAsArrays = response?.prob.map((row) =>
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
            Model
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MODELS.map((m) => {
              const active = selectedModel === m.key;
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
              onChange={handleUpload}
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
              disabled={!file || loading}
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
                transition: "background 0.15s",
              }}
            >
              {loading && (
                <div
                  style={{
                    width: 13,
                    height: 13,
                    border: "2px solid #93c5fd",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              )}
              {loading ? "Running…" : "Run Classification"}
            </button>
          </div>
          {file && !loading && (
            <div style={{ marginTop: 10, fontSize: 11, color: "#475569" }}>
              {file.name} · {(file.size / 1024).toFixed(1)} KB · Model:{" "}
              {MODELS.find((m) => m.key === selectedModel)?.label}
            </div>
          )}
        </div>

        {/* Results */}
        {response && probsAsArrays && (
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
                value={`${(avgConfidence * 100).toFixed(1)}%`}
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
                  const probs = probsAsArrays[idx];
                  const confidence = probs[pred - 1];
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
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: meta.color,
                              fontFamily: "monospace",
                            }}
                          >
                            {(confidence * 100).toFixed(1)}%
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
                              value={probs[i]}
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
