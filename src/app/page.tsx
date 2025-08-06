'use client';

import * as React from 'react';
import type { WindowItem, WindowType } from '@/lib/types';
import { WhiteboardCanvas } from '@/components/whiteboard/whiteboard-canvas';
import { Sidebar } from '@/components/whiteboard/sidebar';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Redo } from 'lucide-react';
import { ThemeToggle } from '@/components/whiteboard/theme-toggle';

export default function WhiteboardPage() {
  const [items, setItems] = React.useState<WindowItem[]>([]);
  const [activeZIndex, setActiveZIndex] = React.useState(1);
  const [linking, setLinking] = React.useState<{ from: string } | null>(null);
  const [scale, setScale] = React.useState(1);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });

  const handleAddItem = (type: WindowType, content?: string) => {
    const newZIndex = activeZIndex + 1;
    const newItem: WindowItem = {
      id: crypto.randomUUID(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: content || '',
      position: { 
        x: (Math.random() * 200 + 150 - panOffset.x) / scale,
        y: (Math.random() * 200 + 150 - panOffset.y) / scale 
      },
      size: { width: 480, height: 360 },
      isAttached: false,
      zIndex: newZIndex,
      connections: [],
    };
    
    if (type === 'ai') {
        newItem.title = "AI Assistant"
        newItem.size = { width: 400, height: 550 };
    } else if (type === 'doc') {
        newItem.content = 'Start writing your document here...';
    } else if (type === 'youtube') {
        newItem.content = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    } else if (type === 'url' || type === 'social' || type === 'image' || type === 'tiktok' || type === 'instagram') {
        newItem.content = 'https://placehold.co/600x400.png';
        if (type === 'image') {
          newItem.title = 'New Image';
        }
    }

    setItems((prev) => [...prev, newItem]);
    setActiveZIndex(newZIndex);
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

  const handleToggleConnection = (id: string) => {
    if (!linking) {
      setLinking({ from: id });
    } else {
      if (linking.from === id) {
        setLinking(null);
        return;
      }
      
      const fromItem = items.find(item => item.id === linking!.from);
      const toItem = items.find(item => item.id === id);

      if (fromItem && toItem) {
        const isAlreadyConnected = fromItem.connections.some(c => c.to === id);
        
        if (isAlreadyConnected) {
          // Disconnect
          const updatedFromItem = {
            ...fromItem,
            connections: fromItem.connections.filter(c => c.to !== id)
          };
          handleUpdateItem(updatedFromItem);
        } else {
          // Connect
          const updatedFromItem = {
            ...fromItem,
            connections: [...fromItem.connections, { from: fromItem.id, to: id }]
          };
          handleUpdateItem(updatedFromItem);
        }
      }
      
      setLinking(null);
    }
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') {
      setScale(s => Math.min(s + 0.1, 2));
    } else if (direction === 'out') {
      setScale(s => Math.max(s - 0.1, 0.2));
    } else {
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent panning when interacting with other elements
    if ((e.target as HTMLElement).closest('.window-frame') || (e.target as HTMLElement).closest('aside') || (e.target as HTMLElement).closest('.fixed')) {
        return;
    }
    
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      (e.currentTarget as HTMLElement).style.cursor = 'default';
    }
  };
  
  return (
    <div 
      className="relative h-dvh w-full overflow-hidden antialiased"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Sidebar onAddItem={handleAddItem} />
      <WhiteboardCanvas
        items={items}
        linking={linking}
        scale={scale}
        panOffset={panOffset}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onFocusItem={handleFocusItem}
        onToggleConnection={handleToggleConnection}
      />
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => handleZoom('out')} className="bg-card shadow-lg">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleZoom('reset')} className="bg-card shadow-lg w-auto px-3">
          {Math.round(scale * 100)}%
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleZoom('in')} className="bg-card shadow-lg">
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
