'use client';

import * as React from 'react';
import type { WindowItem, WindowType } from '@/lib/types';
import { Toolbar } from '@/components/whiteboard/toolbar';
import { WhiteboardCanvas } from '@/components/whiteboard/whiteboard-canvas';

export default function WhiteboardPage() {
  const [items, setItems] = React.useState<WindowItem[]>([]);
  const [activeZIndex, setActiveZIndex] = React.useState(1);

  const handleAddItem = (type: WindowType, content?: string) => {
    const newItem: WindowItem = {
      id: crypto.randomUUID(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: content || (type === 'doc' ? 'Start writing your document here...' : type === 'ai' ? '' : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 150 },
      size: { width: 480, height: 360 },
      isAttached: false,
      zIndex: activeZIndex,
    };
    if (type === 'ai') {
        newItem.title = "AI Assistant"
        newItem.size = { width: 400, height: 550 };
    }
    setItems((prev) => [...prev, newItem]);
    setActiveZIndex((prev) => prev + 1);
  };

  const handleUpdateItem = (updatedItem: WindowItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFocusItem = (id: string) => {
    const focusedItem = items.find((item) => item.id === id);
    if (focusedItem && focusedItem.zIndex < activeZIndex - 1) {
      const newZIndex = activeZIndex;
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, zIndex: newZIndex } : item
        )
      );
      setActiveZIndex(newZIndex + 1);
    }
  };

  const handleToggleAttachment = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAttached: !item.isAttached } : item
      )
    );
  };
  
  return (
    <div className="relative h-dvh w-full overflow-hidden antialiased">
      <Toolbar onAddItem={handleAddItem} />
      <WhiteboardCanvas
        items={items}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onFocusItem={handleFocusItem}
        onToggleAttachment={handleToggleAttachment}
      />
    </div>
  );
}
