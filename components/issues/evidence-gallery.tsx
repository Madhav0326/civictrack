'use client';

import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import type { IssueEvidence } from '@/lib/types';

interface EvidenceGalleryProps {
  evidence: IssueEvidence[];
  canDelete?: boolean;
  onDelete?: (item: IssueEvidence) => void;
}

export function EvidenceGallery({ evidence, canDelete, onDelete }: EvidenceGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {evidence.map((item) => {
        const url = supabase.storage.from('issue-evidence').getPublicUrl(item.file_path).data.publicUrl;

        return (
          <div key={item.id} className="relative group overflow-hidden rounded-lg border bg-secondary/20">
            {canDelete && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-7 w-7 opacity-80 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(item);
                }}
                aria-label="Remove evidence file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {item.file_type === 'image' ? (
              <a href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={item.caption || item.file_name || 'Issue evidence'}
                  className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </a>
            ) : item.file_type === 'video' ? (
              <video controls preload="metadata" className="aspect-square w-full bg-black">
                <source src={url} />
              </video>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center text-sm hover:bg-secondary"
              >
                <FileText className="h-8 w-8 text-primary" />
                <span className="line-clamp-2 text-xs font-medium">{item.file_name || 'Document'}</span>
              </a>
            )}
            {item.caption && <p className="p-2 text-xs text-muted-foreground">{item.caption}</p>}
          </div>
        );
      })}
    </div>
  );
}
