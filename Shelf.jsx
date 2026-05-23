import { useState, useEffect, useCallback, useRef } from "react";

const BASE = "https://storegit.pages.dev";
const API_KEY = "sgk_JQlJJk9evUuxZznNQ266ybTn7Lu6HqPzPjVMCSVEwVQ";
const HEADERS = { "X-API-Key": API_KEY };

const toBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const fmtSize = (b) => {
  if (!b) return "—";
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
};

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const EXT_META = {
  pdf:  { icon: "ti-file-type-pdf",  color: "#e05252" },
  txt:  { icon: "ti-file-text",      color: "#a3c4bc" },
  md:   { icon: "ti-markdown",       color: "#7eb8d4" },
  jpg:  { icon: "ti-photo",          color: "#d4a853" },
  jpeg: { icon: "ti-photo",          color: "#d4a853" },
  png:  { icon: "ti-photo",          color: "#d4a853" },
  gif:  { icon: "ti-photo",          color: "#d4a853" },
  svg:  { icon: "ti-vector",         color: "#c4a7e7" },
  webp: { icon: "ti-photo",          color: "#d4a853" },
  mp3:  { icon: "ti-music",          color: "#88c57f" },
  wav:  { icon: "ti-music",          color: "#88c57f" },
  mp4:  { icon: "ti-movie",          color: "#f4a261" },
  mov:  { icon: "ti-movie",          color: "#f4a261" },
  zip:  { icon: "ti-file-zip",       color: "#b4a7d6" },
  rar:  { icon: "ti-file-zip",       color: "#b4a7d6" },
  js:   { icon: "ti-brand-javascript",color: "#f7df1e" },
  ts:   { icon: "ti-brand-typescript",color: "#3178c6" },
  py:   { icon: "ti-brand-python",   color: "#4584b6" },
  html: { icon: "ti-brand-html5",    color: "#e34c26" },
  css:  { icon: "ti-brand-css3",     color: "#264de4" },
  json: { icon: "ti-braces",         color: "#ffd700" },
  csv:  { icon: "ti-table",          color: "#5aaa72" },
};

const getMeta = (name) => {
  const ext = (name || "").split(".").pop().toLowerCase();
  return EXT_META[ext] || { icon: "ti-file", color: "#888" };
};

const s = {
  app: {
    minHeight: "100vh",
    background: "#0d0d0c",
    fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    display: "flex",
    color: "#e8e2d9",
  },
  sidebar: {
    width: 240,
    background: "#111110",
    borderRight: "1px solid #1e1e1c",
    padding: "1.75rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flexShrink: 0,
  },
  logo: {
    padding: "0 0.75rem 1.75rem",
    borderBottom: "1px solid #1e1e1c",
    marginBottom: "0.75rem",
  },
  logoText: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#f0e8d8",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  logoBadge: {
    fontSize: 11,
    color: "#555",
    marginTop: 4,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  navBtn: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: active ? "#1c1c1a" : "transparent",
    color: active ? "#d4a853" : "#666",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "all 0.15s",
  }),
  main: {
    flex: 1,
    padding: "2rem 2.5rem",
    overflowY: "auto",
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.75rem",
  },
  h2: {
    color: "#f0e8d8",
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    background: "none",
    border: "1px solid #2a2a28",
    borderRadius: 7,
    color: "#666",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  fileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    gap: 12,
  },
  fileCard: {
    background: "#111110",
    border: "1px solid #1e1e1c",
    borderRadius: 12,
    padding: "1.1rem",
    cursor: "default",
    transition: "border-color 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  fileActions: {
    display: "flex",
    gap: 6,
    marginTop: 12,
  },
  actionBtn: (variant) => ({
    flex: 1,
    padding: "6px 0",
    background: "none",
    border: `1px solid ${variant === "del" ? "#3a1a1a" : "#2a2a28"}`,
    color: variant === "del" ? "#844" : "#666",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    transition: "all 0.15s",
  }),
  emptyState: {
    border: "1px dashed #222",
    borderRadius: 14,
    padding: "5rem 2rem",
    textAlign: "center",
    color: "#444",
  },
  toast: (type) => ({
    position: "fixed",
    bottom: 24,
    right: 24,
    padding: "11px 18px",
    borderRadius: 10,
    fontSize: 13,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: type === "success" ? "#0f2a12" : type === "error" ? "#2a0f0f" : "#1a1a0f",
    border: `1px solid ${type === "success" ? "#1e4d22" : type === "error" ? "#4d1e1e" : "#4d451e"}`,
    color: type === "success" ? "#6dbf76" : type === "error" ? "#bf6d6d" : "#bfad6d",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  }),
};

