"use client";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { ExternalLink, GripVertical, Pencil, Plus, Search, Trash2, X, Check, ClipboardList } from "lucide-react";
import { useState, useTransition } from "react";
import {
  DndContext, DragEndEvent, KeyboardSensor, PointerSensor, TouchSensor,
  closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const URGENCY_COLORS = ["", "bg-[hsl(0_0%_15%)] text-[hsl(0_0%_55%)]", "bg-[hsl(0_0%_15%)] text-[hsl(0_0%_60%)]", "bg-amber-900/40 text-amber-400", "bg-orange-900/40 text-orange-400", "bg-red-900/40 text-red-400"];

function UrgencyDot({ urgency }: { urgency: number }) {
  const colors = ["", "bg-zinc-600", "bg-zinc-500", "bg-amber-400", "bg-orange-400", "bg-red-400"];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`w-1.5 h-1.5 rounded-full ${n <= urgency ? colors[urgency] : "bg-[hsl(0_0%_18%)]"}`} />
      ))}
    </div>
  );
}

function parseTags(raw: string): string[] {
  return raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
}

type VaultItem = { _id: Id<"vault">; title: string; url: string; urgency: number; sortOrder?: number; tags?: string[] };

function SortableVaultRow({ item, onTagClick }: { item: VaultItem; onTagClick: (tag: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50 shadow-lg" : ""}>
      <VaultRow item={item} dragHandleProps={{ ...attributes, ...listeners }} onTagClick={onTagClick} />
    </div>
  );
}

function VaultRow({ item, dragHandleProps, onTagClick }: { item: VaultItem; dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>; onTagClick: (tag: string) => void }) {
  const updateItem = useMutation(api.vault.update);
  const removeItem = useMutation(api.vault.remove);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [url, setUrl] = useState(item.url);
  const [urgency, setUrgency] = useState(item.urgency);
  const [tagsRaw, setTagsRaw] = useState((item.tags ?? []).join(", "));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateItem({ id: item._id, title, url, urgency, tags: parseTags(tagsRaw) });
      setEditing(false);
    });
  }

  function handleCancel() {
    setTitle(item.title); setUrl(item.url); setUrgency(item.urgency);
    setTagsRaw((item.tags ?? []).join(", ")); setEditing(false);
  }

  const domain = (() => { try { return new URL(item.url).hostname; } catch { return item.url; } })();

  return (
    <div className="group relative bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_22%)] rounded-lg hover:border-[hsl(0_0%_28%)] transition-all select-none">
      {editing ? (
        <div className="p-4 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-1.5 text-sm text-white outline-none" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-1.5 text-sm text-white outline-none" />
          <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="Tags (comma-separated)" className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-[hsl(0_0%_45%)] outline-none" />
          <div className="flex items-center gap-3">
            <label className="text-xs text-[hsl(0_0%_75%)]">Urgency:</label>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setUrgency(n)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${n === urgency ? "bg-[hsl(263_90%_60%)] text-white" : "bg-[hsl(0_0%_12%)] text-[hsl(0_0%_72%)] hover:bg-[hsl(0_0%_20%)]"}`}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(263_90%_60%)] text-white text-xs font-medium"><Check className="w-3 h-3" /> Save</button>
            <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(0_0%_12%)] text-[hsl(0_0%_75%)] text-xs"><X className="w-3 h-3" /> Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 pr-4">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="shrink-0 cursor-grab active:cursor-grabbing text-[hsl(0_0%_35%)] hover:text-[hsl(0_0%_55%)] select-none"
              style={{ touchAction: "none" }}
              tabIndex={-1}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-white hover:text-[hsl(263_70%_75%)] transition-colors leading-snug truncate flex-1 min-w-0">
                {item.title}
              </a>
              <ExternalLink className="w-3.5 h-3.5 text-[hsl(0_0%_64%)] shrink-0" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-[hsl(0_0%_64%)] truncate">{domain}</p>
              <UrgencyDot urgency={item.urgency} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${URGENCY_COLORS[item.urgency]}`}>U{item.urgency}</span>
              {(item.tags ?? []).map((tag) => (
                <button key={tag} onClick={() => onTagClick(tag)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(263_90%_65%/0.12)] text-[hsl(263_70%_70%)] hover:bg-[hsl(263_90%_65%/0.22)] transition-colors leading-none">
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-md hover:bg-[hsl(0_0%_20%)] text-[hsl(0_0%_75%)] hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (confirm(`Delete "${item.title}"?`)) removeItem({ id: item._id }); }} className="p-1.5 rounded-md hover:bg-red-900/40 text-[hsl(0_0%_75%)] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VaultList() {
  const items = useQuery(api.vault.list) ?? [];
  const createItem = useMutation(api.vault.create);
  const bulkCreate = useMutation(api.vault.bulkCreate);
  const reorderItems = useMutation(api.vault.reorder);

  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newUrgency, setNewUrgency] = useState(3);
  const [newTagsRaw, setNewTagsRaw] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const allTags = Array.from(new Set(items.flatMap((i) => i.tags ?? []))).sort();

  const sq = search.trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (filterTag && !(i.tags ?? []).includes(filterTag)) return false;
    if (sq && !i.title.toLowerCase().includes(sq) && !i.url.toLowerCase().includes(sq)) return false;
    return true;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleAdd() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    startTransition(async () => {
      await createItem({ title: newTitle.trim(), url: newUrl.trim(), urgency: newUrgency, tags: parseTags(newTagsRaw) });
      setNewTitle(""); setNewUrl(""); setNewUrgency(3); setNewTagsRaw(""); setShowAdd(false);
    });
  }

  function handleBulkPaste() {
    const lines = bulkText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((line) => {
      const urlMatch = line.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return null;
      const url = urlMatch[0];
      const title = line.replace(url, "").trim() || url;
      return { title, url, urgency: 3 };
    }).filter(Boolean) as { title: string; url: string; urgency: number }[];
    if (parsed.length === 0) return;
    startTransition(async () => {
      await bulkCreate({ items: parsed });
      setBulkText(""); setShowBulk(false);
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i._id);
    const oldIdx = ids.indexOf(active.id as Id<"vault">);
    const newIdx = ids.indexOf(over.id as Id<"vault">);
    const reordered = arrayMove(items, oldIdx, newIdx);
    reorderItems({ orderedIds: reordered.map((i) => i._id) });
  }

  return (
    <div>
      {/* Controls bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(0_0%_50%)] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or URL…"
              className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_22%)] rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-[hsl(0_0%_45%)] outline-none focus:border-[hsl(0_0%_35%)] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(0_0%_50%)] hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_22%)] rounded-lg px-2 py-2 text-sm text-[hsl(0_0%_75%)] outline-none focus:border-[hsl(0_0%_35%)] transition-colors"
            >
              <option value="">All tags</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Active tag filter pill */}
      {filterTag && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs text-[hsl(0_0%_55%)]">Tag:</span>
          <button onClick={() => setFilterTag("")}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[hsl(263_90%_65%/0.15)] text-[hsl(263_70%_70%)] hover:bg-[hsl(263_90%_65%/0.25)] transition-colors">
            {filterTag} <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {!showAdd && !showBulk && (
          <>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-sm text-[hsl(0_0%_75%)] hover:text-white border border-dashed border-[hsl(0_0%_28%)] hover:border-[hsl(0_0%_30%)] rounded-lg px-4 py-3 flex-1 transition-all">
              <Plus className="w-4 h-4" /> Add Link
            </button>
            <button onClick={() => setShowBulk(true)}
              className="flex items-center gap-2 text-sm text-[hsl(0_0%_75%)] hover:text-white border border-dashed border-[hsl(0_0%_28%)] hover:border-[hsl(0_0%_30%)] rounded-lg px-4 py-3 flex-1 transition-all">
              <ClipboardList className="w-4 h-4" /> Bulk Paste
            </button>
          </>
        )}
      </div>

      {showAdd && (
        <div className="mb-4 bg-[hsl(0_0%_10%)] border border-[hsl(263_90%_60%/0.3)] rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-white">Add Link</h3>
          <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[hsl(0_0%_68%)] outline-none" />
          <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://…" className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[hsl(0_0%_68%)] outline-none" />
          <input value={newTagsRaw} onChange={(e) => setNewTagsRaw(e.target.value)} placeholder="Tags (comma-separated, optional)" className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[hsl(0_0%_45%)] outline-none" />
          <div className="flex items-center gap-3">
            <label className="text-xs text-[hsl(0_0%_75%)]">Urgency:</label>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setNewUrgency(n)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${n === newUrgency ? "bg-[hsl(263_90%_60%)] text-white" : "bg-[hsl(0_0%_12%)] text-[hsl(0_0%_72%)] hover:bg-[hsl(0_0%_20%)]"}`}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!newTitle.trim() || !newUrl.trim() || isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(263_90%_60%)] hover:bg-[hsl(263_90%_65%)] disabled:opacity-40 text-white text-sm font-medium"><Check className="w-3.5 h-3.5" /> Add</button>
            <button onClick={() => setShowAdd(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(0_0%_12%)] text-[hsl(0_0%_75%)] text-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
        </div>
      )}

      {showBulk && (
        <div className="mb-4 bg-[hsl(0_0%_10%)] border border-[hsl(263_90%_60%/0.3)] rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-white">Bulk Paste URLs</h3>
          <p className="text-xs text-[hsl(0_0%_75%)]">Paste one URL per line. Title is extracted automatically.</p>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={6} placeholder={"https://example.com\nhttps://another.site\n…"}
            className="w-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_28%)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[hsl(0_0%_58%)] outline-none resize-none font-mono" />
          <div className="flex gap-2">
            <button onClick={handleBulkPaste} disabled={!bulkText.trim() || isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(263_90%_60%)] hover:bg-[hsl(263_90%_65%)] disabled:opacity-40 text-white text-sm font-medium"><Check className="w-3.5 h-3.5" /> Import</button>
            <button onClick={() => setShowBulk(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(0_0%_12%)] text-[hsl(0_0%_75%)] text-sm"><X className="w-3.5 h-3.5" /> Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && !showBulk ? (
        <div className="text-center py-20 text-[hsl(0_0%_68%)]"><p className="text-sm">No links yet. Add one above or paste a brain dump with URLs.</p></div>
      ) : filtered.length === 0 && (search || filterTag) ? (
        <p className="text-center py-10 text-sm text-[hsl(0_0%_55%)]">No links match your filter.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {filtered.map((item) => (
                <SortableVaultRow key={item._id} item={item} onTagClick={setFilterTag} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
