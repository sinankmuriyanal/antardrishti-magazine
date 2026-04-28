"use client";

import { useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { SECTIONS_DATA } from "@/lib/sections";
import type { Article } from "@/types";

interface Props {
  initial?: Partial<Article>;
  onSave: (data: Omit<Article, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  saving?: boolean;
}

export function ArticleForm({ initial, onSave, saving }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sectionNumber, setSectionNumber] = useState(initial?.sectionNumber ?? 1);
  const [articleNumber, setArticleNumber] = useState(initial?.articleNumber ?? 1);
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "");
  const [authorBio, setAuthorBio] = useState(initial?.authorBio ?? "");
  const [authorLinkedIn, setAuthorLinkedIn] = useState(initial?.authorLinkedIn ?? "");
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage ?? "");
  const [authorImage, setAuthorImage] = useState(initial?.authorImage ?? "");
  const [edition, setEdition] = useState<1 | 2>(initial?.edition ?? 2);
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingAuthor, setUploadingAuthor] = useState(false);
  const [error, setError] = useState("");

  const featuredInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);

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
    } catch { setError("Failed to upload author image."); }
    setUploadingAuthor(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }

    const displayId = `${sectionNumber}.${articleNumber}`;
    const section = SECTIONS_DATA.find((s) => s.number === sectionNumber)!;
    const content = editor?.getHTML() ?? "";
    const excerpt = editor?.getText().slice(0, 200) + "…";

    await onSave({
      sectionId: section.id,
      sectionNumber,
      articleNumber,
      displayId,
      title,
      excerpt,
      content,
      featuredImage,
      authorName,
      authorImage,
      authorLinkedIn,
      authorBio,
      tags: [],
      edition,
      publishedAt: null,
      isPublished,
    });
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Article details</h2>

        <div>
          <label className={labelCls}>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Article title" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Section</label>
            <select value={sectionNumber} onChange={(e) => setSectionNumber(parseInt(e.target.value))} className={inputCls}>
              {SECTIONS_DATA.map((s) => <option key={s.id} value={s.number}>{s.number}. {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Article number</label>
            <input type="number" value={articleNumber} onChange={(e) => setArticleNumber(parseInt(e.target.value))} min={1} className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Display ID: {sectionNumber}.{articleNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Edition</label>
            <select value={edition} onChange={(e) => setEdition(parseInt(e.target.value) as 1 | 2)} className={inputCls}>
              <option value={1}>Edition 1</option>
              <option value={2}>Edition 2</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input type="checkbox" id="published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 rounded" />
            <label htmlFor="published" className="text-sm text-gray-700">Published</label>
          </div>
        </div>
      </div>

      {/* Featured image */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Featured image</h2>
        <input type="text" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} className={inputCls} placeholder="Image URL or upload below" />
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => featuredInputRef.current?.click()} className="text-sm text-blue-600 hover:underline" disabled={uploadingFeatured}>
            {uploadingFeatured ? "Uploading…" : "Upload image"}
          </button>
          <input ref={featuredInputRef} type="file" accept="image/*" className="hidden" onChange={handleFeaturedUpload} />
        </div>
        {featuredImage && <img src={featuredImage} alt="Featured" className="h-32 rounded-lg object-cover" />}
      </div>

      {/* Author */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Author</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Author name</label>
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={inputCls} placeholder="Full name" />
          </div>
          <div>
            <label className={labelCls}>LinkedIn URL</label>
            <input type="url" value={authorLinkedIn} onChange={(e) => setAuthorLinkedIn(e.target.value)} className={inputCls} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
        <div>
          <label className={labelCls}>Author bio / designation</label>
          <input type="text" value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} className={inputCls} placeholder="MBA Business Analytics '25, DSE" />
        </div>
        <div>
          <label className={labelCls}>Author photo</label>
          <input type="text" value={authorImage} onChange={(e) => setAuthorImage(e.target.value)} className={inputCls} placeholder="Image URL or upload below" />
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={() => authorInputRef.current?.click()} className="text-sm text-blue-600 hover:underline" disabled={uploadingAuthor}>
              {uploadingAuthor ? "Uploading…" : "Upload photo"}
            </button>
            <input ref={authorInputRef} type="file" accept="image/*" className="hidden" onChange={handleAuthorUpload} />
          </div>
          {authorImage && <img src={authorImage} alt="Author" className="h-20 w-20 rounded-full object-cover mt-2" />}
        </div>
      </div>

      {/* Content editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Content</h2>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 mb-3 border-b border-gray-200 pb-3">
          {[
            { label: "B", cmd: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
            { label: "I", cmd: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
            { label: "H2", cmd: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
            { label: "H3", cmd: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive("heading", { level: 3 }) },
            { label: "¶", cmd: () => editor?.chain().focus().setParagraph().run(), active: editor?.isActive("paragraph") },
            { label: "• List", cmd: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive("bulletList") },
            { label: "1. List", cmd: () => editor?.chain().focus().toggleOrderedList().run(), active: editor?.isActive("orderedList") },
            { label: "— Line", cmd: () => editor?.chain().focus().setHorizontalRule().run(), active: false },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.cmd}
              className={`px-2 py-1 text-xs rounded border transition-colors ${btn.active ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none min-h-64 focus:outline-none border border-gray-200 rounded-lg p-3 text-gray-900"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save article"}
        </button>
        <a href="/admin/articles" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}
