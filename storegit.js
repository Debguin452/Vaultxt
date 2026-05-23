class StoreGitError extends Error {
  constructor(message, status) {
    super(message);
    this.name   = "StoreGitError";
    this.status = status;
  }
}

class StoreGit {
  constructor(apiKey, base = "https://storegit.pages.dev") {
    if (!apiKey) throw new StoreGitError("API key required");
    this._key  = apiKey;
    this._base = base.replace(/\/$/, "");
  }

  async _req(path, options = {}) {
    const res = await fetch(this._base + path, {
      ...options,
      headers: { "X-API-Key": this._key, ...(options.headers || {}) },
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || j.message || msg; } catch {}
      throw new StoreGitError(msg, res.status);
    }
    return res;
  }

  async list() {
    const res  = await this._req("/api/files");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.files || []);
  }

  async upload(file, name) {
    let fileName, base64;
    if (file instanceof File) {
      fileName = name || file.name;
      base64   = await _fileToBase64(file);
    } else if (file && typeof file === "object") {
      fileName = name || file.name;
      if (!fileName) throw new StoreGitError("File name required");
      if (file.text !== undefined)   base64 = _textToBase64(file.text);
      else if (file.base64)          base64 = file.base64;
      else if (file.blob)            base64 = await _fileToBase64(file.blob);
      else throw new StoreGitError("Provide text, blob, or base64");
    } else {
      throw new StoreGitError("Invalid file argument");
    }
    await this._req("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fileName, content: base64 }),
    });
    return fileName;
  }

  async download(name) {
    const res  = await this._req(`/api/download?name=${encodeURIComponent(name)}`);
    const blob = await res.blob();
    _triggerDownload(blob, name);
  }

  async getBlob(name) {
    const res = await this._req(`/api/download?name=${encodeURIComponent(name)}`);
    return res.blob();
  }

  async delete(name) {
    const files = await this.list();
    const file  = files.find(f => f.name === name);
    if (!file) throw new StoreGitError(`"${name}" not found`, 404);
    await this._req("/api/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sha: file.sha }),
    });
  }

  async saveText(name, text)       { return this.upload({ name, text }); }
  async readText(name)             { return (await this._req(`/api/download?name=${encodeURIComponent(name)}`)).text(); }
  async saveJSON(name, data)       { return this.upload({ name, text: JSON.stringify(data, null, 2) }); }
  async readJSON(name)             { return JSON.parse(await this.readText(name)); }
  async exists(name)               { return (await this.list()).some(f => f.name === name); }
  async info(name)                 { return (await this.list()).find(f => f.name === name) || null; }
  async rename(oldName, newName)   { await this.copy(oldName, newName); await this.delete(oldName); }
  async copy(src, dst)             { await this.upload({ name: dst, blob: await this.getBlob(src) }); }
  async listByType(ext)            { return (await this.list()).filter(f => f.name.toLowerCase().endsWith("." + ext.replace(/^\./, ""))); }
  async storageUsed()              { return (await this.list()).reduce((s, f) => s + (f.size || 0), 0); }
}

function _fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function _textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function _triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

window.StoreGit = StoreGit;
window.StoreGitError = StoreGitError;
