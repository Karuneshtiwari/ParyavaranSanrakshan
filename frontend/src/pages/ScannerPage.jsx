import React, { useState, useRef, useEffect } from 'react';
import { wasteAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  SwitchCamera, 
  X,
  FileImage,
  Layers,
  Info,
  Recycle
} from 'lucide-react';

export const ScannerPage = ({ isEmbedded = false }) => {
  const { lang, t } = useLanguage();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Live Camera Stream State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(true);

  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Error stopping tracks:", e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  // Check available camera devices
  const checkCameraDevices = async () => {
    if (navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (e) {
        // Ignore enumeration errors
      }
    }
  };

  // Start live webcam / phone camera stream
  const startCameraStream = async (targetFacing = facingMode) => {
    setCameraError(null);
    setError(null);
    setCameraLoading(true);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Direct camera stream is not supported in this browser environment or requires HTTPS/localhost. You can use 'Take Photo' or 'Upload Image'."
      );
      setCameraLoading(false);
      return;
    }

    try {
      let stream = null;

      // 1. Try with preferred facingMode and ideal resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (prefErr) {
        console.warn("Ideal facing mode failed, falling back to basic video constraint:", prefErr);
        // 2. Robust fallback for PC webcams without environment facing mode
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      checkCameraDevices();
    } catch (err) {
      console.warn("Camera access error:", err);
      let msg = "Camera unavailable or permission denied. Please ensure your browser permits camera access or choose 'Take Photo' / 'Upload Image'.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Camera permission was denied. Please allow camera permissions in your browser URL bar.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No camera hardware detected on this device. Please upload an image file instead.";
      }
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Ensure video stream connects to the video element whenever isCameraActive or stream updates
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video play error in effect:", err);
        });
      }
    }
  }, [isCameraActive]);

  // Switch facing mode (Front / Back camera)
  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  // Cleanup camera on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  // Handle Capture snapshot from video stream
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Could not capture photo from stream. Please try again.");
        return;
      }
      const file = new File([blob], `scan_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(url);
      stopCameraStream();
      // Auto analyze immediately
      runClassification(file);
    }, 'image/jpeg', 0.95);
  };

  // Handle standard File Upload from Disk or Native Phone Camera
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB. Please choose an image up to 5MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    stopCameraStream();
    runClassification(file);
  };

  // Run AI inference via backend
  const runClassification = async (fileToAnalyze) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', fileToAnalyze);

    try {
      const response = await wasteAPI.predict(formData);
      setResult(response.data);
    } catch (err) {
      console.error("Waste classification failed:", err);
      setError(
        err.response?.data?.detail || 
        "Waste classification model is warming up or inference failed. Please try another image."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Reset to scan another image
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    stopCameraStream();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* ─── PAGE HEADER (EXACT MOCKUP SCREEN 4) ─── */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#12372A]">
          {lang === 'hi' ? 'एआई कचरा स्कैनर' : 'AI Waste Scanner'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {lang === 'hi'
            ? "कचरे के प्रकार की पहचान करने और उचित निपटान मार्गदर्शन प्राप्त करने के लिए एक छवि अपलोड करें या एक तस्वीर खींचें।"
            : "Upload an image or capture a photo to identify the waste type and get disposal recommendations."}
        </p>
      </div>

      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Error alert banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── MAIN SCANNER WORKFLOW VIEW ─── */}
      {!result ? (
        /* SCREEN 4: BEFORE UPLOAD / CAMERA VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: 3 Steps Pills (Exact Mockup Screen 4) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4 h-full">
            
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Upload className="w-6 h-6 text-[#1b4332]" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-[#12372A]">
                  1. Upload Image
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Choose a clear image of the waste item from your device or use the live camera.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-[#1b4332]" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-[#12372A]">
                  2. AI Analysis
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Our computer vision system identifies the waste material and determines appropriate municipal segregation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#1b4332]" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-[#12372A]">
                  3. Get Recommendation
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Receive proper municipal disposal guidance and recyclable segregation instructions.
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Upload Box or Live Camera Viewfinder */}
          <div className="lg:col-span-8 flex flex-col h-full">
            
            {/* LIVE CAMERA STREAM VIEW */}
            {isCameraActive ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Live Camera ({facingMode === 'environment' ? 'Back' : 'Front'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Flip Camera"
                    >
                      <SwitchCamera className="w-4 h-4 text-emerald-700" />
                      <span>Flip Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-600 transition-colors"
                      title="Close Camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Video Container with targeting reticle */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center">
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    webkit-playsinline="true"
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Reticle */}
                  <div className="absolute inset-4 sm:inset-10 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-xs font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                      Align waste item inside frame
                    </span>
                  </div>
                </div>

                {/* Shutter Button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2.5 active:scale-95"
                  >
                    <Camera className="w-5 h-5 text-emerald-300" />
                    <span>Capture & Identify Waste</span>
                  </button>

                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="w-full sm:w-auto px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD DRAG & DROP BOX (EXACT MOCKUP SCREEN 4) */
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Hidden native inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={mobileCameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Drag & drop dashed zone with cloud icon */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/30 group flex-1 flex flex-col items-center justify-center min-h-[220px]"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-[#1b4332]" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    Drag & drop an image here
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    or click to browse from gallery
                  </p>

                  <div className="mt-4 inline-block px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-400">
                    Supports: JPG, JPEG, PNG (Max 5MB)
                  </div>
                </div>

                {/* Camera error if any */}
                {cameraError && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>{cameraError}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons Below Dropzone: Upload Image & Live Camera */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#1b4332] hover:bg-[#143527] text-white font-semibold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-emerald-300" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCameraStream('environment')}
                    disabled={cameraLoading}
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#1b4332]" />
                    <span>{cameraLoading ? "Starting Camera..." : "Live Camera"}</span>
                  </button>
                </div>

              </div>
            )}

            {/* Loading Analysis state with red dashed viewfinder */}
            {analyzing && (
              <div className="mt-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
                <div className="relative mx-auto w-48 h-48 border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center overflow-hidden bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  {/* Animated red laser scan line */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-bounce w-full"></div>
                  
                  {/* Red target reticle brackets */}
                  <div className="absolute top-2 left-2 text-red-500 font-mono text-xs font-black">┌────</div>
                  <div className="absolute top-2 right-2 text-red-500 font-mono text-xs font-black">────┐</div>
                  <div className="absolute bottom-2 left-2 text-red-500 font-mono text-xs font-black">└────</div>
                  <div className="absolute bottom-2 right-2 text-red-500 font-mono text-xs font-black">────┘</div>

                  <span className="text-red-600 font-mono text-[10px] tracking-widest uppercase block animate-pulse">
                    [ -------- SCANNING -------- ]
                  </span>
                  <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto mt-2"></div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-base text-slate-800">Processing the waste by ParyavaranSanrakshan Mitra</h4>
                  <p className="text-xs text-slate-500">Detecting material composition & eco-friendly segregation instructions...</p>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* ─── SCREEN 5: AFTER PREDICTION RESULT VIEW (EXACT MOCKUP SCREEN 5) ─── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image Preview + Try Another Image Button */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-square flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Scanned item preview"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-sm shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-[#1b4332]" />
              <span>Try Another Image</span>
            </button>
          </div>

          {/* Right Column: Prediction Result Details (Exact Mockup Screen 5) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Green Pill: Prediction Result */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Prediction Result</span>
              </div>

              {/* Big Class Title */}
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#12372A] capitalize">
                {result.predicted_class}
              </h2>

              {/* Confidence Label & Progress Bar */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-600">Model Confidence</span>
                  <span className={`${result.confidence < 0.60 ? 'text-amber-700' : 'text-emerald-800'} font-mono font-bold`}>
                    {(result.confidence * 100).toFixed(1)}% Confidence ({result.confidence_level || (result.confidence >= 0.8 ? 'HIGH' : result.confidence >= 0.6 ? 'MEDIUM' : 'LOW')})
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`${result.confidence < 0.60 ? 'bg-amber-500' : 'bg-[#10b981]'} h-3 rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, result.confidence * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Warning Notice if Low / Medium Confidence */}
              {result.warning && (
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">{result.warning}</span>
                </div>
              )}
            </div>

            {/* Waste Category Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0">
                <Recycle className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Waste Category
                </span>
                <span className="text-base font-bold text-emerald-950">
                  {result.category}
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Designated Bin Color: <strong className="text-emerald-800">{result.bin_color}</strong>
                </p>
              </div>
            </div>

            {/* Disposal Recommendation Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Disposal Recommendation
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5 leading-relaxed">
                  {result.recommendation}
                </p>
              </div>
            </div>

            {/* Great Choice Tip Box (Exact Mockup Screen 5) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-start gap-3">
              <span className="text-2xl shrink-0" role="img" aria-label="leaf">🍃</span>
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Great Choice!</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                  Segregating waste helps in recycling and keeps our communities cleaner. Thank you for contributing to SDG 11!
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
