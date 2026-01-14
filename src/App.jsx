import { useEffect, useState, useRef } from 'react';
import styles from './App.module.scss';
import { useScreenRecorder } from './hooks/useScreenRecorder';
import ControlDock from './components/ControlDock';

const ScreenRecorder = (props) => {
    const {
        status, setStatus,
        time,
        error,
        recordedBlob,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        isPaused,
        settings
    } = useScreenRecorder();

    const [isDarkMode, setIsDarkMode] = useState(false);
    const rootRef = useRef(null);

    const previewUrlRef = useRef(null);

    // Auto-hide when tab is switched and idle
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && status === 'idle') {
                if (props.onClose) {
                    props.onClose();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [status, props.onClose]);

    // Handle Messages
    useEffect(() => {
        const handleMessage = (request, sender, sendResponse) => {
            if (request.action === "GET_STATUS") {
                sendResponse({ status, time });
            }
            if (request.action === "STOP_RECORDING") {
                stopRecording();
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [status, time, stopRecording]);

    // Send updates to Background (for Badge)
    useEffect(() => {
        if (status === 'recording' || status === 'paused') {
            try {
                chrome.runtime.sendMessage({ action: "UPDATE_STATUS", status, time });
            } catch (e) { }
        } else {
            try {
                chrome.runtime.sendMessage({ action: "UPDATE_STATUS", status: 'idle', time: 0 });
            } catch (e) { }
        }
    }, [status, time]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    // Handle Preview (Open New Tab)
    useEffect(() => {
        if (status === 'preview' && recordedBlob) {
            // Revoke previous URL if it exists to avoid memory leaks
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }

            const url = URL.createObjectURL(recordedBlob);
            previewUrlRef.current = url;

            window.open(url, '_blank');

            setStatus('idle');
            // Show dock again on idle
            if (rootRef.current && rootRef.current.parentElement) {
                rootRef.current.parentElement.style.display = 'block';
            }
        }
    }, [status, recordedBlob, setStatus]);

    // Auto-Hide Dock on Start Recording
    // IMPORTANT: Only hide when transitioning from idle to recording initially
    // We don't want to auto-hide if the user just paused/resumed or manually toggled it back
    useEffect(() => {
        if (status === 'recording' && time <= 1) {
            // Simple heuristic: if time is near 0, it's a fresh start. 
            // Better: use a ref to track if we've already auto-hidden for this session.
            if (rootRef.current && rootRef.current.parentElement) {
                rootRef.current.parentElement.style.display = 'none';
            }
        }
    }, [status, time]);

    return (
        <div ref={rootRef} className={`${styles.recorderApp} ${isDarkMode ? styles.dark : ''}`}>
            <ControlDock
                status={status}
                time={time}
                startRecording={startRecording}
                stopRecording={stopRecording}
                pauseRecording={pauseRecording}
                resumeRecording={resumeRecording}
                isPaused={isPaused}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                settings={settings}
                error={error}
            />
        </div>
    );
};

export default ScreenRecorder;