'use client';

import * as React from 'react';
import type { WindowItem, WindowType } from '@/lib/types';
import { WhiteboardCanvas } from '@/components/whiteboard/whiteboard-canvas';
import { Sidebar } from '@/components/whiteboard/sidebar';

export default function WhiteboardPage() {
  const [items, setItems] = React.useState<WindowItem[]>([]);
  const [activeZIndex, setActiveZIndex] = React.useState(1);

  const handleAddItem = (type: WindowType, content?: string) => {
    const newItem: WindowItem = {
      id: crypto.randomUUID(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: content || '',
      position: { x: Math.random() * 200 + 150, y: Math.random() * 200 + 150 },
      size: { width: 480, height: 360 },
      isAttached: false,
      zIndex: activeZIndex + 1,
    };
    
    if (type === 'ai') {
        newItem.title = "AI Assistant"
        newItem.size = { width: 400, height: 550 };
    } else if (type === 'doc') {
        newItem.content = 'Start writing your document here...';
    } else if (type === 'youtube') {
        newItem.content = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    } else if (type === 'url' || type === 'social' || type === 'image') {
        newItem.content = 'https://placehold.co/600x400.png';
        if (type === 'image') {
          newItem.title = 'New Image';
        }
    }


    setItems((prev) => [...prev, newItem]);
    setActiveZIndex((prev) => prev + 2);
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
    const item = items.find(i => i.id === id);
    if (item && item.zIndex < activeZIndex) {
      const newZIndex = activeZIndex + 1;
      setItems(prevItems =>
        prevItems.map(i => (i.id === id ? { ...i, zIndex: newZIndex } : i))
      );
      setActiveZIndex(newZIndex);
    }
  };
  
  return (
    <div className="relative h-dvh w-full overflow-hidden antialiased">
      <Sidebar onAddItem={handleAddItem} />
      <WhiteboardCanvas
        items={items}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onFocusItem={handleFocusItem}
        onToggleAttachment={() => {}}
      />
    </div>
  );
}
