'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Bold, Italic, Underline as UnderlineIcon, Link2, List, ListOrdered, Undo, Redo, Image as ImageIcon, Building2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveError, type ErrorProp } from '@/lib/utils/resolve-error'

interface RichTextEditorProps {
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  companyLogoUrl?: string | null
  onImageUpload?: (file: File) => Promise<string>
  error?: ErrorProp
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}

function ToolbarButton({ onClick, active, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
        active && 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-slate-100',
        !active && 'text-slate-600 dark:text-slate-400',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Scrivi qui...',
  className,
  minHeight = '120px',
  companyLogoUrl,
  onImageUpload,
  error,
}: RichTextEditorProps) {
  const errorMsg = resolveError(error);
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          style: 'max-width: 200px; height: auto;',
        },
      }),
    ],
    content: value ?? '',
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'text-sm text-slate-900 dark:text-slate-100 focus:outline-none px-3 py-2',
          '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
          '[&_a]:text-blue-600 [&_a]:underline',
          '[&_strong]:font-semibold [&_em]:italic',
          '[&_img]:max-w-[200px] [&_img]:h-auto',
        ),
      },
    },
  })

  // Sync external value changes (e.g. when editing an existing record)
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value ?? '')
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
    <div
      className={cn(
        'border rounded-md overflow-hidden',
        errorMsg ? 'border-destructive' : 'border-input dark:border-slate-700',
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Grassetto"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Corsivo"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive('underline')}
          title="Sottolineato"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Elenco puntato"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Elenco numerato"
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL link:')
            if (url) {
              editor?.chain().focus().setLink({ href: url }).run()
            }
          }}
          active={editor?.isActive('link')}
          title="Link"
        >
          <Link2 size={14} />
        </ToolbarButton>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('URL immagine:')
            if (url) {
              editor?.chain().focus().setImage({ src: url }).run()
            }
          }}
          title="Inserisci immagine da URL"
        >
          <ImageIcon size={14} />
        </ToolbarButton>
        {onImageUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setIsUploading(true)
                try {
                  const url = await onImageUpload(file)
                  editor?.chain().focus().setImage({ src: url }).run()
                } catch {
                  // silenzioso — la funzione chiamante gestisce l'errore
                } finally {
                  setIsUploading(false)
                  e.target.value = ''
                }
              }}
            />
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title="Carica immagine"
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="size-[14px] border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload size={14} />
              )}
            </ToolbarButton>
          </>
        )}
        {companyLogoUrl && (
          <ToolbarButton
            onClick={() => {
              editor?.chain().focus().setImage({
                src: companyLogoUrl,
                alt: 'Logo aziendale',
              }).run()
            }}
            title="Inserisci logo aziendale"
          >
            <Building2 size={14} />
          </ToolbarButton>
        )}
        <div className="ml-auto flex gap-0.5">
          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            title="Annulla"
          >
            <Undo size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            title="Ripeti"
          >
            <Redo size={14} />
          </ToolbarButton>
        </div>
      </div>
      {/* Editor area */}
      <div
        className="bg-white dark:bg-slate-900"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
    {errorMsg && (
      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
    )}
    </>
  )
}
