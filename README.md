# Chrome Screen Recorder

A powerful, lightweight, and privacy-focused screen recording extension for Google Chrome. Built with modern web technologies, this tool offers professional-grade recording capabilities directly from your browser without the need for external software.

## 🎯 Motive

The goal of this project is to provide users with a seamless, zero-install solution for screen capturing. whether for creating tutorials, recording bug reports, or saving streaming content. Unlike cloud-based alternatives, this extension processes everything locally, ensuring your data never leaves your device and offering superior performance with low latency.

## ✨ Key Features

### 🎥 High-Quality Recording

- **Flexible Resolutions**: Choose between **720p**, **1080p**, and **4K** quality settings.
- **Variable Frame Rates**: Support for smooth **60 FPS** recording or standard **30 FPS**.
- **Smart Bitrate Management**: Automatically adjusts bitrates based on your selected resolution for optimal quality-to-size ratio.

### 🎙️ Audio Mixing

- **System Audio**: Capture internal computer sounds perfectly.
- **Microphone Support**: Overlay your voice for commentary.
- **Advanced Processing**: Built-in **Echo Cancellation** and **Noise Suppression** for crystal clear audio.

### 🛠️ Versatile Formats

- **Format Selection**: Native support for **WebM** and **MP4** export options.
- **Compatibility**: Smart fallback mechanisms ensure you always get a usable file even if your browser lacks specific codec support.

### 🎨 Modern & Intuitive UI

- **Floating Dock**: A non-intrusive control panel that floats over your content.
- **Draggable Interface**: Move the controls anywhere on your screen to avoid blocking important content.
- **Theme Support**: Toggle between **Dark Mode** and **Light Mode** to match your system preference.
- **Instant Preview**: Watch your recording immediately in a modal before saving.

## 🚀 Technologies Used

- **React**: For a dynamic and responsive user interface.
- **Vite**: For lightning-fast build tooling.
- **SCSS Modules**: For modular and collision-free styling.
- **Lucide React**: For beautiful, consistent iconography.
- **MediaStream Recording API**: For native browser-based media capturing.

## 📖 How to Use

1. **Launch the Extension**: Click the extension icon to open the floating dock.
2. **Configure**: Click the settings gear to adjust resolution, FPS, and audio sources.
3. **Record**: Hit the **Record** button and select the screen, window, or tab you wish to capture.
4. **Control**: The dock minimizes into a draggable pill. Use it to check recording duration or stop the recording.
5. **Save**: Upon stopping, a preview window appears. Review your clip and click **Download** to save it to your device.

## 📦 Installation (Development)

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```
