import { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORY_COLORS = {
  "Food & Drinks": "#f97316",
  "Transport": "#3b82f6",
  "Shopping": "#a855f7",
  "Entertainment": "#ec4899",
  "Subscriptions": "#14b8a6",
  "Credit": "#22c55e",
  "Others": "#94a3b8",
};

const PAYMENT_ICONS = {
  "Debit Card": "💳",
  "Credit Card": "🏦",
  "Cash": "💵",
  "UPI/GPay": "📱",
  "Unknown": "❓",
};

const PAYMENT_COLORS = {
  "Debit Card": "#3b82f6",
  "Credit Card": "#a855f7",
  "Cash": "#22c55e",
  "UPI/GPay": "#f97316",
  "Unknown": "#64748b",
};

const PAYMENT_METHODS = ["Debit Card", "Credit Card", "Cash", "UPI/GPay"];
const DEFAULT_BUDGET = 15000;

function formatDate(d) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function Badge({ label, color }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 6, padding: "2px 7px", fontSize: 10,
      fontFamily: "monospace", fontWeight: 700, letterSpacing: 0.4, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function StatusDot({ active }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: active ? "#ef4444" : "#64748b",
      boxShadow: active ? "0 0 0 3px #ef444433" : "none",
      animation: active ? "pulse 1s infinite" : "none",
      marginRight: 6, verticalAlign: "middle",
    }} />
  );
}

