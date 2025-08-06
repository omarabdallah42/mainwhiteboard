'use client';

import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { WindowFrame } from './window-frame';

interface WhiteboardCanvasProps {
  items: WindowItem[];
  onUpdateItem: (item: WindowItem) => void;
  onDeleteItem: (id: string) => void;
  onFocusItem: (id: string) => void;
  onToggleAttachment: (id: string) => void;
}

export function WhiteboardCanvas({
  items,
  onUpdateItem,
  onDeleteItem,
  onFocusItem,
  onToggleAttachment
}: WhiteboardCanvasProps) {
  return (
    <main className="h-full w-full">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white_0,white_calc(100%-4rem),transparent_100%)] dark:bg-grid-slate-700/40"></div>
      <div className="relative h-full w-full">
        {items.map((item) => (
          <WindowFrame
            key={item.id}
            item={item}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onFocus={onFocusItem}
            onToggleAttachment={onToggleAttachment}
          />
        ))}
      </div>
    </main>
  );
}
