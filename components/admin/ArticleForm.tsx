"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { SECTIONS_DATA } from "@/lib/sections";
import { slugify, calcReadingTime } from "@/lib/utils";
import type { Article } from "@/types";

interface Props {
  initial?: Partial<Article>;
  onSave: (data: Omit<Article, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  saving?: boolean;
}

const inputCls = "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 placeholder-gray-400";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border p-5 space-y-4" style={{ borderColor: "#f0ece8" }}>
      <h2 className="text-sm font-semibold text-gray-900 pb-3" style={{ borderBottom: "1px solid #f5f3f0" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function ImageUploadField({
  label, value, onChange, uploading, onUpload, shape = "rect",
}: {
  label: string; value: string; onChange: (v: string) => void;
  uploading: boolean; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  shape?: "rect" | "circle";
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className={inputCls} style={{ borderColor: "#e5e7eb" }}
        placeholder="Paste URL or upload below"
      />
      <div className="flex items-center gap-3">
        <button
          type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
          style={{ borderColor: "#e8521d", color: "#e8521d", background: "#fef3f0" }}
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        {value && (
          <a href={value} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-600">
            Preview ↗
          </a>
        )}
      </div>
      {value && (
        <img
          src={value} alt={label} className="object-cover"
          style={{
            height: shape === "circle" ? 64 : 80,
            width: shape === "circle" ? 64 : 128,
            borderRadius: shape === "circle" ? "50%" : 8,
            border: "1.5px solid #f0ece8",
          }}
        />
      )}
    </div>
  );
}

export function ArticleForm({ initial, onSave, saving }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(!!initial?.slug);
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [sectionNumber, setSectionNumber] = useState(initial?.sectionNumber ?? 1);
  const [articleNumber, setArticleNumber] = useState(initial?.articleNumber ?? 1);
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "");
  const [authorBio, setAuthorBio] = useState(initial?.authorBio ?? "");
  const [authorLinkedIn, setAuthorLinkedIn] = useState(initial?.authorLinkedIn ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [authorImage, setAuthorImage] = useState(initial?.authorImage ?? "");
  const [edition, setEdition] = useState<1 | 2>(initial?.edition ?? 2);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [isEditorsPick, setIsEditorsPick] = useState(initial?.isEditorsPick ?? false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingAuthor, setUploadingAuthor] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate slug from title unless user has manually edited it
  useEffect(() => {
    if (!slugLocked && title) {
      setSlug(slugify(title));
    }
  }, [title, slugLocked]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: initial?.content ?? "<p>Start writing…</p>",
  });

  async function uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function handleFeaturedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFeatured(true);
    try {
      const url = await uploadImage(file, `articles/uploads/featured-${Date.now()}-${file.name}`);
      setFeaturedImage(url);
    } catch { setError("Failed to upload featured image."); }
    setUploadingFeatured(false);
  }

  async function handleAuthorUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAuthor(true);
    try {
      const url = await uploadImage(file, `articles/uploads/author-${Date.now()}-${file.name}`);
      setAuthorImage(url);
    } catch { setError("Failed to upload author photo."); }
    setUploadingAuthor(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    if (!slug.trim()) { setError("Slug is required."); return; }

    const displayId = `${sectionNumber}.${articleNumber}`;
    const section = SECTIONS_DATA.find((s) => s.number === sectionNumber)!;
    const content = editor?.getHTML() ?? "";
    const rawText = editor?.getText() ?? "";
    const excerpt = rawText.length > 200 ? rawText.slice(0, 200) + "…" : rawText;
    const readingTime = calcReadingTime(content);

    await onSave({
      sectionId: section.id,
      sectionNumber,
      articleNumber,
      displayId,
      slug,
      title,
      subtitle,
      excerpt,
      content,
      readingTime,
      featuredImage,
      authorName,
      authorImage,
      authorLinkedIn,
      authorBio,
      tags: [],
      edition,
      isEditorsPick,
      publishedAt: isPublished ? (initial?.publishedAt ?? null) : null,
      isPublished,
    });
  }

  const toolbarBtns = [
    { label: "B", title: "Bold", cmd: () => editor?.chain().focus().toggleBold().run(), active: () => editor?.isActive("bold") },
    { label: "I", title: "Italic", cmd: () => editor?.chain().focus().toggleItalic().run(), active: () => editor?.isActive("italic") },
    { label: "H2", title: "Heading 2", cmd: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor?.isActive("heading", { level: 2 }) },
    { label: "H3", title: "Heading 3", cmd: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor?.isActive("heading", { level: 3 }) },
    { label: "¶", title: "Paragraph", cmd: () => editor?.chain().focus().setParagraph().run(), active: () => editor?.isActive("paragraph") },
    { label: "• List", title: "Bullet list", cmd: () => editor?.chain().focus().toggleBulletList().run(), active: () => editor?.isActive("bulletList") },
    { label: "1. List", title: "Ordered list", cmd: () => editor?.chain().focus().toggleOrderedList().run(), active: () => editor?.isActive("orderedList") },
    { label: "——", title: "Horizontal rule", cmd: () => editor?.chain().focus().setHorizontalRule().run(), active: () => false },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">

      {/* Article metadata */}
      <FormSection title="Article details">
        <div>
          <label className={labelCls}>Title <span style={{ color: "#e8521d" }}>*</span></label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls} style={{ borderColor: "#e5e7eb", fontSize: "1rem", fontWeight: 500 }}
            placeholder="Article title" required
          />
        </div>

        {/* Slug */}
        <div>
          <label className={labelCls}>URL slug <span style={{ color: "#e8521d" }}>*</span></label>
          <div className="flex gap-2">
            <input
              type="text" value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugLocked(true); }}
              className={inputCls} style={{ borderColor: "#e5e7eb", fontFamily: "monospace" }}
              placeholder="auto-generated-from-title"
            />
            <button
              type="button"
              onClick={() => { setSlugLocked(false); setSlug(slugify(title)); }}
              className="text-xs px-3 py-2 rounded-lg border flex-shrink-0 transition-colors"
              style={{ borderColor: "#e5e7eb", color: "#6b7280", background: "white" }}
              title="Re-generate slug from title"
            >
              ↺ Reset
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Public URL: <span className="font-mono text-gray-600">/article/{slug || "…"}</span>
          </p>
        </div>

        {/* Subtitle */}
        <div>
          <label className={labelCls}>Subtitle <span className="text-gray-300 font-normal">(optional)</span></label>
          <input
            type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
            className={inputCls} style={{ borderColor: "#e5e7eb" }}
            placeholder="A short supporting sentence shown below the title"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Section</label>
            <select
              value={sectionNumber} onChange={(e) => setSectionNumber(parseInt(e.target.value))}
              className={inputCls} style={{ borderColor: "#e5e7eb" }}
            >
              {SECTIONS_DATA.map((s) => (
                <option key={s.id} value={s.number}>{s.number}. {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Article number</label>
            <input
              type="number" value={articleNumber}
              onChange={(e) => setArticleNumber(parseInt(e.target.value))}
              min={1} className={inputCls} style={{ borderColor: "#e5e7eb" }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Article ID: <span className="font-mono font-semibold text-gray-600">{sectionNumber}.{articleNumber}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className={labelCls}>Edition</label>
            <select
              value={edition} onChange={(e) => setEdition(parseInt(e.target.value) as 1 | 2)}
              className={inputCls} style={{ borderColor: "#e5e7eb" }}
            >
              <option value={1}>Edition 1</option>
              <option value={2}>Edition 2</option>
            </select>
          </div>
          {/* Published toggle */}
          <div className="flex items-center gap-3 pb-2.5">
            <div className="relative inline-flex items-center cursor-pointer" onClick={() => setIsPublished(!isPublished)}>
              <input type="checkbox" id="published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="sr-only" />
              <div className="w-10 h-5 rounded-full transition-colors" style={{ background: isPublished ? "#e8521d" : "#e5e7eb" }} />
              <div className="absolute w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: isPublished ? "translateX(1.25rem)" : "translateX(0.125rem)", top: "2px", left: 0 }} />
            </div>
            <label htmlFor="published" className="text-sm text-gray-700 cursor-pointer select-none">
              {isPublished ? "Published" : "Draft"}
            </label>
          </div>
          {/* Editor's pick toggle */}
          <div className="flex items-center gap-3 pb-2.5">
            <div className="relative inline-flex items-center cursor-pointer" onClick={() => setIsEditorsPick(!isEditorsPick)}>
              <input type="checkbox" id="editorsPick" checked={isEditorsPick} onChange={(e) => setIsEditorsPick(e.target.checked)} className="sr-only" />
              <div className="w-10 h-5 rounded-full transition-colors" style={{ background: isEditorsPick ? "#f59e0b" : "#e5e7eb" }} />
              <div className="absolute w-4 h-4 bg-white rounded-full shadow transition-transform"
                style={{ transform: isEditorsPick ? "translateX(1.25rem)" : "translateX(0.125rem)", top: "2px", left: 0 }} />
            </div>
            <label htmlFor="editorsPick" className="text-sm text-gray-700 cursor-pointer select-none">
              {isEditorsPick ? "★ Editor's pick" : "Editor's pick"}
            </label>
          </div>
        </div>
      </FormSection>

      {/* Cover image */}
      <FormSection title="Cover image">
        <ImageUploadField
          label="Featured / cover image" value={featuredImage} onChange={setFeaturedImage}
          uploading={uploadingFeatured} onUpload={handleFeaturedUpload} shape="rect"
        />
      </FormSection>

      {/* Author */}
      <FormSection title="Author">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Author name</label>
            <input
              type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)}
              className={inputCls} style={{ borderColor: "#e5e7eb" }} placeholder="Full name"
            />
          </div>
          <div>
            <label className={labelCls}>LinkedIn URL</label>
            <input
              type="url" value={authorLinkedIn} onChange={(e) => setAuthorLinkedIn(e.target.value)}
              className={inputCls} style={{ borderColor: "#e5e7eb" }} placeholder="https://linkedin.com/in/…"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Bio / designation</label>
          <input
            type="text" value={authorBio} onChange={(e) => setAuthorBio(e.target.value)}
            className={inputCls} style={{ borderColor: "#e5e7eb" }}
            placeholder="MBA Business Analytics '25, DSE"
          />
        </div>
        <ImageUploadField
          label="Author photo" value={authorImage} onChange={setAuthorImage}
          uploading={uploadingAuthor} onUpload={handleAuthorUpload} shape="circle"
        />
      </FormSection>

      {/* Rich text editor */}
      <FormSection title="Article content">
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
          <div className="flex flex-wrap gap-1 p-2.5 border-b" style={{ borderColor: "#f0ece8", background: "#faf9f6" }}>
            {toolbarBtns.map((btn) => (
              <button
                key={btn.label} type="button" onClick={btn.cmd} title={btn.title}
                className="px-2.5 py-1 text-xs rounded font-medium transition-colors"
                style={
                  btn.active?.()
                    ? { background: "#e8521d", color: "white", border: "1px solid #e8521d" }
                    : { border: "1px solid #e5e7eb", color: "#4b5563", background: "white" }
                }
              >
                {btn.label}
              </button>
            ))}
          </div>
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus:outline-none p-4"
            style={{ minHeight: 280, color: "#111827" }}
          />
        </div>
        <p className="text-xs text-gray-400">Reading time is calculated automatically from word count.</p>
      </FormSection>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          <span>⚠</span> {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={saving}
          className="text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-opacity disabled:opacity-50"
          style={{ background: "#e8521d" }}
        >
          {saving ? "Saving…" : "Save article"}
        </button>
        <a
          href="/admin/articles"
          className="px-6 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#e5e7eb" }}
        >
          Cancel
        </a>
        <span className="ml-auto text-xs text-gray-400">
          {isPublished ? "Will be live after saving" : "Saving as draft"}
          {isEditorsPick ? " · ★ Editor's pick" : ""}
        </span>
      </div>

    </form>
  );
}
