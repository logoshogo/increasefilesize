'use client';

import { useCallback, useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface Props {
  value: string;
  onChange: (html: string) => void;
  onRequestMedia: () => void;
  /** Set by the parent when an image is chosen in the media modal. */
  imageToInsert?: { url: string; alt?: string | null } | null;
  onImageInserted?: () => void;
}

export function TiptapEditor({
  value,
  onChange,
  onRequestMedia,
  imageToInsert,
  onImageInserted,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'code-block' } },
      }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener' } }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    editorProps: {
      attributes: { 'data-placeholder': 'Write the article…' },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });

  // Keep the editor in sync when content is loaded asynchronously.
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value && editor.isEmpty) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  // Insert an image chosen in the media library modal.
  useEffect(() => {
    if (!editor || !imageToInsert) return;
    editor
      .chain()
      .focus()
      .setImage({ src: imageToInsert.url, alt: imageToInsert.alt ?? undefined })
      .run();
    onImageInserted?.();
  }, [editor, imageToInsert, onImageInserted]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="h-[480px] animate-pulse rounded-xl border border-slate-200 bg-white" />;
  }

  return (
    <div className="tiptap-editor overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="B" title="Bold" bold />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="I" title="Italic" italic />
        <Divider />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="H2" title="Heading 2" />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="H3" title="Heading 3" />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} label="P" title="Paragraph" />
        <Divider />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="• List" title="Bullet list" />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="1. List" title="Numbered list" />
        <Divider />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="❝" title="Blockquote" />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} label="{ }" title="Code block" />
        <ToolbarButton editor={editor} action={() => editor.chain().focus().setHorizontalRule().run()} active={false} label="—" title="Divider" />
        <Divider />
        <ToolbarButton editor={editor} action={setLink} active={editor.isActive('link')} label="Link" title="Insert link" />
        <ToolbarButton editor={editor} action={onRequestMedia} active={false} label="Image" title="Insert image from the media library" />
        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton editor={editor} action={() => editor.chain().focus().undo().run()} active={false} label="↶" title="Undo" />
          <ToolbarButton editor={editor} action={() => editor.chain().focus().redo().run()} active={false} label="↷" title="Redo" />
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />;
}

function ToolbarButton({
  action,
  active,
  label,
  title,
  bold,
  italic,
}: {
  editor: Editor;
  action: () => void;
  active: boolean;
  label: string;
  title: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={action}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1.5 text-sm transition ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
      } ${bold ? 'font-bold' : ''} ${italic ? 'italic' : ''}`}
    >
      {label}
    </button>
  );
}
