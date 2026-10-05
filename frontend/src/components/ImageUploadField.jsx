import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Check, Loader2, Sparkles } from 'lucide-react';
import { uploadAPI } from '../services/api';

export const ImageUploadField = ({ 
  value, 
  onChange, 
  label = "Cover Image (Events / Article)", 
  required = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const res = await uploadAPI.uploadFile(file);
      if (res.data?.url) {
        onChange(res.data.url);
      }
    } catch (err) {
      console.error("Cover image upload error:", err);
      // Fallback: create base64 preview or local path
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
        <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Remove Image</span>
          </button>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Upload Button Box */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>Uploading to Cloud...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-emerald-700" />
              <span>Upload Cover Image</span>
            </>
          )}
        </button>

        {/* Direct Image URL input */}
        <div className="flex-1 w-full">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste direct image URL (https://images.unsplash.com/...)"
            className="w-full px-3.5 py-2.5 bg-[#fbfdfb] border border-emerald-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose-600 font-medium">{error}</p>
      )}

      {/* Preview Card */}
      {value && (
        <div className="relative mt-2 rounded-2xl overflow-hidden border border-emerald-100 bg-slate-900/5 aspect-video sm:h-36 w-full max-w-sm shadow-2xs group">
          <img 
            src={value} 
            alt="Cover preview" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
            <span className="text-[11px] text-white font-medium">Cover Preview</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;
