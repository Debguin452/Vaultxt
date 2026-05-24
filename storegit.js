'use strict';
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.StoreGit = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  function StoreGit(opts) {
    if (!opts || !opts.apiKey) throw new Error('StoreGit: apiKey is required');
    if (!opts.apiKey.startsWith('sgk_'))  throw new Error('StoreGit: invalid apiKey format');
    this._key  = opts.apiKey;
    this._base = (opts.base || 'https://storegit.pages.dev').replace(/\/$/, '');
  }

  StoreGit.prototype._req = async function (method, path, body, rawResponse) {
    const opts = {
      method,
      headers: { Authorization: 'Bearer ' + this._key },
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const r = await fetch(this._base + '/api/' + path, opts);
    if (rawResponse) return r;
    const ct = r.headers.get('Content-Type') || '';
    if (!r.ok) {
      const msg = ct.includes('json')
        ? ((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`)
        : `HTTP ${r.status}`;
      throw new Error('StoreGit: ' + msg);
    }
    return ct.includes('json') ? r.json() : r.text();
  };

  StoreGit.prototype.list = function () {
    return this._req('GET', 'files');
  };

  StoreGit.prototype.read = function (name) {
    if (!name) return Promise.reject(new Error('StoreGit: name is required'));
    return this._req('GET', 'read?name=' + encodeURIComponent(name));
  };

  StoreGit.prototype.upload = async function (name, content) {
    if (!name)    throw new Error('StoreGit: name is required');
    if (content === undefined || content === null) throw new Error('StoreGit: content is required');
    let b64;
    if (typeof content === 'string') {
      b64 = btoa(unescape(encodeURIComponent(content)));
    } else if (content instanceof ArrayBuffer || ArrayBuffer.isView(content)) {
      const bytes = content instanceof ArrayBuffer ? new Uint8Array(content) : new Uint8Array(content.buffer);
      let bin = '';
      bytes.forEach(b => bin += String.fromCharCode(b));
      b64 = btoa(bin);
    } else if (content instanceof Blob) {
      const ab = await content.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let bin = '';
      bytes.forEach(b => bin += String.fromCharCode(b));
      b64 = btoa(bin);
    } else {
      throw new Error('StoreGit: content must be a string, ArrayBuffer, TypedArray, or Blob');
    }
    return this._req('POST', 'upload', { name, content: b64 });
  };

  StoreGit.prototype.delete = function (name, sha) {
    if (!name) return Promise.reject(new Error('StoreGit: name is required'));
    return this._req('DELETE', 'delete', sha ? { name, sha } : { name, chunked: true });
  };

  StoreGit.prototype.download = async function (name) {
    if (!name) throw new Error('StoreGit: name is required');
    const text = await this.read(name);
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return StoreGit;
}));
