
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
  
  const lastGridPosition = React.useRef({ x: 150, y: 150 });
  const GRID_GUTTER = 20;
  const WINDOW_WIDTH = 480;

  const handleAddItem = (type: WindowType, content?: string | string[]) => {
    let newZIndex = activeZIndex;
    
    const createItem = (itemContent: string): WindowItem => {
        newZIndex++;
        
        const canvasWidth = window.innerWidth / scale;
        if (lastGridPosition.current.x + WINDOW_WIDTH + GRID_GUTTER > (canvasWidth - panOffset.x) / scale) {
            lastGridPosition.current.x = 150;
            lastGridPosition.current.y += 360 + GRID_GUTTER;
        }

        const position = {
            x: (lastGridPosition.current.x - panOffset.x) / scale,
            y: (lastGridPosition.current.y - panOffset.y) / scale,
        };

        const newItem: WindowItem = {
          id: crypto.randomUUID(),
          type,
          title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          content: itemContent || '',
          position: position,
          size: { width: WINDOW_WIDTH, height: 360 },
          isAttached: false,
          zIndex: newZIndex,
          connections: [],
        };
        
        lastGridPosition.current.x += WINDOW_WIDTH + GRID_GUTTER;

        if (type === 'ai') {
            newItem.title = "AI Assistant"
            newItem.size = { width: 400, height: 550 };
        } else if (type === 'doc') {
            newItem.content = 'Start writing your document here...';
        } else if (type === 'youtube' && !itemContent) {
            newItem.content = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            newItem.title = 'New Video';
        } else if (type === 'youtube' && itemContent) {
            if (itemContent.includes('playlist?list=')) {
              newItem.title = 'New Playlist';
            } else if (itemContent.includes('/channel/') || itemContent.includes('/c/') || itemContent.includes('/user/')) {
              newItem.title = 'New Channel';
            } else {
              newItem.title = 'New Video';
            }
        } else if (type === 'tiktok') {
            if (itemContent.includes('/video/')) {
              newItem.title = 'New Reel';
              newItem.size = { width: 325, height: 580 };
            } else {
              newItem.title = 'Tiktok Profile';
            }
        } else if (type === 'url' || type === 'social' || type === 'image' || type === 'instagram') {
            newItem.content = 'https://placehold.co/600x400.png';
            if (type === 'image') {
              newItem.title = 'New Image';
            }
        }
        return newItem;
    };
    
    const newItems = Array.isArray(content) 
        ? content.map(c => createItem(c))
        : [createItem(content || '')];

    setItems((prev) => [...prev, ...newItems]);
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