function TipCard({ entries, budget }) {
  const todayDebits = entries.filter(e => e.dateKey === todayKey() && e.type === "debit");
  const total = todayDebits.reduce((s, e) => s + e.amount, 0);
  const dailyBudget = budget / 30;
  if (total === 0) return null;
  const pct = (total / dailyBudget) * 100;
  let tip, color, icon;
  if (pct > 120) { tip = `Aaj ₹${total.toLocaleString("en-IN")} spend ho gaye — daily limit se ${Math.round(pct - 100)}% zyada! Kal thoda bachana.`; color = "#ef4444"; icon = "🚨"; }
  else if (pct > 90) { tip = `Almost at daily limit (₹${Math.round(dailyBudget).toLocaleString("en-IN")}). Baki kharcha carefully karo.`; color = "#f97316"; icon = "⚠️"; }
  else { tip = `Good going! Aaj abhi ₹${Math.round(dailyBudget - total).toLocaleString("en-IN")} bachta hai daily budget mein.`; color = "#22c55e"; icon = "✅"; }
  return (
    <div style={{ background: color + "12", border: `1px solid ${color}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#e2e8f0", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 18 }}>{icon}</span><span>{tip}</span>
    </div>
  );
}

// ── Grand Total / Budget Tracker Card ──────────────────────────────────────
function BudgetTargetCard({ entries, budget, onSetBudget }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(budget));
  const now = new Date();
  const monthEntries = entries.filter(e => {
    const [y, m] = e.dateKey.split("-").map(Number);
    return y === now.getFullYear() && m === (now.getMonth() + 1);
  });
  const totalSpent = monthEntries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
  const totalReceived = monthEntries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const remaining = budget - totalSpent;
  const adjustedRemaining = remaining + totalReceived;
  const exceeded = totalSpent > budget;
  const overBy = totalSpent - budget;
  const pct = Math.min((totalSpent / budget) * 100, 100);

  return (
    <div style={{ background: "#0f172a", border: `1px solid ${exceeded ? "#ef444444" : "#1e293b"}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", letterSpacing: 1.5 }}>MONTHLY BUDGET TARGET</div>
        <button onClick={() => { setEditing(!editing); setInput(String(budget)); }} style={{ background: "#1e293b", border: "none", borderRadius: 6, padding: "4px 10px", color: "#f97316", fontFamily: "monospace", fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>
          {editing ? "CANCEL" : "✏️ SET"}
        </button>
      </div>

      {editing && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Enter monthly budget (₹)"
            style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#f1f5f9", fontFamily: "monospace", fontSize: 13 }}
          />
          <button onClick={() => { const v = parseInt(input); if (v > 0) { onSetBudget(v); setEditing(false); } }} style={{ background: "#f97316", border: "none", borderRadius: 8, padding: "8px 16px", color: "#0f172a", fontFamily: "monospace", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            SAVE
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ background: "#1e293b", borderRadius: 8, height: 10, marginBottom: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 8,
          width: `${pct}%`,
          background: exceeded ? "#ef4444" : pct > 80 ? "linear-gradient(90deg,#f97316,#fbbf24)" : "linear-gradient(90deg,#22c55e,#f97316)",
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* Main table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <tbody>
          <tr style={{ borderBottom: "1px solid #1e293b" }}>
            <td style={tdL}>Target Budget</td>
            <td style={tdR("#94a3b8")}>₹{budget.toLocaleString("en-IN")}</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #1e293b" }}>
            <td style={tdL}>Total Spent</td>
            <td style={tdR("#ef4444")}>−₹{totalSpent.toLocaleString("en-IN")}</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #1e293b" }}>
            <td style={tdL}>Remaining (before credits)</td>
            <td style={tdR(remaining >= 0 ? "#22c55e" : "#ef4444")}>
              {remaining >= 0 ? "" : "−"}₹{Math.abs(remaining).toLocaleString("en-IN")}
            </td>
          </tr>
          {totalReceived > 0 && (
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              <td style={tdL}>Money Received</td>
              <td style={tdR("#22c55e")}>(+₹{totalReceived.toLocaleString("en-IN")})</td>
            </tr>
          )}
          <tr>
            <td style={{ ...tdL, fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>
              {exceeded ? "⚠️ Over Budget By" : "✅ Net Remaining"}
            </td>
            <td style={{ ...tdR(exceeded ? "#ef4444" : "#22c55e"), fontSize: 16, fontWeight: 800 }}>
              {exceeded
                ? `−₹${overBy.toLocaleString("en-IN")}`
                : `₹${adjustedRemaining.toLocaleString("en-IN")}`
              }
            </td>
          </tr>
        </tbody>
      </table>

      {exceeded && (
        <div style={{ marginTop: 12, background: "#ef444412", border: "1px solid #ef444433", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fca5a5" }}>
          🚨 Budget exceeded by ₹{overBy.toLocaleString("en-IN")}. Next month ke liye plan karo.
        </div>
      )}
    </div>
  );
}

const tdL = { padding: "9px 4px", fontSize: 12, color: "#94a3b8", fontFamily: "monospace" };
const tdR = (color) => ({ padding: "9px 4px", fontSize: 13, color, fontFamily: "monospace", fontWeight: 700, textAlign: "right" });

// ── Payment Method Breakdown Tab ────────────────────────────────────────────
function PaymentsTab({ entries }) {
  const [expandedMethod, setExpandedMethod] = useState(null);
  const now = new Date();
  const monthEntries = entries.filter(e => {
    const [y, m] = e.dateKey.split("-").map(Number);
    return y === now.getFullYear() && m === (now.getMonth() + 1);
  });

  const grandSpent = monthEntries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
  const grandReceived = monthEntries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);

  const methodData = [...PAYMENT_METHODS, "Unknown"].map(method => {
    const items = monthEntries.filter(e => (e.paymentMethod || "Unknown") === method);
    const spent = items.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
    const received = items.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
    const catMap = {};
    items.filter(e => e.type === "debit").forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    return { method, items, spent, received, catMap };
  }).filter(m => m.items.length > 0);

  if (methodData.length === 0) {
    return <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 14 }}>Is month koi payment data nahi hai.</div>;
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Per-method cards */}
      {methodData.map(({ method, items, spent, received, catMap }) => {
        const color = PAYMENT_COLORS[method] || "#64748b";
        const isOpen = expandedMethod === method;
        return (
          <div key={method} style={{ background: "#0f172a", border: `1px solid ${color}33`, borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
            {/* Method header */}
            <div
              onClick={() => setExpandedMethod(isOpen ? null : method)}
              style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{PAYMENT_ICONS[method]}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{method}</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{items.length} transaction{items.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {spent > 0 && <div style={{ fontSize: 15, fontWeight: 800, color: "#ef4444", fontFamily: "monospace" }}>−₹{spent.toLocaleString("en-IN")}</div>}
                {received > 0 && <div style={{ fontSize: 12, color: "#22c55e", fontFamily: "monospace" }}>+₹{received.toLocaleString("en-IN")}</div>}
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{isOpen ? "▲ collapse" : "▼ expand"}</div>
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: `1px solid ${color}22`, padding: "0 16px 14px" }}>
                {/* Category breakdown */}
                {Object.keys(catMap).length > 0 && (
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: 1, marginBottom: 8 }}>CATEGORY BREAKDOWN</div>
                    {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                      const catColor = CATEGORY_COLORS[cat] || "#94a3b8";
                      const pct = spent > 0 ? (amt / spent) * 100 : 0;
                      return (
                        <div key={cat} style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: catColor, fontFamily: "monospace" }}>{cat}</span>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>₹{amt.toLocaleString("en-IN")} ({Math.round(pct)}%)</span>
                          </div>
                          <div style={{ background: "#1e293b", borderRadius: 4, height: 4 }}>
                            <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: catColor, transition: "width 0.5s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Item list */}
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", letterSpacing: 1, marginBottom: 8, marginTop: 12 }}>ALL ITEMS</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["#", "Item", "Category", "Amount"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "5px 4px", fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e, i) => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #1e293b44" }}>
                        <td style={{ padding: "7px 4px", fontSize: 10, color: "#475569", fontFamily: "monospace" }}>{i + 1}</td>
                        <td style={{ padding: "7px 4px", fontSize: 12, color: "#e2e8f0" }}>{e.item}</td>
                        <td style={{ padding: "7px 4px" }}><Badge label={e.category} color={CATEGORY_COLORS[e.category] || "#94a3b8"} /></td>
                        <td style={{ padding: "7px 4px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: e.type === "credit" ? "#22c55e" : "#f1f5f9", textAlign: "right" }}>
                          {e.type === "credit" ? "+" : "−"}₹{e.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Grand Total Table */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 18, marginTop: 4 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, color: "#64748b", letterSpacing: 1.5, marginBottom: 14 }}>GRAND TOTAL — ALL METHODS</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>METHOD</th>
              <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>SPENT</th>
              <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>RECEIVED</th>
              <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 9, color: "#334155", fontFamily: "monospace", letterSpacing: 1 }}>NET</th>
            </tr>
          </thead>
          <tbody>
            {methodData.map(({ method, spent, received }) => {
              const net = received - spent;
              const color = PAYMENT_COLORS[method] || "#64748b";
              return (
                <tr key={method} style={{ borderBottom: "1px solid #1e293b33" }}>
                  <td style={{ padding: "8px 4px", fontSize: 12, color, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{PAYMENT_ICONS[method]}</span><span>{method}</span>
                  </td>
                  <td style={{ padding: "8px 4px", fontSize: 12, color: "#ef4444", fontFamily: "monospace", textAlign: "right" }}>
                    {spent > 0 ? `−₹${spent.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td style={{ padding: "8px 4px", fontSize: 12, color: "#22c55e", fontFamily: "monospace", textAlign: "right" }}>
                    {received > 0 ? `+₹${received.toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td style={{ padding: "8px 4px", fontSize: 12, fontWeight: 700, color: net >= 0 ? "#22c55e" : "#ef4444", fontFamily: "monospace", textAlign: "right" }}>
                    {net >= 0 ? "+" : ""}₹{net.toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid #334155" }}>
              <td style={{ padding: "10px 4px", fontSize: 13, fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>TOTAL</td>
              <td style={{ padding: "10px 4px", fontSize: 13, fontWeight: 800, color: "#ef4444", fontFamily: "monospace", textAlign: "right" }}>−₹{grandSpent.toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 4px", fontSize: 13, fontWeight: 800, color: "#22c55e", fontFamily: "monospace", textAlign: "right" }}>+₹{grandReceived.toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 4px", fontSize: 14, fontWeight: 800, color: (grandReceived - grandSpent) >= 0 ? "#22c55e" : "#ef4444", fontFamily: "monospace", textAlign: "right" }}>
                {(grandReceived - grandSpent) >= 0 ? "+" : ""}₹{(grandReceived - grandSpent).toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function VoiceBudget() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vb_entries") || "[]"); } catch { return []; }
  });
  const [budget, setBudget] = useState(() => {
    try { return parseInt(localStorage.getItem("vb_budget") || String(DEFAULT_BUDGET)); } catch { return DEFAULT_BUDGET; }
  });
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [statusMsg, setStatusMsg] = useState("");
  const [showChart, setShowChart] = useState("pie");
  const [editingId, setEditingId] = useState(null);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => { try { localStorage.setItem("vb_entries", JSON.stringify(entries)); } catch {} }, [entries]);
  useEffect(() => { try { localStorage.setItem("vb_budget", String(budget)); } catch {} }, [budget]);

  const startRecording = async () => {
    chunksRef.current = []; setTranscript(""); setStatusMsg("");
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const r = new SR(); r.continuous = true; r.interimResults = true; r.lang = "en-IN";

      r.onresult = (e) => { let f = ""; for (let i = 0; i < e.results.length; i++) f += e.results[i][0].transcript + " "; setTranscript(f.trim()); };
      r.start(); recognitionRef.current = r;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.start(); mediaRef.current = { recorder: mr, stream }; setRecording(true);
    } catch { setStatusMsg("Mic permission denied."); }
  };

  const stopRecording = () => {
    setRecording(false);
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    if (mediaRef.current) {
      const { recorder, stream } = mediaRef.current;
      recorder.onstop = () => { stream.getTracks().forEach(t => t.stop()); processWithAI(transcript || ""); };
      recorder.stop();
    }
  };

  const processWithAI = async (spokenText) => {
    if (!spokenText.trim()) { setStatusMsg("Kuch bola nahi gaya. Please record again."); return; }
    setProcessing(true); setStatusMsg("Processing...");
    const today = formatDate(new Date());
    const prompt = `You are a budget tracker AI for an Indian user who speaks Hinglish.

User said: "${spokenText}"

Extract ALL expense and income items. For each return a JSON array:
[
  {
    "item": "item name in English",
    "category": one of ["Food & Drinks","Transport","Shopping","Entertainment","Subscriptions","Credit","Others"],
    "amount": number in rupees,
    "type": "debit" or "credit",
    "paymentMethod": one of ["Debit Card","Credit Card","Cash","UPI/GPay","Unknown"]
  }
]

Rules:
- "mila","received","aaya" → type: "credit"
- All purchases → type: "debit"
- Detect payment method from words: "debit card","DC" → Debit Card; "credit card","CC" → Credit Card; "cash","nakit" → Cash; "gpay","upi","paytm","phonepe" → UPI/GPay; if not mentioned → Unknown
- Return ONLY valid JSON array, no explanation, no markdown backticks`;

    try {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
});
const data = await res.json();
const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const newEntries = parsed.map((p, i) => ({
        id: Date.now() + i, dateKey: todayKey(), date: today,
        item: p.item, category: p.category || "Others",
        amount: Number(p.amount), type: p.type || "debit",
        paymentMethod: p.paymentMethod || "Unknown",
      }));
      setEntries(prev => [...prev, ...newEntries]);
      setStatusMsg(`✅ ${newEntries.length} item${newEntries.length !== 1 ? "s" : ""} added!`);
      setTranscript("");
    } catch { setStatusMsg("Parsing failed. Try again."); }
    setProcessing(false);
  };

  const deleteEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id));
  const updatePayment = (id, method) => setEntries(prev => prev.map(e => e.id === id ? { ...e, paymentMethod: method } : e));
  const exportCSV = () => {
    const header = "Date,Item,Category,Payment Method,Type,Amount (₹)\n";
    const rows = entries.map(e => `${e.date},${e.item},${e.category},${e.paymentMethod || "Unknown"},${e.type},${e.amount}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "VoiceBudget_Export.csv"; a.click();
  };

  // Derived
  const todayEntries = entries.filter(e => e.dateKey === todayKey());
  const todaySpent = todayEntries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
  const todayReceived = todayEntries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const todayNet = todayReceived - todaySpent;
  const now2 = new Date();
  const monthEntries = entries.filter(e => { const [y, m] = e.dateKey.split("-").map(Number); return y === now2.getFullYear() && m === (now2.getMonth() + 1); });
  const monthSpent = monthEntries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
  const monthReceived = monthEntries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
  const catMap = {};
  monthEntries.filter(e => e.type === "debit").forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
  const barData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const label = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(d);
    const spent = entries.filter(e => e.dateKey === key && e.type === "debit").reduce((s, e) => s + e.amount, 0);
    barData.push({ day: label, spent });
  }
  const weekSpent = barData.reduce((s, d) => s + d.spent, 0);

  const tabStyle = (t) => ({
    padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
    fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
    background: activeTab === t ? "#f97316" : "transparent",
    color: activeTab === t ? "#0f172a" : "#64748b",
    transition: "all 0.2s", whiteSpace: "nowrap",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1a", fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500;600&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0f1a}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        select{appearance:none}
      `}</style>

      {/* Header */}
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#f97316", letterSpacing: 2, marginBottom: 3 }}>VOICEBUDGET</div>
            <div style={{ fontSize: 21, fontWeight: 600, color: "#f1f5f9" }}>Vikas's Tracker</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{formatDate(new Date())}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: todayNet >= 0 ? "#22c55e" : "#ef4444", fontFamily: "monospace" }}>
              {todayNet >= 0 ? "+" : ""}₹{todayNet.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 10, color: "#64748b" }}>today's net</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {[{ label: "Spent Today", val: todaySpent, color: "#ef4444" }, { label: "Received", val: todayReceived, color: "#22c55e" }, { label: "This Month", val: monthSpent, color: "#f97316" }].map(s => (
            <div key={s.label} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>₹{s.val.toLocaleString("en-IN")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recorder */}
      <div style={{ padding: "18px 20px 0" }}>
        <TipCard entries={entries} budget={budget} />
        <div style={{ background: "#0f172a", border: `2px solid ${recording ? "#ef4444" : "#1e293b"}`, borderRadius: 16, padding: 18, marginBottom: 14, transition: "border-color 0.3s" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
            <StatusDot active={recording} />{recording ? "Recording... bolte raho" : "Apna kharcha batao — payment method bhi bolo"}
          </div>
          {transcript && (
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#cbd5e1", marginBottom: 12, lineHeight: 1.6, fontStyle: "italic" }}>
              "{transcript}"
            </div>
          )}
          <button onClick={recording ? stopRecording : startRecording} disabled={processing} style={{
            width: "100%", padding: "15px", borderRadius: 12, border: "none",
            background: recording ? "linear-gradient(135deg,#ef4444,#b91c1c)" : processing ? "#1e293b" : "linear-gradient(135deg,#f97316,#ea580c)",
            color: processing ? "#64748b" : "#fff", fontSize: 14, fontWeight: 700, cursor: processing ? "not-allowed" : "pointer",
            fontFamily: "'DM Mono',monospace", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            {processing ? "⏳  Processing..." : recording ? "⏹  STOP & SAVE" : "🎙  TAP TO RECORD"}
          </button>
          {statusMsg && <div style={{ textAlign: "center", fontSize: 12, color: statusMsg.startsWith("✅") ? "#22c55e" : "#f97316", marginTop: 8 }}>{statusMsg}</div>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 20px 14px", display: "flex", gap: 6, overflowX: "auto" }}>
        {[["today","📅 Today"],["payments","💳 Payments"],["monthly","📆 Monthly"],["charts","📊 Charts"],["all","📋 All"]].map(([t, label]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "0 20px" }}>

        {/* TODAY TAB */}
        {activeTab === "today" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {todayEntries.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 14 }}>Aaj koi entry nahi. Record karo!</div>
            ) : (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1e293b" }}>
                      {["#","Item","Cat","Payment","Amt",""].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "7px 5px", fontSize: 9, color: "#475569", fontFamily: "monospace", letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todayEntries.map((e, i) => (
                      <tr key={e.id} style={{ borderBottom: "1px solid #1e293b22" }}>
                        <td style={{ padding: "9px 5px", fontSize: 10, color: "#475569", fontFamily: "monospace" }}>{i + 1}</td>
                        <td style={{ padding: "9px 5px", fontSize: 12, color: "#e2e8f0", maxWidth: 80 }}>{e.item}</td>
                        <td style={{ padding: "9px 5px" }}><Badge label={e.category.split(" ")[0]} color={CATEGORY_COLORS[e.category] || "#94a3b8"} /></td>
                        <td style={{ padding: "9px 5px" }}>
                          {editingId === e.id ? (
                            <select value={e.paymentMethod || "Unknown"} onChange={ev => { updatePayment(e.id, ev.target.value); setEditingId(null); }}
                              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 10, padding: "3px 6px", fontFamily: "monospace" }}>
                              {[...PAYMENT_METHODS, "Unknown"].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          ) : (
                            <span onClick={() => setEditingId(e.id)} style={{ cursor: "pointer", fontSize: 14, title: "tap to edit" }}
                              title="Tap to change payment method">
                              {PAYMENT_ICONS[e.paymentMethod || "Unknown"]}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "9px 5px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: e.type === "credit" ? "#22c55e" : "#f1f5f9", whiteSpace: "nowrap" }}>
                          {e.type === "credit" ? "+" : "−"}₹{e.amount.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "9px 5px" }}>
                          <button onClick={() => deleteEntry(e.id)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>×</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #1e293b" }}>
                      <td colSpan={4} style={{ padding: "11px 5px", fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>TODAY'S NET</td>
                      <td colSpan={2} style={{ padding: "11px 5px", fontFamily: "monospace", fontSize: 14, fontWeight: 800, color: todayNet >= 0 ? "#22c55e" : "#ef4444" }}>
                        {todayNet >= 0 ? "+" : ""}₹{todayNet.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 8, fontFamily: "monospace" }}>💡 Tap payment icon to edit method</div>
              </>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && <PaymentsTab entries={entries} />}

        {/* MONTHLY TAB */}
        {activeTab === "monthly" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <BudgetTargetCard entries={entries} budget={budget} onSetBudget={setBudget} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Total Spent", val: monthSpent, color: "#ef4444" },
                { label: "Total Received", val: monthReceived, color: "#22c55e" },
                { label: "Net Balance", val: monthReceived - monthSpent, color: (monthReceived - monthSpent) >= 0 ? "#22c55e" : "#ef4444" },
                { label: "Budget Used", val: `${Math.round((monthSpent / budget) * 100)}%`, color: monthSpent > budget ? "#ef4444" : "#f97316" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>
                    {typeof s.val === "number" ? `₹${Math.abs(s.val).toLocaleString("en-IN")}` : s.val}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={exportCSV} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #1e293b", background: "transparent", color: "#f97316", fontFamily: "monospace", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: 1 }}>
              ⬇️  EXPORT CSV (Google Sheets)
            </button>
          </div>
        )}

        {/* CHARTS TAB */}
        {activeTab === "charts" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["pie", "bar"].map(c => (
                <button key={c} onClick={() => setShowChart(c)} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #1e293b", background: showChart === c ? "#1e293b" : "transparent", color: showChart === c ? "#f97316" : "#64748b", fontFamily: "monospace", fontSize: 11, cursor: "pointer" }}>
                  {c === "pie" ? "🥧 Category" : "📊 7-Day"}
                </button>
              ))}
            </div>
            {showChart === "pie" && pieData.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, fontFamily: "monospace" }}>THIS MONTH — BY CATEGORY</div>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                      {pieData.map((entry, i) => <Cell key={i} fill={CATEGORY_COLORS[entry.name] || "#94a3b8"} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, ""]} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
            {showChart === "bar" && (
              <>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, fontFamily: "monospace" }}>LAST 7 DAYS</div>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={barData} barSize={26}>
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]} contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="spent" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                  Week total: <span style={{ color: "#f97316" }}>₹{weekSpent.toLocaleString("en-IN")}</span>
                </div>
              </>
            )}
            {showChart === "pie" && pieData.length === 0 && <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 14 }}>Is month koi data nahi.</div>}
          </div>
        )}

        {/* ALL ENTRIES TAB */}
        {activeTab === "all" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {entries.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 14 }}>Koi entry nahi hai abhi.</div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", marginBottom: 12 }}>{entries.length} total entries</div>
                {[...new Set(entries.map(e => e.dateKey))].sort((a, b) => b.localeCompare(a)).map(dk => {
                  const dayEntries = entries.filter(e => e.dateKey === dk);
                  const daySpent = dayEntries.filter(e => e.type === "debit").reduce((s, e) => s + e.amount, 0);
                  const dayReceived = dayEntries.filter(e => e.type === "credit").reduce((s, e) => s + e.amount, 0);
                  const [y, m, d] = dk.split("-");
                  return (
                    <div key={dk} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: 7, marginBottom: 7 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>{formatDate(new Date(y, m - 1, d))}</span>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: (dayReceived - daySpent) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                          Net: {(dayReceived - daySpent) >= 0 ? "+" : ""}₹{(dayReceived - daySpent).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {dayEntries.map((e, i) => (
                        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 0", borderBottom: "1px solid #1e293b11" }}>
                          <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace", width: 18 }}>{i + 1}.</span>
                          <span style={{ flex: 1, fontSize: 12, color: "#e2e8f0" }}>{e.item}</span>
                          <span style={{ fontSize: 14 }} title={e.paymentMethod}>{PAYMENT_ICONS[e.paymentMethod || "Unknown"]}</span>
                          <Badge label={e.category.split(" ")[0]} color={CATEGORY_COLORS[e.category] || "#94a3b8"} />
                          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: e.type === "credit" ? "#22c55e" : "#f1f5f9", minWidth: 75, textAlign: "right" }}>
                            {e.type === "credit" ? "+" : "−"}₹{e.amount.toLocaleString("en-IN")}
                          </span>
                          <button onClick={() => deleteEntry(e.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 13 }}>×</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
