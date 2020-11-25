const path = require('path')
const os = require('os')

// Use a set of builtin plugins in our application.
process.env.THEIA_DEFAULT_PLUGINS = `local-dir:${path.resolve(__dirname, '..', 'theia_plugins')}`

// Add bundled plugins
process.env.THEIA_PLUGINS = [
    process.env.THEIA_PLUGINS,
    `local-dir:${path.resolve(__dirname, '..', 'plugins')}`
].filter(Boolean).join(',')

// Lookup inside the user's home folder for more plugins, and accept user-defined paths.
process.env.THEIA_PLUGINS = [
    process.env.THEIA_PLUGINS,
    `local-dir:${path.resolve(os.homedir(), '.vuengine', 'plugins')}`,
].filter(Boolean).join(',')

// Handover to the auto-generated electron application handler.
require('../src-gen/frontend/electron-main.js')
