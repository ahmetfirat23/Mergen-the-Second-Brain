"use client";

import { api } from "../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { Brain, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCapture({ open, onClose }: QuickCaptureProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const save = useMutation(api.brainDumps.save);

  useEffect(() => {
    if (open) {
      setContent("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await save({ content: trimmed });
      toast.success("Brain dump captured");
      onClose();
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-xl border border-[hsl(0_0%_28%)] bg-[hsl(0_0%_10%)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(0_0%_22%)]">
          <Brain className="w-4 h-4 text-[hsl(0_0%_68%)] shrink-0" />
          <span className="text-sm text-[hsl(0_0%_68%)]">Quick capture</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="text-[10px] bg-[hsl(0_0%_12%)] border border-[hsl(0_0%_28%)] rounded px-1.5 py-0.5 text-[hsl(0_0%_68%)]">⌘↵</kbd>
            <span className="text-[10px] text-[hsl(0_0%_50%)]">save</span>
          </div>
        </div>
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought…"
            rows={5}
            className="w-full bg-transparent text-sm text-white placeholder:text-[hsl(0_0%_40%)] outline-none resize-none leading-relaxed"
          />
        </div>
        <div className="flex items-center justify-between px-3 pb-3 pt-0">
          <span className="text-[11px] text-[hsl(0_0%_40%)]">Goes to Brain Dump for later AI processing</span>
          <button
            onClick={handleSave}
            disabled={!content.trim() || isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[hsl(263_90%_65%)] hover:bg-[hsl(263_90%_58%)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
