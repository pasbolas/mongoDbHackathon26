import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { 
  Video, 
  Film, 
  Upload, 
  Camera, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function VideoPerceptor({ onAction, onIdle, activeState }) {
  const [sourceType, setSourceType] = useState('youtube'); // 'youtube' | 'file' | 'webcam'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [model, setModel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [lastEmittedAction, setLastEmittedAction] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastDetectionTimeRef = useRef(Date.now());
  const processedObjectsRef = useRef(new Set());

  // Load COCO-SSD local vision model once on mount
  useEffect(() => {
    let isMounted = true;
    async function loadModel() {
      try {
        console.log('🤖 Initializing local TensorFlow vision model (COCO-SSD)...');
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'mobilenet_v2' });
        if (isMounted) {
          setModel(loadedModel);
          setModelLoading(false);
          console.log('✅ Local COCO-SSD vision model loaded!');
        }
      } catch (err) {
        console.error('Failed to load vision model:', err);
        if (isMounted) {
          setModelLoading(false);
          setErrorMessage('Could not load local vision model. You can still play video and trigger events.');
        }
      }
    }
    loadModel();

    return () => {
      isMounted = false;
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, []);

  // Frame detection loop running on playing video
  useEffect(() => {
    if (!model || !isPlaying || !videoRef.current) {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      return;
    }

    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
        try {
          const predictions = await model.detect(videoRef.current);
          setDetectedObjects(predictions);
          drawBoundingBoxes(predictions);
          mapPredictionsToAnchorEvents(predictions);
        } catch (e) {
          // Frame capture skip
        }
      }
    }, 600); // Process every 600ms (real-time edge vision)

    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [model, isPlaying]);

  // Draw real bounding boxes on overlay canvas
  const drawBoundingBoxes = (predictions) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const pred of predictions) {
      const [x, y, width, height] = pred.bbox;

      // Draw box
      ctx.strokeStyle = '#22c55e'; // clean emerald
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Label background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      const label = `${pred.class} (${Math.round(pred.score * 100)}%)`;
      ctx.font = '12px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y > 20 ? y - 20 : y, textWidth + 8, 20);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 4, y > 20 ? y - 6 : y + 14);
    }
  };

  // Map COCO-SSD recognized classes to Anchor semantic events
  const mapPredictionsToAnchorEvents = (predictions) => {
    const classes = predictions.map(p => p.class.toLowerCase());
    const now = Date.now();

    // Map:
    // backpack, handbag, suitcase -> bag_open
    // cell phone -> phone_added
    // book -> notebook_added
    // bottle, cup -> water_added
    let detectedAction = null;
    let detectedScore = 0.9;

    if ((classes.includes('backpack') || classes.includes('handbag') || classes.includes('suitcase')) && !processedObjectsRef.current.has('bag_open')) {
      detectedAction = 'bag_open';
    } else if (classes.includes('cell phone') && !processedObjectsRef.current.has('phone_added')) {
      detectedAction = 'phone_added';
    } else if (classes.includes('book') && !processedObjectsRef.current.has('notebook_added')) {
      detectedAction = 'notebook_added';
    } else if ((classes.includes('bottle') || classes.includes('cup')) && !processedObjectsRef.current.has('water_added')) {
      detectedAction = 'water_added';
    }

    if (detectedAction) {
      processedObjectsRef.current.add(detectedAction);
      setLastEmittedAction({ action: detectedAction, timestamp: new Date() });
      lastDetectionTimeRef.current = now;
      if (onAction) {
        onAction(detectedAction, { confidence: detectedScore, source: 'video_vision_ai' });
      }
    } else {
      // Check for inactivity (pause between items)
      const idleTime = Math.floor((now - lastDetectionTimeRef.current) / 1000);
      if (idleTime >= 15 && idleTime % 15 === 0) {
        if (onIdle) onIdle(15);
      }
    }
  };

  // Fetch YouTube video via backend yt-dlp
  const handleFetchYoutube = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) return;

    setLoadingVideo(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/video/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl })
      });
      const data = await res.json();
      if (data.success && data.videoUrl) {
        setVideoSrc(data.videoUrl);
        processedObjectsRef.current.clear();
      } else {
        setErrorMessage(data.error || 'Failed to download YouTube video.');
      }
    } catch (err) {
      setErrorMessage(`Error: ${err.message}`);
    } finally {
      setLoadingVideo(false);
    }
  };

  // Local file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      processedObjectsRef.current.clear();
      setErrorMessage(null);
    }
  };

  // Webcam stream toggle
  const handleToggleWebcam = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsPlaying(true);
        setVideoSrc('webcam_stream');
        processedObjectsRef.current.clear();
      }
    } catch (err) {
      setErrorMessage(`Webcam access denied: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl font-mono">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
          Real Input: Video Perception
        </h2>
        <p className="text-base text-[#6e6e73] mt-1.5 leading-relaxed">
          Input a YouTube video or file. A local vision model (COCO-SSD) inspects frames, identifies objects, and extracts semantic events for Anchor.
        </p>
      </div>

      {/* Input Source Selector Card */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-5 shadow-sm">
        
        {/* Source Pills */}
        <div className="flex flex-wrap gap-2 pb-3 border-b border-[#e5e5ea]">
          <button
            onClick={() => setSourceType('youtube')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              sourceType === 'youtube'
                ? 'bg-[#1d1d1f] text-white font-semibold'
                : 'bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-rose-500" />
            <span>YouTube Video URL</span>
          </button>

          <button
            onClick={() => setSourceType('file')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              sourceType === 'file'
                ? 'bg-[#1d1d1f] text-white font-semibold'
                : 'bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Local Video File</span>
          </button>

          <button
            onClick={() => setSourceType('webcam')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              sourceType === 'webcam'
                ? 'bg-[#1d1d1f] text-white font-semibold'
                : 'bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Feed</span>
          </button>
        </div>

        {/* Source Form 1: YouTube */}
        {sourceType === 'youtube' && (
          <form onSubmit={handleFetchYoutube} className="space-y-3">
            <div className="text-xs text-[#6e6e73]">
              Paste any YouTube video URL (e.g. someone packing a backpack, bag, or items):
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                className="flex-1 bg-[#fbfbfd] border border-[#d1d1d6] rounded-xl px-4 py-2.5 text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#1d1d1f]"
              />
              <button
                type="submit"
                disabled={loadingVideo || !youtubeUrl}
                className="px-5 py-2.5 rounded-xl bg-[#1d1d1f] text-white hover:bg-[#333336] text-xs font-semibold transition-all disabled:opacity-40 shadow-sm flex items-center justify-center gap-2"
              >
                {loadingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{loadingVideo ? 'Downloading Clip...' : 'Load YouTube Video'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Source Form 2: File Upload */}
        {sourceType === 'file' && (
          <div className="space-y-3">
            <div className="text-xs text-[#6e6e73]">
              Select any local MP4 or WebM video file from your computer:
            </div>
            <label className="block p-6 rounded-2xl border-2 border-dashed border-[#d1d1d6] hover:border-[#1d1d1f] bg-[#fbfbfd] text-center cursor-pointer transition-all">
              <Upload className="w-6 h-6 text-[#86868b] mx-auto mb-2" />
              <span className="text-xs font-medium text-[#1d1d1f] block">
                Click to browse video file (.mp4, .webm)
              </span>
              <span className="text-[11px] text-[#86868b] block mt-1">
                Processed locally in browser memory
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Source Form 3: Webcam */}
        {sourceType === 'webcam' && (
          <div className="space-y-3">
            <div className="text-xs text-[#6e6e73]">
              Connect directly to your computer's built-in webcam (/dev/video0):
            </div>
            <button
              onClick={handleToggleWebcam}
              className="py-3 px-5 rounded-xl bg-[#1d1d1f] text-white hover:bg-[#333336] text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Start Webcam Stream</span>
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="text-xs p-3 rounded-xl bg-[#fee2e2] text-[#991b1b] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Video & Vision AI Canvas Display Card */}
      {videoSrc && (
        <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-4 shadow-sm">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <h3 className="text-sm font-bold text-[#1d1d1f]">
                Local Edge Perception Active
              </h3>
            </div>
            <span className="text-[11px] text-[#6e6e73] font-mono">
              Model: COCO-SSD (MobileNet v2)
            </span>
          </div>

          {/* Video Container with Overlaid Detection Canvas */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            {sourceType === 'webcam' ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
            )}

            {/* Bounding box overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none w-full h-full"
            />
          </div>

          {/* Real-time Objects Detected Pill List */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#86868b]">Objects In Frame:</span>
            {detectedObjects.length === 0 ? (
              <span className="text-[#86868b] italic">Analyzing frame...</span>
            ) : (
              detectedObjects.map((obj, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-[#e5e5ea] text-[#1d1d1f] font-semibold flex items-center gap-1.5"
                >
                  <Eye className="w-3 h-3 text-emerald-600" />
                  <span>{obj.class}</span>
                  <span className="text-[#86868b] font-normal">{Math.round(obj.score * 100)}%</span>
                </span>
              ))
            )}
          </div>

          {/* Last Emitted Event Badge */}
          {lastEmittedAction && (
            <div className="p-3 rounded-xl bg-[#dcfce7] text-[#166534] text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Extracted Event: <strong className="font-mono">{lastEmittedAction.action}</strong></span>
              </span>
              <span className="text-[11px] text-[#166534]/80">
                {lastEmittedAction.timestamp.toLocaleTimeString()} → Transmitted to Atlas
              </span>
            </div>
          )}

        </div>
      )}

      {/* Privacy Architecture Notice */}
      <div className="rounded-2xl border border-[#e5e5ea] bg-[#fbfbfd] p-5 flex items-start gap-3 text-xs text-[#6e6e73]">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#1d1d1f]">Privacy Architecture in Action:</strong> The video frames are processed directly by the client-side TensorFlow vision model in memory and immediately discarded. No video recordings are ever sent to or stored in MongoDB Atlas. Only extracted semantic events reach the database.
        </p>
      </div>

    </div>
  );
}
