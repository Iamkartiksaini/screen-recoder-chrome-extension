import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// Import CSS as raw strings to inject into Shadow DOM
import indexCss from './index.css?inline'
import appCss from './App.module.scss?inline'

const css = `${indexCss}\n${appCss}`

console.log('%c[Screen Recorder] CONTENT SCRIPT INITIALIZING...', 'background: #222; color: #bada55; font-size: 20px');

const rootId = 'screen-recorder-root';

// Utility for toggling
const performToggle = () => {
    const root = document.getElementById(rootId);
    if (root) {
        const container = root.shadowRoot.querySelector('#screen-recorder-container');
        if (container) {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? 'block' : 'none';
        }
    } else {
        mount();
    }
}

// Register listener for subsequent clicks
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TOGGLE_UI") {
        performToggle();
    }
    if (request.action === "REMOVE_UI") {
        const root = document.getElementById(rootId);
        if (root) root.remove();
    }
});

const mount = async () => {
    if (!document.body) return;

    // Check for existing root (Zombie prevention)
    const existingRoot = document.getElementById(rootId);
    if (existingRoot) {
        console.log('[Screen Recorder] Removing orphaned root element');
        existingRoot.remove();
    }

    const root = document.createElement('div');
    root.id = rootId;
    root.setAttribute('style', 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:2147483647; pointer-events:none;');
    document.body.appendChild(root);

    const shadowRoot = root.attachShadow({ mode: 'open' });

    try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        shadowRoot.adoptedStyleSheets = [sheet];
    } catch (e) {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = css;
        shadowRoot.appendChild(styleSheet);
    }

    const appContainer = document.createElement('div');
    appContainer.id = 'screen-recorder-container';
    appContainer.style.display = 'block'; // Show immediately on first mount
    appContainer.style.pointerEvents = 'auto';

    shadowRoot.appendChild(appContainer);
    console.log('[Screen Recorder] App container appended to shadow DOM');

    const hideUI = () => {
        appContainer.style.display = 'none';
    };

    createRoot(appContainer).render(
        <React.StrictMode>
            <App onClose={hideUI} />
        </React.StrictMode>
    );

    // After rendering, show it since mount was likely triggered by a click
    setTimeout(() => {
        appContainer.style.display = 'block';
    }, 100);

    console.log('[Screen Recorder] App container appended and rendered');
}

// Initialize on injection
mount();
