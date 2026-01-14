import { useState, useRef, useEffect } from 'react';
import {
    Mic, MicOff, Square, Download, RotateCcw,
    Settings, X,
    Sun, Moon, GripVertical
} from 'lucide-react';
import styles from './App.module.scss';

const ScreenRecorder = (props) => {
    const [status, setStatus] = useState('idle'); // idle, recording, preview
    const [isExpanded, setIsExpanded] = useState(true);

    // Settings
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [resolution, setResolution] = useState('1080p');
    const [frameRate, setFrameRate] = useState(60);
    const [outputFormat, setOutputFormat] = useState('webm'); // webm, mp4
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Dragging State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        maxX: 0,
        minX: 0,
        maxY: 0,
        minY: 0
    });
    const floatingDockRef = useRef(null);

    const [recordedBlob, setRecordedBlob] = useState(null);
    const [time, setTime] = useState(0);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const animationFrameRef = useRef(null);
    const hiddenVideoRef = useRef(null);

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

    // Clean up streams on unmount
    useEffect(() => {
        return () => {
            stopAllTracks();
        };
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const stopAllTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (hiddenVideoRef.current) {
            hiddenVideoRef.current.srcObject = null;
            if (hiddenVideoRef.current.load) hiddenVideoRef.current.load();
            hiddenVideoRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        clearInterval(timerIntervalRef.current);
    };

    const getConstraints = () => {
        const resMap = {
            '720p': { width: 1280, height: 720, bitrate: 2500000 },
            '1080p': { width: 1920, height: 1080, bitrate: 8000000 },
            '4k': { width: 3840, height: 2160, bitrate: 15000000 }
        };
        const selected = resMap[resolution];

        return {
            video: {
                width: { ideal: selected.width },
                height: { ideal: selected.height },
                frameRate: { ideal: frameRate }
            },
            bitrate: selected.bitrate
        };
    };

    // Drag Handlers
    const handleMouseDown = (e) => {
        if (isExpanded) return; // Only drag when collapsed
        if (!floatingDockRef.current) return;

        const rect = floatingDockRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const maxX = 24;
        const minX = -(viewportWidth - rect.width - 24);
        const maxY = 24;
        const minY = -(viewportHeight - rect.height - 24);

        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
            minX, maxX, minY, maxY
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!dragRef.current.isDragging) return;

        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        let newX = dragRef.current.initialX + dx;
        let newY = dragRef.current.initialY + dy;

        newX = Math.min(Math.max(newX, dragRef.current.minX), dragRef.current.maxX);
        newY = Math.min(Math.max(newY, dragRef.current.minY), dragRef.current.maxY);

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        dragRef.current.isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const startRecording = async () => {
        setError('');
        const config = getConstraints();

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: config.video,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                },
                preferCurrentTab: false,
                selfBrowserSurface: 'include'
            });

            let micStream = null;
            if (audioEnabled) {
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true
                        }
                    });
                } catch (micErr) {
                    console.warn("Mic access denied or unavailable", micErr);
                    setError("Microphone access denied. Recording screen only.");
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = config.video.width.ideal;
            canvas.height = config.video.height.ideal;
            const ctx = canvas.getContext('2d', { alpha: false });

            const video = document.createElement('video');
            video.srcObject = displayStream;
            video.muted = true;
            hiddenVideoRef.current = video;
            await video.play();

            const draw = () => {
                if (!hiddenVideoRef.current) return;
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const srcW = video.videoWidth;
                const srcH = video.videoHeight;
                if (srcW && srcH) {
                    const ratio = Math.min(canvas.width / srcW, canvas.height / srcH);
                    const destW = srcW * ratio;
                    const destH = srcH * ratio;
                    const destX = (canvas.width - destW) / 2;
                    const destY = (canvas.height - destH) / 2;
                    ctx.drawImage(video, destX, destY, destW, destH);
                }
                animationFrameRef.current = requestAnimationFrame(draw);
            };
            draw();

            const canvasStream = canvas.captureStream(frameRate);
            const tracks = [
                ...canvasStream.getVideoTracks(),
                ...displayStream.getAudioTracks(),
                ...(micStream ? micStream.getAudioTracks() : [])
            ];

            const combinedStream = new MediaStream(tracks);
            streamRef.current = combinedStream;

            let selectedMime = 'video/webm';
            if (outputFormat === 'mp4') {
                const mp4Types = ['video/mp4;codecs=h264', 'video/mp4;codecs=avc1', 'video/mp4', 'video/x-matroska;codecs=avc1'];
                selectedMime = mp4Types.find(type => MediaRecorder.isTypeSupported(type));
                if (!selectedMime) {
                    setError("MP4 format not supported by your browser. Using WebM instead.");
                    selectedMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
                }
            } else {
                selectedMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
            }

            const options = { mimeType: selectedMime, videoBitsPerSecond: config.bitrate };
            const mediaRecorder = new MediaRecorder(combinedStream, options);
            mediaRecorderRef.current = mediaRecorder;

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

            mediaRecorder.onstop = () => {
                const mimeType = mediaRecorder.mimeType || `video/${outputFormat}`;
                const blob = new Blob(chunks, { type: mimeType });
                setRecordedBlob(blob);
                stopAllTracks();
                setStatus('preview');
                setIsExpanded(true);
                setPosition({ x: 0, y: 0 });
            };

            displayStream.getVideoTracks()[0].onended = () => stopRecording();

            mediaRecorder.start();
            setStatus('recording');
            setIsExpanded(false);
            setTime(0);
            timerIntervalRef.current = setInterval(() => setTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error(err);
            setError("Failed to start recording. Permissions?");
            setStatus('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            clearInterval(timerIntervalRef.current);
        }
    };

    const downloadRecording = () => {
        if (!recordedBlob) return;
        const url = URL.createObjectURL(recordedBlob);
        let extension = 'webm';
        if (recordedBlob.type.includes('mp4')) extension = 'mp4';
        else if (recordedBlob.type.includes('matroska')) extension = 'mkv';

        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${resolution}-${frameRate}fps-${new Date().toISOString()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setRecordedBlob(null);
        setStatus('idle');
        setTime(0);
        setError('');
    };

    const isDockHighUp = position.y < -(window.innerHeight / 2);
    const isDockFarLeft = position.x < -(window.innerWidth / 2);

    const SettingsPopup = () => (
        <div className={`${styles.settingsPopup} ${isDockHighUp ? styles.bottom : styles.top} ${isDockFarLeft ? styles.left : styles.right}`}>
            <div className={styles.popupHeader}>
                <h3>Recording Settings</h3>
                <button onClick={() => setIsExpanded(false)} className={styles.settingsButton}>
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

    const PreviewModal = () => (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Recording Preview</h3>
                    <button onClick={reset} className={styles.settingsButton}>
                        <X size={20} />
                    </button>
                </div>
                <div className={styles.videoPreview}>
                    <video src={recordedBlob ? URL.createObjectURL(recordedBlob) : ''} controls />
                </div>
                <div className={styles.modalFooter}>
                    <button onClick={reset} className={styles.btnSecondary}><RotateCcw size={18} /> Discard</button>
                    <button onClick={downloadRecording} className={styles.btnPrimary}><Download size={18} /> Download Video</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`${styles.recorderApp} ${isDarkMode ? styles.dark : ''}`}>
            {status === 'preview' && <PreviewModal />}
            <div ref={floatingDockRef} className={styles.floatingDock} style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
                {error && <div className={styles.errorToast}>{error}</div>}
                {isExpanded && status === 'idle' && <SettingsPopup />}
                <div onMouseDown={handleMouseDown} className={`${styles.actionPill} ${!isExpanded ? styles.isDraggable : ''}`}>
                    <div className={styles.statusInfo}>
                        {!isExpanded && <GripVertical size={14} className={styles.grip} />}
                        <div className={`${styles.dot} ${status === 'recording' ? styles.recording : ''}`} />
                        <div className={styles.timerLabel}>
                            <span>{status === 'recording' ? 'REC' : 'IDLE'}</span>
                            <span className={`${styles.timeText} ${status === 'recording' ? styles.recording : ''}`}>
                                {status === 'recording' ? formatTime(time) : '0:00'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.actionButtons} onMouseDown={e => e.stopPropagation()}>
                        {status === 'idle' ? (
                            <>
                                <button onClick={() => setIsExpanded(!isExpanded)} className={`${styles.settingsButton} ${isExpanded ? styles.active : ''}`}>
                                    <Settings size={20} />
                                </button>
                                <button onClick={startRecording} className={styles.recordButton}>
                                    <div className={styles.dot} />
                                    <span>Record</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={stopRecording} className={styles.stopButton}>
                                <Square size={14} style={{ fill: 'currentColor' }} />
                                <span>Stop</span>
                            </button>
                        )}
                    </div>
                </div>
                {!isExpanded && status === 'recording' && (
                    <div className={styles.tag}>{resolution.toUpperCase()} • {frameRate}FPS</div>
                )}
            </div>
        </div>
    );
};

export default ScreenRecorder;