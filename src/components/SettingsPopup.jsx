import React from 'react';
import { Mic, MicOff, Sun, Moon, X } from 'lucide-react';
import styles from '../App.module.scss'; // Assuming styles are still there or we pass classes

const SettingsPopup = ({ 
    isDarkMode, 
    setIsDarkMode, 
    settings, 
    onClose,
    positionClass 
}) => {
    const {
        audioEnabled, setAudioEnabled,
        resolution, setResolution,
        frameRate, setFrameRate,
        outputFormat, setOutputFormat
    } = settings;

    return (
        <div className={`${styles.settingsPopup} ${positionClass}`}>
            <div className={styles.popupHeader}>
                <h3>Recording Settings</h3>
                <button onClick={onClose} className={styles.settingsButton}>
                    <X size={16} />
                </button>
            </div>

            <div className={styles.popupContent}>
                <div className={styles.toggleContainer}>
                    <button onClick={() => setIsDarkMode(false)} className={`${styles.toggleButton} ${!isDarkMode ? `${styles.active} ${styles.lightTheme}` : ''}`}>
                        <Sun size={14} /> Light
                    </button>
                    <button onClick={() => setIsDarkMode(true)} className={`${styles.toggleButton} ${isDarkMode ? `${styles.active} ${styles.darkTheme}` : ''}`}>
                        <Moon size={14} /> Dark
                    </button>
                </div>

                <div className={styles.optionGroup}>
                    <label>Resolution</label>
                    <div className={styles.toggleContainer}>
                        {['720p', '1080p', '4k'].map((res) => (
                            <button key={res} onClick={() => setResolution(res)} className={`${styles.toggleButton} ${resolution === res ? styles.active : ''}`}>
                                {res.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.optionGroup}>
                    <label>Frame Rate</label>
                    <div className={styles.toggleContainer}>
                        {[30, 60].map((fps) => (
                            <button key={fps} onClick={() => setFrameRate(fps)} className={`${styles.toggleButton} ${frameRate === fps ? styles.active : ''}`}>
                                {fps} FPS
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.optionGroup}>
                    <label>Output Format</label>
                    <div className={styles.toggleContainer}>
                        {['webm', 'mp4'].map((fmt) => (
                            <button key={fmt} onClick={() => setOutputFormat(fmt)} className={`${styles.toggleButton} ${outputFormat === fmt ? styles.active : ''}`}>
                                {fmt.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={() => setAudioEnabled(!audioEnabled)} className={`${styles.audioToggleButton} ${audioEnabled ? styles.enabled : ''}`}>
                    <div className={styles.labelArea}>
                        {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                        <span>Microphone Mixing</span>
                    </div>
                    <div className={`${styles.switch} ${audioEnabled ? styles.on : ''}`}>
                        <div className={styles.thumb} style={{ left: audioEnabled ? '18px' : '2px' }} />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default SettingsPopup;
