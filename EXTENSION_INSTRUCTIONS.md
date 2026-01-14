# How to Build and Load the Screen Recorder Extension

## 1. Build the Project
Open your terminal in `d:\React\screen-recorder` and run:

```bash
npm run build
```

This will create a `dist` folder containing the compiled extension.

## 2. Load in Chrome
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (toggle in the top right).
3.  Click **Load unpacked**.
4.  Select the `dist` folder inside `d:\React\screen-recorder`.

## 3. Verify
- You should see the "React Screen Recorder" extension in the list.
- Click the extension icon in the toolbar.
- The recorder popup should appear.