function FileCard({ file, onDownload, onDelete }) {
  const meta = getMeta(file.name);
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ ...s.fileCard, borderColor: hov ? "#2e2e2c" : "#1e1e1c" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <i
        className={`ti ${meta.icon}`}
        style={{ fontSize: 32, color: meta.color, marginBottom: 10 }}
        aria-hidden="true"
      />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#e0d8cc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file.name}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>
        {fmtSize(file.size)}{file.last_modified ? " · " + fmtDate(file.last_modified) : ""}
      </p>
      <div style={s.fileActions}>
        <button style={s.actionBtn("dl")} onClick={() => onDownload(file)} title="Download">
          <i className="ti ti-download" style={{ fontSize: 13 }} aria-hidden="true" />
          <span>Download</span>
        </button>
        <button style={s.actionBtn("del")} onClick={() => onDelete(file)} title="Delete">
          <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Toast({ status }) {
  if (!status) return null;
  const icons = { success: "ti-circle-check", error: "ti-alert-circle", info: "ti-info-circle" };
  return (
    <div style={s.toast(status.type)}>
      <i className={`ti ${icons[status.type] || icons.info}`} style={{ fontSize: 15 }} aria-hidden="true" />
      {status.text}
    </div>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <div style={{ position: "relative", width: 220 }}>
      <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#444" }} aria-hidden="true" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search files…"
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "7px 12px 7px 32px",
          background: "#111110", border: "1px solid #222",
          borderRadius: 7, color: "#e0d8cc", fontSize: 13, outline: "none",
        }}
      />
    </div>
  );
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("files");
  const [search, setSearch] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteName, setNoteName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [status, setStatus] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const fileInputRef = useRef();
  const toastTimer = useRef();

  const notify = useCallback((type, text) => {
    setStatus({ type, text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setStatus(null), 3500);
  }, []);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/files`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.files || [];
      setFiles(list);
    } catch (e) {
      notify("error", "Could not load files — " + e.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      const res = await fetch(`${BASE}/api/delete`, {
        method: "DELETE",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, sha: file.sha }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify("success", `"${file.name}" deleted`);
      setFiles(f => f.filter(x => x.name !== file.name));
    } catch (e) {
      notify("error", "Delete failed — " + e.message);
    }
  };

  const handleDownload = async (file) => {
    try {
      notify("info", `Downloading "${file.name}"…`);
      const blob = await fetch(
        `${BASE}/api/download?name=${encodeURIComponent(file.name)}`,
        { headers: HEADERS }
      ).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
      notify("success", `Downloaded "${file.name}"`);
    } catch (e) {
      notify("error", "Download failed — " + e.message);
    }
  };

  const uploadFile = async (file) => {
    if (file.size > 5 * 1024 * 1024) {
      notify("error", `"${file.name}" exceeds 5 MB limit`);
      return;
    }
    const id = crypto.randomUUID();
    setUploads(u => [...u, { id, name: file.name, state: "uploading" }]);
    try {
      const content = await toBase64(file);
      const res = await fetch(`${BASE}/api/upload`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUploads(u => u.map(x => x.id === id ? { ...x, state: "done" } : x));
      setTimeout(() => setUploads(u => u.filter(x => x.id !== id)), 2500);
      notify("success", `"${file.name}" uploaded`);
      loadFiles();
    } catch (e) {
      setUploads(u => u.map(x => x.id === id ? { ...x, state: "error", err: e.message } : x));
      notify("error", `Upload failed — ${e.message}`);
    }
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim()) { notify("error", "Note is empty"); return; }
    const raw = noteName.trim();
    const name = raw ? (raw.includes(".") ? raw : raw + ".txt") : `note-${Date.now()}.txt`;
    setSavingNote(true);
    try {
      const bytes = new TextEncoder().encode(noteContent);
      let bin = ""; bytes.forEach(b => bin += String.fromCharCode(b));
      const content = btoa(bin);
      const res = await fetch(`${BASE}/api/upload`, {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ name, content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      notify("success", `"${name}" saved to cloud`);
      setNoteContent(""); setNoteName("");
      loadFiles();
    } catch (e) {
      notify("error", "Save failed — " + e.message);
    } finally {
      setSavingNote(false);
    }
  };

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const navItems = [
    { id: "files",  icon: "ti-files",       label: "All Files" },
    { id: "notes",  icon: "ti-notes",        label: "Quick Note" },
    { id: "upload", icon: "ti-cloud-upload", label: "Upload" },
  ];

  return (
    <div style={s.app}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />

      {/* Sidebar */}
      <aside style={s.sidebar} aria-label="Navigation">
        <div style={s.logo}>
          <p style={s.logoText}>Shelf</p>
          <p style={s.logoBadge}>{files.length} file{files.length !== 1 ? "s" : ""} stored</p>
        </div>
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            style={s.navBtn(view === id)}
            onClick={() => setView(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 17 }} aria-hidden="true" />
            {label}
          </button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #1e1e1c" }}>
          <p style={{ fontSize: 11, color: "#333", padding: "0 12px", margin: 0 }}>
            storegit.pages.dev
          </p>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>

        {/* ── FILES VIEW ── */}
        {view === "files" && (
          <section>
            <div style={s.header}>
              <h2 style={s.h2}>All Files</h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <SearchBar value={search} onChange={setSearch} />
                <button
                  style={s.iconBtn}
                  onClick={loadFiles}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#aaa"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a28"; e.currentTarget.style.color = "#666"; }}
                >
                  <i className="ti ti-refresh" style={{ fontSize: 14 }} aria-hidden="true" />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ ...s.emptyState, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <i className="ti ti-loader" style={{ fontSize: 18, animation: "spin 1s linear infinite" }} aria-hidden="true" />
                Loading…
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filtered.length === 0 ? (
              <div style={s.emptyState}>
                <i className="ti ti-folders" style={{ fontSize: 44, color: "#333", display: "block", marginBottom: 16 }} aria-hidden="true" />
                <p style={{ margin: 0, fontSize: 15 }}>
                  {search ? `No files matching "${search}"` : "No files yet — upload something!"}
                </p>
                {!search && (
                  <button
                    onClick={() => setView("upload")}
                    style={{ marginTop: 16, padding: "8px 20px", background: "#d4a853", border: "none", borderRadius: 8, color: "#0d0d0c", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    Upload Now
                  </button>
                )}
              </div>
            ) : (
              <div style={s.fileGrid}>
                {filtered.map(file => (
                  <FileCard
                    key={file.name}
                    file={file}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── NOTES VIEW ── */}
        {view === "notes" && (
          <section>
            <div style={s.header}>
              <h2 style={s.h2}>Quick Note</h2>
            </div>
            <div style={{ maxWidth: 660 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  File name
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#111110", border: "1px solid #222", borderRadius: 8, overflow: "hidden" }}>
                  <i className="ti ti-file-text" style={{ fontSize: 15, color: "#555", padding: "0 10px" }} aria-hidden="true" />
                  <input
                    placeholder="my-note  (defaults to note-timestamp.txt)"
                    value={noteName}
                    onChange={e => setNoteName(e.target.value)}
                    style={{
                      flex: 1, padding: "10px 12px 10px 0",
                      background: "none", border: "none",
                      color: "#e0d8cc", fontSize: 13, outline: "none",
                    }}
                  />
                  <span style={{ padding: "0 12px", fontSize: 12, color: "#444" }}>
                    {noteName && !noteName.includes(".") ? ".txt" : ""}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Content
                </label>
                <textarea
                  placeholder="Start writing…"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={16}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "16px",
                    background: "#111110", border: "1px solid #222",
                    borderRadius: 8, color: "#e0d8cc", fontSize: 14,
                    fontFamily: "'DM Mono', 'Courier New', monospace",
                    lineHeight: 1.75, resize: "vertical", outline: "none",
                  }}
                />
                <p style={{ textAlign: "right", fontSize: 11, color: "#444", margin: "6px 0 0" }}>
                  {noteContent.length} characters · {noteContent.split(/\n/).length} lines
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteContent.trim()}
                  style={{
                    padding: "10px 28px",
                    background: savingNote || !noteContent.trim() ? "#2a2a28" : "#d4a853",
                    border: "none", borderRadius: 8,
                    color: savingNote || !noteContent.trim() ? "#555" : "#0d0d0c",
                    fontWeight: 600, fontSize: 14, cursor: savingNote || !noteContent.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  <i className={`ti ${savingNote ? "ti-loader" : "ti-cloud-upload"}`} style={{ fontSize: 15 }} aria-hidden="true" />
                  {savingNote ? "Saving…" : "Save to Cloud"}
                </button>
                <button
                  onClick={() => { setNoteContent(""); setNoteName(""); }}
                  style={{ padding: "10px 20px", background: "none", border: "1px solid #2a2a28", borderRadius: 8, color: "#666", fontSize: 14, cursor: "pointer" }}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── UPLOAD VIEW ── */}
        {view === "upload" && (
          <section>
            <div style={s.header}>
              <h2 style={s.h2}>Upload Files</h2>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Drop zone: drag files here or click to choose files"
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(uploadFile); }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#d4a853" : "#2a2a28"}`,
                borderRadius: 16, padding: "5rem 2rem",
                textAlign: "center", cursor: "pointer",
                background: isDragging ? "rgba(212,168,83,0.04)" : "transparent",
                transition: "all 0.2s",
              }}
            >
              <i
                className="ti ti-cloud-upload"
                style={{ fontSize: 52, color: isDragging ? "#d4a853" : "#2e2e2c", display: "block", marginBottom: 20 }}
                aria-hidden="true"
              />
              <p style={{ color: "#c0b8ac", fontSize: 16, margin: "0 0 8px", fontWeight: 500 }}>
                {isDragging ? "Release to upload" : "Drop files here or click to browse"}
              </p>
              <p style={{ color: "#444", fontSize: 13, margin: 0 }}>
                Any file type · max 5 MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={e => { Array.from(e.target.files).forEach(uploadFile); e.target.value = ""; }}
              />
            </div>

            {uploads.length > 0 && (
              <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontSize: 12, color: "#555", margin: "0 0 4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Transfers
                </p>
                {uploads.map(item => {
                  const meta = getMeta(item.name);
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 14px",
                        background: "#111110", border: "1px solid #1e1e1c",
                        borderRadius: 10,
                      }}
                    >
                      <i className={`ti ${meta.icon}`} style={{ fontSize: 20, color: meta.color, flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ flex: 1, fontSize: 13, color: "#e0d8cc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </span>
                      {item.state === "uploading" && (
                        <span style={{ fontSize: 12, color: "#888", display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-loader" style={{ fontSize: 13 }} aria-hidden="true" /> Uploading
                        </span>
                      )}
                      {item.state === "done" && (
                        <span style={{ fontSize: 12, color: "#6dbf76", display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-circle-check" style={{ fontSize: 13 }} aria-hidden="true" /> Done
                        </span>
                      )}
                      {item.state === "error" && (
                        <span style={{ fontSize: 12, color: "#bf6d6d", display: "flex", alignItems: "center", gap: 5 }}>
                          <i className="ti ti-alert-circle" style={{ fontSize: 13 }} aria-hidden="true" /> {item.err}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "2rem", padding: "1.25rem 1.5rem", background: "#111110", border: "1px solid #1e1e1c", borderRadius: 12 }}>
              <p style={{ fontSize: 12, color: "#555", margin: "0 0 10px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Storage info
              </p>
              <div style={{ display: "flex", gap: "2rem" }}>
                {[
                  { label: "Total files", val: files.length },
                  { label: "Total size", val: fmtSize(files.reduce((a, f) => a + (f.size || 0), 0)) },
                  { label: "File limit", val: "5 MB" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: "#555", margin: "0 0 4px" }}>{label}</p>
                    <p style={{ fontSize: 20, fontWeight: 600, color: "#d4a853", margin: 0 }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Toast status={status} />
    </div>
  );
}
