const { contextBridge } = require('electron');

// Expose a tiny, read-only bridge for diagnostics.
// Keeping this minimal reduces attack surface and follows Electron security guidance.
contextBridge.exposeInMainWorld('desktopRuntime', {
  blnIsElectron: true,
  strPlatform: process.platform
});

