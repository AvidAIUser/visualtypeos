const OctoroitBridge = {
  _pending: {}, _id: 0,
  request(type, payload = {}) {
    return new Promise(res => {
      const id = ++this._id;
      this._pending[id] = res;
      window.parent.postMessage({ type, id, ...payload }, '*');
    });
  },
  notify(text, level = 'info') { this.request('notify', { text, level }); },
  log(text) { this.request('log', { text }); },
  init() {
    window.addEventListener('message', e => {
      if (e.data?.id && this._pending[e.data.id]) {
        this._pending[e.data.id](e.data);
        delete this._pending[e.data.id];
      }
    });
  }
};
OctoroitBridge.init();
// Example usage inside sandboxed app:
// const file = await OctoroitBridge.request('fs_read', { path: '/home/user/desktop/note.txt' });
// OctoroitBridge.notify('Loaded successfully!');