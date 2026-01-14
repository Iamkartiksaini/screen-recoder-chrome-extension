import React, { useRef, useState, useEffect } from 'react';
import { Settings, GripVertical, Square, Pause, Play } from 'lucide-react';
import styles from '../App.module.scss';
import SettingsPopup from './SettingsPopup';

const ControlDock = ({
    status,
    time,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isPaused,
    isDarkMode,
    setIsDarkMode,
    settings,
    error
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        maxX: 0, minX: 0, maxY: 0, minY: 0
    });
    const dockRef = useRef(null);

    // Format time helper
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseDown = (e) => {
        // Allow drag if collapsed OR if we are in recording mode (where it acts as a compact pill)
        if (isExpanded && status === 'idle') return;

        if (!dockRef.current) return;

        const rect = dockRef.current.getBoundingClientRect();
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

    // Calculate popup alignment
    const getPopupClass = () => {
        // Since we don't have the popup ref before it renders, we use rough estimates or sticky logic
        // But better: base it on the dock's position in the viewport
        if (!dockRef.current) return styles.bottom; // default

        const rect = dockRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = window.innerWidth - rect.right;

        let vPos = 'bottom';
        if (spaceBelow < 400 && spaceAbove > 400) {
            vPos = 'top';
        }

        let hPos = 'right'; // align right edge of popup with right edge of dock
        // If dock is very far left, align left
        if (rect.left < 280) {
            hPos = 'left';
        }

        return `${styles[vPos]} ${styles[hPos]}`;
    };

    const positionClass = getPopupClass();

    // Determine if we are in "compact/pill" mode (drag capable)
    const isDraggableMode = !isExpanded || status !== 'idle';
    const showRecordingControls = status === 'recording' || status === 'paused';

    return (
        <div ref={dockRef} className={styles.floatingDock} style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
            {error && <div className={styles.errorToast}>{error}</div>}

            {isExpanded && status === 'idle' && (
                <SettingsPopup
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    settings={settings}
                    onClose={() => setIsExpanded(false)}
                    positionClass={positionClass}
                />
            )}

            <div onMouseDown={handleMouseDown} className={`${styles.actionPill} ${isDraggableMode ? styles.isDraggable : ''}`}>
                <div className={styles.statusInfo}>
                    {isDraggableMode && <GripVertical size={14} className={styles.grip} />}

                    <div className={`${styles.dot} ${status === 'recording' ? styles.recording : ''} ${status === 'paused' ? styles.paused : ''}`} />

                    <div className={styles.timerLabel}>
                        <span>{status === 'idle' ? 'IDLE' : (status === 'paused' ? 'PAUSED' : 'REC')}</span>
                        <span className={`${styles.timeText} ${status === 'recording' ? styles.recording : ''}`}>
                            {status === 'idle' ? '0:00' : formatTime(time)}
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
                        <>
                            {status === 'paused' ? (
                                <button onClick={resumeRecording} className={styles.iconButton} title="Resume">
                                    <Play size={14} style={{ fill: 'currentColor' }} />
                                </button>
                            ) : (
                                <button onClick={pauseRecording} className={styles.iconButton} title="Pause">
                                    <Pause size={14} style={{ fill: 'currentColor' }} />
                                </button>
                            )}

                            <button onClick={stopRecording} className={styles.stopButton}>
                                <Square size={14} style={{ fill: 'currentColor' }} />
                                <span>Stop</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ControlDock;
