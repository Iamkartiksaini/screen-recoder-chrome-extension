import { useState, useRef, useEffect, useCallback } from 'react';

export const useScreenRecorder = () => {
    const [status, setStatus] = useState('idle'); // idle, recording, paused, preview
    const [isPaused, setIsPaused] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [resolution, setResolution] = useState('1080p');
    const [frameRate, setFrameRate] = useState(60);
    const [outputFormat, setOutputFormat] = useState('webm');

    const [recordedBlob, setRecordedBlob] = useState(null);
    const [time, setTime] = useState(0);
    const [error, setError] = useState('');

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const animationFrameRef = useRef(null);
    const hiddenVideoRef = useRef(null);

    const stopAllTracks = useCallback(() => {
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
    }, []);

    useEffect(() => {
        return () => stopAllTracks();
    }, [stopAllTracks]);

    const getConstraints = () => {
        const resMap = {
            '720p': { width: 1280, height: 720, bitrate: 2500000 },
            '1080p': { width: 1920, height: 1080, bitrate: 8000000 },
            '4k': { width: 3840, height: 2160, bitrate: 15000000 }
        };
        const selected = resMap[resolution] || resMap['1080p'];

        return {
            video: {
                width: { ideal: selected.width },
                height: { ideal: selected.height },
                frameRate: { ideal: frameRate }
            },
            bitrate: selected.bitrate
        };
    };

    const startRecording = async () => {
        setError('');
        setRecordedBlob(null);
        setIsPaused(false);
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
                selfBrowserSurface: 'include',
                systemAudio: 'include',
                surfaceSwitching: 'include',
                monitorTypeSurfaces: 'include'
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

            // Create hidden video and canvas for mixing/processing if needed
            // Currently using it to ensure consistent frame rate or processing
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
                selectedMime = mp4Types.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
                if (!mp4Types.some(type => MediaRecorder.isTypeSupported(type))) {
                    setError("MP4 format not supported. Using WebM.");
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
                setTime(0);
            };

            // Stop if user stops sharing from browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                if (mediaRecorder.state !== 'inactive') {
                    mediaRecorder.stop();
                }
            };

            mediaRecorder.start();
            setStatus('recording');
            setTime(0);
            timerIntervalRef.current = setInterval(() => setTime(prev => prev + 1), 1000);

        } catch (err) {
            console.error(err);
            setError("Failed to start recording.");
            setStatus('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            clearInterval(timerIntervalRef.current);
            setIsPaused(false);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            clearInterval(timerIntervalRef.current);
            setIsPaused(true);
            setStatus('paused');
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            timerIntervalRef.current = setInterval(() => setTime(prev => prev + 1), 1000);
            setIsPaused(false);
            setStatus('recording');
        }
    };

    const reset = () => {
        setRecordedBlob(null);
        setStatus('idle');
        setTime(0);
        setError('');
    };

    return {
        status,
        setStatus,
        time,
        error,
        recordedBlob,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        isPaused,
        reset,
        settings: {
            audioEnabled, setAudioEnabled,
            resolution, setResolution,
            frameRate, setFrameRate,
            outputFormat, setOutputFormat,
        }
    };
};
