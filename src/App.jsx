import { useState } from "react";
import Papa from "papaparse";
import { Upload, CheckCircle, AlertCircle, Download, RotateCcw, Shuffle, ChevronDown, ChevronUp, X, Link2, FileText, TrendingUp, DollarSign, Calendar, Target, Zap, Eye, EyeOff } from "lucide-react";

// ─── UTILS ────────────────────────────────────────────────────────────────────

const parseAmount = (val) => {
  if (val == null) return NaN;
  return parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
};

const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const daysDiff = (a, b) => {
  if (!a || !b) return Infinity;
  return Math.abs((a - b) / (1000 * 60 * 60 * 24));
};

const fmtDate = (val) => {
  const d = parseDate(val);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : val;
};

const fmtAmt = (val) => {
  const n = parseAmount(val);
  return isNaN(n) ? val : n.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const generateId = () => Math.random().toString(36).slice(2, 11);

// ─── SMART MATCHING ENGINE ────────────────────────────────────────────────────

function runAutoMatch(bankRows, bookRows, { amountTol = 0.01, daysTol = 3 }) {
  const matched = [];
  const usedBank = new Set();
  const usedBook = new Set();

  for (let i = 0; i < bankRows.length; i++) {
    if (usedBank.has(i)) continue;
    const bAmt = parseAmount(bankRows[i].amount);
    const bDate = parseDate(bankRows[i].date);
    let bestJ = -1, bestScore = Infinity;
    for (let j = 0; j < bookRows.length; j++) {
      if (usedBook.has(j)) continue;
      const kAmt = parseAmount(bookRows[j].amount);
      const kDate = parseDate(bookRows[j].date);
      if (Math.abs(bAmt - kAmt) <= amountTol) {
        const dd = daysDiff(bDate, kDate);
        if (dd <= daysTol && dd < bestScore) {
          bestScore = dd;
          bestJ = j;
        }
      }
    }
    if (bestJ !== -1) {
      matched.push({ bankIdx: i, bookIdx: bestJ, confidence: bestScore === 0 ? "exact" : "fuzzy" });
      usedBank.add(i);
      usedBook.add(bestJ);
    }
  }

  const unmatchedBank = bankRows.map((r, i) => ({ ...r, _id: generateId(), _idx: i })).filter((_, i) => !usedBank.has(i));
  const unmatchedBook = bookRows.map((r, i) => ({ ...r, _id: generateId(), _idx: i })).filter((_, i) => !usedBook.has(i));
  const matchedPairs = matched.map((m) => ({
    _id: generateId(),
    bank: { ...bankRows[m.bankIdx], _idx: m.bankIdx },
    book: { ...bookRows[m.bookIdx], _idx: m.bookIdx },
    confidence: m.confidence,
  }));

  return { matchedPairs, unmatchedBank, unmatchedBook };
}

// ─── MINI CHART COMPONENT ─────────────────────────────────────────────────────

function MiniDonutChart({ percentage, color, size = 80 }) {
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color }}>
        {percentage}%
      </div>
    </div>
  );
}

// ─── FILE UPLOAD ZONE ─────────────────────────────────────────────────────────

