import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
    manifest_version: 3,
    name: 'Screen Recorder',
    version: '1.0.0',
    permissions: ['activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    background: {
        service_worker: 'src/background.js',
    },
    action: {
        default_icon: {
            '16': 'favicon_io/favicon-16x16.png',
            '32': 'favicon_io/favicon-32x32.png',
            '48': 'favicon_io/android-chrome-192x192.png',
            '128': 'favicon_io/android-chrome-192x192.png',
        },
    },
    icons: {
        '16': 'favicon_io/favicon-16x16.png',
        '32': 'favicon_io/favicon-32x32.png',
        '48': 'favicon_io/android-chrome-192x192.png',
        '128': 'favicon_io/android-chrome-192x192.png',
    },
})
