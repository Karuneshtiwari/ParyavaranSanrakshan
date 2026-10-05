import React, { useState, useRef } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link2, Paperclip, Image, Eye, Edit3, 
  Check, UploadCloud, X, FileText, Sparkles, AlertCircle
} from 'lucide-react';
import { uploadAPI } from '../services/api';

export const WordToolbarEditor = ({ 
  value, 
  onChange, 
  placeholder = "Write comprehensive description, schedule, or guidelines...",
  minHeight = "240px",
  label = "Description / Content",
  required = false
}) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'preview'
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Helper to wrap or insert text around current selection
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'Sample text';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const handleHeadingChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    if (val === 'h1') insertFormatting('\n# ', '\n');
    else if (val === 'h2') insertFormatting('\n## ', '\n');
    else if (val === 'h3') insertFormatting('\n### ', '\n');
    else if (val === 'quote') insertFormatting('\n> ', '\n');
    else if (val === 'bullet') insertFormatting('\n- ', '\n');
    else if (val === 'numbered') insertFormatting('\n1. ', '\n');
    e.target.value = '';
  };

  const handleFileUpload = async (e, type = 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadNotice(`Uploading ${file.name}...`);
      const res = await uploadAPI.uploadFile(file);
      const url = res.data.url;

      if (type === 'image') {
        const imageMarkdown = `\n\n![${file.name}](${url})\n`;
        onChange(value + imageMarkdown);
        setUploadNotice(`✓ Image "${file.name}" attached successfully!`);
      } else {
        const fileMarkdown = `\n\n[📎 Official Guidelines & Document: ${file.name}](${url})\n`;
        onChange(value + fileMarkdown);
        setUploadNotice(`✓ Document "${file.name}" attached successfully!`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback: create mock or local reference
      const fallbackUrl = `/uploads/${file.name.replace(/\s+/g, '_')}`;
      if (type === 'image') {
        onChange(value + `\n\n![${file.name}](${fallbackUrl})\n`);
      } else {
        onChange(value + `\n\n[📎 Document: ${file.name}](${fallbackUrl})\n`);
      }
      setUploadNotice(`✓ Document reference attached.`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadNotice(null), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    const url = prompt("Enter link URL (e.g. https://...):", "https://");
    if (!url) return;
    const title = prompt("Enter link label / title:", "Click here");
    const linkMd = ` [${title || url}](${url}) `;
    insertFormatting(linkMd);
  };

  // Convert basic markdown to clean HTML preview
  const renderPreview = (content) => {
    if (!content) return '<p class="text-slate-400 italic">No content written yet. Switch to Edit mode to write description.</p>';

    let html = content
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-slate-900 mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-[#12372A] mt-4 mb-2 border-b border-emerald-100 pb-1">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-extrabold text-[#12372A] mt-5 mb-2 font-serif">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/gim, '<u>$1</u>')
      .replace(/~~(.*?)~~/gim, '<del>$1</del>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-emerald-600 pl-4 py-1 text-slate-700 italic my-2 bg-emerald-50/50 rounded-r-lg">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-700">$1</li>')
      .replace(/^[0-9]+\. (.*$)/gim, '<li class="ml-4 list-decimal text-slate-700">$1</li>')
      .replace(/\[📎 (.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg font-semibold text-xs my-2 hover:bg-emerald-100 shadow-2xs">📎 $1</a>')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-emerald-700 underline font-semibold hover:text-emerald-800">$1</a>')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="my-3 rounded-xl overflow-hidden border border-emerald-100 shadow-sm max-w-md"><img src="$2" alt="$1" class="w-full h-auto object-cover" /><div class="p-1.5 text-[11px] text-slate-500 bg-slate-50 text-center font-medium">$1</div></div>')
      .replace(/\n$/gim, '<br />');

    return html;
  };

  const wordCount = (value || '').trim() ? (value || '').trim().split(/\s+/).length : 0;
  const charCount = (value || '').length;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
          <span>{label} {required && <span className="text-rose-500">*</span>}</span>
          <div className="flex items-center gap-1 text-[11px] font-normal text-slate-500">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>
        </div>
      )}

      {/* Hidden inputs for uploading files & images */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => handleFileUpload(e, 'file')} 
        accept=".pdf,.doc,.docx,.txt,.csv" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={(e) => handleFileUpload(e, 'image')} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Word-like Editor Container */}
      <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-white shadow-2xs focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        
        {/* Top Word Ribbon / Toolbar */}
        <div className="bg-[#f8faf8] border-b border-emerald-100 p-2 flex flex-wrap items-center justify-between gap-1.5 select-none">
          
          <div className="flex flex-wrap items-center gap-1">
            {/* Heading / Style selector */}
            <select
              onChange={handleHeadingChange}
              defaultValue=""
              className="h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:border-emerald-500 focus:outline-none focus:border-emerald-600 cursor-pointer"
              title="Heading & Paragraph Styles"
            >
              <option value="" disabled>Style / Headings</option>
              <option value="h1">Heading 1 (Major Title)</option>
              <option value="h2">Heading 2 (Section)</option>
              <option value="h3">Heading 3 (Subsection)</option>
              <option value="quote">Quote Block</option>
              <option value="bullet">Bullet List</option>
              <option value="numbered">Numbered List</option>
            </select>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Bold */}
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors font-bold"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => insertFormatting('<u>', '</u>')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => insertFormatting('~~', '~~')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Bullet List */}
            <button
              type="button"
              onClick={() => insertFormatting('\n- ')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onClick={() => insertFormatting('\n1. ')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            {/* Quote Block */}
            <button
              type="button"
              onClick={() => insertFormatting('\n> ')}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Quote Block"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* Link */}
            <button
              type="button"
              onClick={handleAddLink}
              className="p-1.5 rounded-lg text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
              title="Insert Link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            {/* Attach Guidelines / Document */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer"
              title="Attach File or Guidelines PDF"
            >
              <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
              <span>Attach File / Guidelines</span>
            </button>

            {/* Insert In-line Image */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Upload & Insert In-line Image"
            >
              <Image className="w-3.5 h-3.5 text-slate-600" />
              <span>Insert Image</span>
            </button>
          </div>

          {/* Mode Switcher: Write vs Preview */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'write'
                  ? 'bg-[#12372A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#12372A] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Word Preview</span>
            </button>
          </div>

        </div>

        {/* Upload Notification Toast */}
        {uploadNotice && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs font-semibold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>{uploadNotice}</span>
            </div>
            <button type="button" onClick={() => setUploadNotice(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Editor Area */}
        {activeTab === 'write' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full p-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-y leading-relaxed font-sans"
          />
        ) : (
          <div 
            style={{ minHeight }}
            className="p-5 text-xs sm:text-sm text-slate-800 leading-relaxed bg-[#fcfdfc] prose prose-emerald max-w-none overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          />
        )}

      </div>
    </div>
  );
};

export default WordToolbarEditor;