function UploadZone({ label, color, onFile, file, showPDFHelper = false }) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleFile = async (f) => {
    if (!f) return;
    setLoading(true);
    
    try {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          onFile(results.data, results.meta.fields);
          setLoading(false);
        },
        error: () => {
          alert('Error parsing CSV file');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error(err);
      alert('Error reading file: ' + err.message);
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${drag ? color : file ? "#22c55e" : "#cbd5e1"}`,
          borderRadius: 16,
          padding: "28px 20px",
          textAlign: "center",
          cursor: loading ? "wait" : "pointer",
          background: file ? "#f0fdf4" : drag ? "#f8fafc" : "#fff",
          transition: "all 0.2s",
          position: "relative",
          opacity: loading ? 0.6 : 1,
        }}
        onClick={() => { 
          if (loading) return;
          const inp = document.createElement("input"); 
          inp.type = "file"; 
          inp.accept = ".csv"; 
          inp.onchange = (e) => handleFile(e.target.files[0]); 
          inp.click(); 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          {loading ? (
            <div style={{ width: 20, height: 20, border: "2px solid #cbd5e1", borderTopColor: color, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          ) : file ? (
            <CheckCircle size={20} color="#22c55e" />
          ) : (
            <Upload size={20} color={color} />
          )}
          <span style={{ fontWeight: 700, fontSize: 15, color: file ? "#166534" : "#1e293b" }}>{label}</span>
        </div>
        {loading ? (
          <span style={{ fontSize: 13, color: "#64748b" }}>Processing file...</span>
        ) : file ? (
          <span style={{ fontSize: 13, color: "#64748b" }}>✓ Loaded — click to replace</span>
        ) : (
          <span style={{ fontSize: 13, color: "#94a3b8", display: "block" }}>
            Drag CSV here or click to upload
          </span>
        )}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
      
      {showPDFHelper && !file && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "#fefce8", borderRadius: 8, border: "1px solid #fde047" }}>
          <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
            <FileText size={16} color="#ca8a04" style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#854d0e", marginBottom: 3 }}>
                Have a PDF bank statement?
              </div>
              <div style={{ fontSize: 11, color: "#a16207", lineHeight: 1.4 }}>
                Convert it to CSV online at <a href="https://www.zamzar.com/convert/pdf-to-csv/" target="_blank" style={{ color: "#0369a1", textDecoration: "underline" }}>Zamzar</a> or use your bank's "Export to CSV" option
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COLUMN MAPPER ────────────────────────────────────────────────────────────

function ColumnMapper({ fields, mapping, onChange, label }) {
  if (!fields || fields.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>{label} — Map Columns</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["date", "amount", "description"].map((key) => (
          <div key={key} style={{ flex: "1 1 120px", minWidth: 120 }}>
            <label style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>{key}</label>
            <select
              value={mapping[key] || ""}
              onChange={(e) => onChange({ ...mapping, [key]: e.target.value })}
              style={{ width: "100%", padding: "4px 6px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff" }}
            >
              <option value="">— pick —</option>
              {fields.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROW DISPLAY ──────────────────────────────────────────────────────────────

function RowBadge({ row, color }) {
  return (
    <div style={{ background: color + "15", border: `1px solid ${color}30`, borderRadius: 8, padding: "6px 10px", display: "flex", gap: 12, alignItems: "center", fontSize: 13, flex: 1 }}>
      <span style={{ color: "#1e293b", fontWeight: 600, minWidth: 90 }}>{fmtAmt(row.amount)}</span>
      <span style={{ color: "#64748b", fontSize: 12 }}>{fmtDate(row.date)}</span>
      <span style={{ color: "#94a3b8", fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{row.description || "—"}</span>
    </div>
  );
}

// ─── SECTIONS ─────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, color, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", cursor: "pointer", userSelect: "none" }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${color}20, ${color}10)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}30` }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", flex: 1 }}>{title}</span>
      <span style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)`, color, borderRadius: 14, padding: "4px 12px", fontSize: 13, fontWeight: 700, border: `1px solid ${color}20` }}>{count}</span>
      {expanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
    </div>
  );
}

// ─── MANUAL MATCH MODAL ───────────────────────────────────────────────────────

function ManualMatchModal({ selected, unmatchedBank, unmatchedBook, onMatch, onClose }) {
  const isBank = unmatchedBank.some((r) => r._id === selected._id);
  const candidates = isBank ? unmatchedBook : unmatchedBank;
  const [search, setSearch] = useState("");
  const filtered = candidates.filter((r) =>
    (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
    String(r.amount).includes(search)
  );
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s" }}>
      <div style={{ background: "#fff", borderRadius: 24, width: 560, maxHeight: "85vh", overflow: "hidden", boxShadow: "0 25px 70px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", animation: "slideUp 0.3s" }}>
        <div style={{ padding: "20px 26px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #f8fafc, #fff)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link2 size={20} color="#6366f1" />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Match Transaction</span>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}>
            <X size={18} color="#64748b" />
          </button>
        </div>
        <div style={{ padding: "16px 26px", background: "#f8fafc" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Selected ({isBank ? "Bank" : "Books"})</div>
          <RowBadge row={selected} color={isBank ? "#3b82f6" : "#8b5cf6"} />
        </div>
        <div style={{ padding: "18px 26px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Find Match from {isBank ? "Books" : "Bank"}</div>
          <input
            autoFocus
            placeholder="Search amount or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box", marginBottom: 12, outline: "none", transition: "all 0.2s" }}
            onFocus={(e) => e.target.style.borderColor = "#6366f1"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 && <div style={{ fontSize: 14, color: "#94a3b8", padding: 20, textAlign: "center" }}>No candidates found</div>}
            {filtered.map((r) => (
              <div
                key={r._id}
                onClick={() => onMatch(selected, r, isBank)}
                style={{ cursor: "pointer", borderRadius: 10, border: "1px solid #e2e8f0", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, transition: "all 0.2s", background: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = isBank ? "#8b5cf6" : "#3b82f6"; e.currentTarget.style.background = isBank ? "#faf5ff" : "#eff6ff"; e.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <Link2 size={15} color={isBank ? "#8b5cf6" : "#3b82f6"} />
                <RowBadge row={r} color={isBank ? "#8b5cf6" : "#3b82f6"} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── EXPORT HELPER ────────────────────────────────────────────────────────────

function exportCSV(rows, filename) {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  const header = keys.join(",");
  const body = rows.map((r) => keys.map((k) => `"${String(r[k] || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [bankData, setBankData] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [bankFields, setBankFields] = useState([]);
  const [bookFields, setBookFields] = useState([]);
  const [bankMap, setBankMap] = useState({ date: "", amount: "", description: "" });
  const [bookMap, setBookMap] = useState({ date: "", amount: "", description: "" });
  const [result, setResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ matched: true, bank: true, book: true });
  const [modalItem, setModalItem] = useState(null);
  const [showAmounts, setShowAmounts] = useState(true);

  const toggle = (key) => setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const mapRow = (row, mapping) => ({
    date: row[mapping.date] || "",
    amount: row[mapping.amount] || "",
    description: row[mapping.description] || "",
  });

  const canRun = bankData && bookData && bankMap.date && bankMap.amount && bookMap.date && bookMap.amount;

  const handleRun = () => {
    const mapped1 = bankData.map((r) => mapRow(r, bankMap));
    const mapped2 = bookData.map((r) => mapRow(r, bookMap));
    setResult(runAutoMatch(mapped1, mapped2, { amountTol: 0.01, daysTol: 3 }));
  };

  const handleReset = () => { 
    setBankData(null); 
    setBookData(null); 
    setBankFields([]); 
    setBookFields([]); 
    setResult(null); 
    setBankMap({ date: "", amount: "", description: "" }); 
    setBookMap({ date: "", amount: "", description: "" }); 
  };

  const handleManualMatch = (selected, candidate, selectedIsBank) => {
    setResult((prev) => {
      const bank = selectedIsBank ? selected : candidate;
      const book = selectedIsBank ? candidate : selected;
      return {
        matchedPairs: [...prev.matchedPairs, { _id: generateId(), bank, book, confidence: "manual" }],
        unmatchedBank: prev.unmatchedBank.filter((r) => r._id !== bank._id),
        unmatchedBook: prev.unmatchedBook.filter((r) => r._id !== book._id),
      };
    });
    setModalItem(null);
  };

  const handleUnmatch = (pair) => {
    setResult((prev) => ({
      matchedPairs: prev.matchedPairs.filter((p) => p._id !== pair._id),
      unmatchedBank: [...prev.unmatchedBank, { ...pair.bank }],
      unmatchedBook: [...prev.unmatchedBook, { ...pair.book }],
    }));
  };

  const stats = result ? {
    total: result.matchedPairs.length + result.unmatchedBank.length,
    matched: result.matchedPairs.length,
    unmatchedBank: result.unmatchedBank.length,
    unmatchedBook: result.unmatchedBook.length,
    rate: result.matchedPairs.length + result.unmatchedBank.length > 0
      ? Math.round((result.matchedPairs.length / (result.matchedPairs.length + result.unmatchedBank.length)) * 100)
      : 0,
    exactMatches: result.matchedPairs.filter(p => p.confidence === "exact").length,
    fuzzyMatches: result.matchedPairs.filter(p => p.confidence === "fuzzy").length,
    manualMatches: result.matchedPairs.filter(p => p.confidence === "manual").length,
    totalBankAmount: result.matchedPairs.reduce((sum, p) => sum + parseAmount(p.bank.amount), 0),
    totalUnmatchedBankAmount: result.unmatchedBank.reduce((sum, r) => sum + parseAmount(r.amount), 0),
  } : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)", fontFamily: "'Inter', system-ui, sans-serif", position: "relative" }}>
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.1 }}>
        <div style={{ position: "absolute", width: 600, height: 600, background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", top: -200, right: -200, animation: "pulse 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)", bottom: -100, left: -100, animation: "pulse 6s ease-in-out infinite 1s" }} />
      </div>

      {/* Header */}
      <div style={{ position: "relative", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #60a5fa, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(96,165,250,0.4)" }}>
            <Zap size={24} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: -0.8 }}>ReconTool Pro</div>
            <div style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 500 }}>Smart Bank Reconciliation</div>
          </div>
        </div>
        {result && (
          <button onClick={handleReset} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 10, padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
            <RotateCcw size={16} /> New Reconciliation
          </button>
        )}
      </div>

      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>

        {/* ── UPLOAD STAGE */}
        {!result && (
          <>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -1 }}>Reconcile in Minutes</h1>
              <p style={{ color: "#cbd5e1", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>Upload your bank statement and accounting records. Our AI will match transactions automatically.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 12 }}>
              <div>
                <UploadZone
                  label="Bank Statement"
                  color="#3b82f6"
                  file={bankData}
                  showPDFHelper={true}
                  onFile={(data, fields) => { setBankData(data); setBankFields(fields); setBankMap({ date: "", amount: "", description: "" }); }}
                />
                <ColumnMapper fields={bankFields} mapping={bankMap} onChange={setBankMap} label="Bank" />
              </div>
              <div>
                <UploadZone
                  label="Accounting Records"
                  color="#8b5cf6"
                  file={bookData}
                  showPDFHelper={false}
                  onFile={(data, fields) => { setBookData(data); setBookFields(fields); setBookMap({ date: "", amount: "", description: "" }); }}
                />
                <ColumnMapper fields={bookFields} mapping={bookMap} onChange={setBookMap} label="Books" />
              </div>
            </div>

            <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <AlertCircle size={18} color="#a5b4fc" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: "#e0e7ff", lineHeight: 1.5 }}>
                Export both files as <strong>CSV</strong> from your bank and accounting software. Map the columns so we know which is date, amount, and description.
              </span>
            </div>

            <button
              disabled={!canRun}
              onClick={handleRun}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 14,
                border: "none",
                background: canRun ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.1)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 17,
                cursor: canRun ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: canRun ? "0 8px 32px rgba(99,102,241,0.5)" : "none",
                transition: "all 0.3s",
                transform: canRun ? "scale(1)" : "scale(0.98)",
              }}
              onMouseEnter={(e) => { if (canRun) e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { if (canRun) e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Shuffle size={20} /> Run Smart Reconciliation
            </button>
          </>
        )}

        {/* ── RESULTS STAGE */}
        {result && (
          <>
            {/* Hero Stats */}
            <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 32px", marginBottom: 28, backdropFilter: "blur(20px)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Reconciliation Complete</h2>
                  <p style={{ color: "#cbd5e1", fontSize: 14 }}>Found {stats.matched} matches out of {stats.total} bank transactions</p>
                </div>
                <MiniDonutChart percentage={stats.rate} color="#22c55e" size={90} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                {[
                  { icon: Target, label: "Match Rate", value: stats.rate + "%", color: "#22c55e", bg: "linear-gradient(135deg, #22c55e15, #22c55e08)" },
                  { icon: CheckCircle, label: "Matched", value: stats.matched, color: "#3b82f6", bg: "linear-gradient(135deg, #3b82f615, #3b82f608)" },
                  { icon: AlertCircle, label: "Unmatched Bank", value: stats.unmatchedBank, color: "#f59e0b", bg: "linear-gradient(135deg, #f59e0b15, #f59e0b08)" },
                  { icon: AlertCircle, label: "Unmatched Books", value: stats.unmatchedBook, color: "#8b5cf6", bg: "linear-gradient(135deg, #8b5cf615, #8b5cf608)" },
                ].map((s) => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "18px 16px", border: `1px solid ${s.color}20`, backdropFilter: "blur(10px)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <s.icon size={16} color={s.color} />
                      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Zap size={16} color="#10b981" />
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>EXACT MATCHES</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{stats.exactMatches}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Perfect amount & date</div>
              </div>
              
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <TrendingUp size={16} color="#f59e0b" />
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>FUZZY MATCHES</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{stats.fuzzyMatches}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Within tolerance</div>
              </div>
              
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px 18px", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <DollarSign size={16} color="#8b5cf6" />
                  <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>MATCHED VALUE</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#8b5cf6" }}>{fmtAmt(stats.totalBankAmount)}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Total reconciled</div>
              </div>
            </div>

            {/* Export bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <button onClick={() => setShowAmounts(!showAmounts)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {showAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAmounts ? "Hide" : "Show"} Amounts
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Matched", data: result.matchedPairs.map((p) => ({ bank_date: p.bank.date, bank_amount: p.bank.amount, bank_desc: p.bank.description, book_date: p.book.date, book_amount: p.book.amount, book_desc: p.book.description, confidence: p.confidence })), file: "matched.csv" },
                  { label: "Unmatched Bank", data: result.unmatchedBank, file: "unmatched_bank.csv" },
                  { label: "Unmatched Books", data: result.unmatchedBook, file: "unmatched_books.csv" },
                ].map((e) => (
                  <button key={e.label} onClick={() => exportCSV(e.data, e.file)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#cbd5e1", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
                    <Download size={13} /> {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Matched Pairs */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", marginBottom: 14, backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "0 22px" }}>
                <SectionHeader icon={CheckCircle} title="Matched Pairs" count={result.matchedPairs.length} color="#22c55e" expanded={expandedSections.matched} onToggle={() => toggle("matched")} />
              </div>
              {expandedSections.matched && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {result.matchedPairs.length === 0 && <div style={{ padding: "20px 22px", fontSize: 14, color: "#94a3b8", textAlign: "center" }}>No matched pairs yet</div>}
                  {result.matchedPairs.map((pair, idx) => (
                    <div key={pair._id} style={{ padding: "12px 22px", borderBottom: idx < result.matchedPairs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 12, animation: `slideIn 0.3s ease-out ${idx * 0.03}s backwards` }}>
                      <RowBadge row={pair.bank} color="#3b82f6" />
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: pair.confidence === "exact" ? "#10b981" : pair.confidence === "manual" ? "#a78bfa" : "#f59e0b", background: pair.confidence === "exact" ? "#10b98120" : pair.confidence === "manual" ? "#a78bfa20" : "#f59e0b20", padding: "2px 8px", borderRadius: 10, border: `1px solid ${pair.confidence === "exact" ? "#10b981" : pair.confidence === "manual" ? "#a78bfa" : "#f59e0b"}30` }}>
                          {pair.confidence.toUpperCase()}
                        </span>
                        <CheckCircle size={14} color="#22c55e" />
                      </div>
                      <RowBadge row={pair.book} color="#8b5cf6" />
                      <button onClick={() => handleUnmatch(pair)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)"; e.currentTarget.style.borderColor = "#ef4444"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }} title="Unmatch">
                        <X size={14} color="#cbd5e1" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Unmatched Bank */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", marginBottom: 14, backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "0 22px" }}>
                <SectionHeader icon={AlertCircle} title="Unmatched — Bank Statement" count={result.unmatchedBank.length} color="#f59e0b" expanded={expandedSections.bank} onToggle={() => toggle("bank")} />
              </div>
              {expandedSections.bank && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {result.unmatchedBank.length === 0 && <div style={{ padding: "20px 22px", fontSize: 14, color: "#94a3b8", textAlign: "center" }}>🎉 All bank transactions matched!</div>}
                  {result.unmatchedBank.map((row, idx) => (
                    <div key={row._id} style={{ padding: "10px 22px", borderBottom: idx < result.unmatchedBank.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <RowBadge row={row} color="#f59e0b" />
                      <button onClick={() => setModalItem(row)} style={{ marginLeft: "auto", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "6px 12px", color: "#fbbf24", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.25)"; e.currentTarget.style.transform = "scale(1.05)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}>
                        <Link2 size={13} /> Match
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Unmatched Books */}
            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(20px)" }}>
              <div style={{ padding: "0 22px" }}>
                <SectionHeader icon={AlertCircle} title="Unmatched — Accounting Books" count={result.unmatchedBook.length} color="#8b5cf6" expanded={expandedSections.book} onToggle={() => toggle("book")} />
              </div>
              {expandedSections.book && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {result.unmatchedBook.length === 0 && <div style={{ padding: "20px 22px", fontSize: 14, color: "#94a3b8", textAlign: "center" }}>🎉 All book entries matched!</div>}
                  {result.unmatchedBook.map((row, idx) => (
                    <div key={row._id} style={{ padding: "10px 22px", borderBottom: idx < result.unmatchedBook.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <RowBadge row={row} color="#8b5cf6" />
                      <button onClick={() => setModalItem(row)} style={{ marginLeft: "auto", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, padding: "6px 12px", color: "#c4b5fd", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.25)"; e.currentTarget.style.transform = "scale(1.05)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; e.currentTarget.style.transform = "scale(1)"; }}>
                        <Link2 size={13} /> Match
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {modalItem && result && (
        <ManualMatchModal
          selected={modalItem}
          unmatchedBank={result.unmatchedBank}
          unmatchedBook={result.unmatchedBook}
          onMatch={handleManualMatch}
          onClose={() => setModalItem(null)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.15; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
