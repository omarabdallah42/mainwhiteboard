

'use client';

import * as React from 'react';
import type { WindowItem, WindowType } from '@/lib/types';
import { WhiteboardCanvas } from '@/components/whiteboard/whiteboard-canvas';
import { Sidebar } from '@/components/whiteboard/sidebar';
import { Minimap } from '@/components/whiteboard/minimap';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZoomIn, ZoomOut, Redo, Undo, Copy, Trash2, Search, AlignLeft, AlignCenter, AlignRight, AlignJustify, Move, Lock, Unlock } from 'lucide-react';
import { ThemeToggle } from '@/components/whiteboard/theme-toggle';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { useSelection } from '@/hooks/use-selection';
import { useHistory } from '@/hooks/use-history';
import { useConnections } from '@/hooks/use-connections';
import { useToast } from '@/hooks/use-toast';

export default function WhiteboardPage() {
  const { user, signOut } = useAuth();
  const [items, setItems] = React.useState<WindowItem[]>([]);
  const [activeZIndex, setActiveZIndex] = React.useState(1);
  const [linking, setLinking] = React.useState<{ from: string } | null>(null);
  const [scale, setScale] = React.useState(1);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = React.useState('');
  const [clipboard, setClipboard] = React.useState<WindowItem[]>([]);
  
  // Enhanced functionality hooks
  const selection = useSelection();
  const history = useHistory(items, setItems);
  const connections = useConnections(items);
  const { toast } = useToast();
  

  
  const lastGridPosition = React.useRef({ x: 0, y: 0 });
  const GRID_GUTTER = 20;
  const WINDOW_WIDTH = 480;

  const handleAddItem = (type: WindowType, content?: string | string[]) => {
    let newZIndex = activeZIndex;
    
    const createItem = (itemContent: string): WindowItem => {
        newZIndex++;
        
        // Calculate position in world coordinates (center of current view)
        const viewportCenterX = (window.innerWidth / 2 - panOffset.x) / scale;
        const viewportCenterY = (window.innerHeight / 2 - panOffset.y) / scale;
        
        // Grid layout around the center
        const gridColumns = Math.floor(window.innerWidth / (WINDOW_WIDTH + GRID_GUTTER));
        const currentColumn = Math.floor((lastGridPosition.current.x - viewportCenterX + (WINDOW_WIDTH / 2)) / (WINDOW_WIDTH + GRID_GUTTER));
        
        if (currentColumn >= gridColumns) {
            lastGridPosition.current.x = viewportCenterX - (gridColumns * (WINDOW_WIDTH + GRID_GUTTER)) / 2;
            lastGridPosition.current.y += 360 + GRID_GUTTER;
        }

        const position = {
            x: lastGridPosition.current.x,
            y: lastGridPosition.current.y,
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
            newItem.content = '';
            newItem.title = 'Document Upload'
        } else if (type === 'image') {
            newItem.content = '';
            newItem.title = 'Image Upload'
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
        } else if (type === 'instagram') {
          if (itemContent.includes('/reel/')) {
            newItem.title = 'New Reel';
            newItem.size = { width: 325, height: 580 };
          } else {
            newItem.title = 'Instagram Profile';
          }
        } else if (type === 'url') {
            newItem.title = 'New Website';
        } else if (type === 'social') {
            newItem.content = 'https://placehold.co/600x400.png';
        }
        return newItem;
    };
    
    const newItems = Array.isArray(content) 
        ? content.map(c => createItem(c))
        : [createItem(content || '')];

    setItems((prev) => [...prev, ...newItems]);
    setActiveZIndex(newZIndex);
    
    // Add to history if not undoing/redoing
    if (!history.isUndoRedoing) {
      history.addToHistory({
        type: 'add',
        items: newItems,
      });
    }
  };

  const handleUpdateItem = (updatedItem: WindowItem) => {
    if (!history.isUndoRedoing) {
      const oldItem = items.find(item => item.id === updatedItem.id);
      if (oldItem) {
        history.addToHistory({
          type: 'update',
          items: [oldItem],
        });
      }
    }
    
    setItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    const itemToDelete = items.find(item => item.id === id);
    if (itemToDelete && !history.isUndoRedoing) {
      history.addToHistory({
        type: 'delete',
        items: [itemToDelete],
      });
    }
    
    setItems((prev) => prev.filter((item) => item.id !== id));
    selection.selectItems([]); // Clear selection when deleting
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
        // Check if connection already exists
        const existingConnections = connections.getConnectionsBetween(linking.from, id);
        
        if (existingConnections.length > 0) {
          // Remove existing connection
          const existingConnection = existingConnections[0];
          connections.deleteConnection(existingConnection.id);
          
          // Update items to remove the connection reference
          const updatedFromItem = {
            ...fromItem,
            connections: fromItem.connections.filter(c => c.id !== existingConnection.id)
          };
          handleUpdateItem(updatedFromItem);
          
          if (!history.isUndoRedoing) {
            history.addToHistory({
              type: 'disconnect',
              items: [fromItem],
              connections: [existingConnection],
            });
          }
          
          toast({
            description: "Connection removed",
          });
        } else {
          // Create new simple connection (association type)
          const newConnection = connections.addConnection(linking.from, id, 'association');
          
          if (newConnection) {
            // Update the from item with the new connection
            const updatedFromItem = {
              ...fromItem,
              connections: [...fromItem.connections, newConnection]
            };
            handleUpdateItem(updatedFromItem);
            
            if (!history.isUndoRedoing) {
              history.addToHistory({
                type: 'connect',
                items: [fromItem],
                connections: [newConnection],
              });
            }
            
            toast({
              description: "Items connected",
            });
          }
        }
      }
      
      setLinking(null);
    }
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') {
      setScale(s => Math.min(s + 0.1, 3));
    } else if (direction === 'out') {
      setScale(s => Math.max(s - 0.1, 0.1));
    } else {
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handlePanChange = (newOffset: { x: number; y: number }) => {
    setPanOffset(newOffset);
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  // Enhanced item management functions
  const deleteSelectedItems = React.useCallback(() => {
    const selectedItems = selection.getSelectedItems(items);
    if (selectedItems.length === 0) return;

    if (!history.isUndoRedoing) {
      history.addToHistory({
        type: 'delete',
        items: selectedItems,
      });
    }

    setItems(prev => prev.filter(item => !selection.isSelected(item.id)));
    selection.clearSelection();
    
    toast({
      description: `Deleted ${selectedItems.length} item(s)`,
    });
  }, [items, selection, history, toast]);

  const duplicateSelectedItems = React.useCallback(() => {
    const selectedItems = selection.getSelectedItems(items);
    if (selectedItems.length === 0) return;

    const duplicatedItems = selectedItems.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      position: {
        x: item.position.x + 20,
        y: item.position.y + 20,
      },
      zIndex: activeZIndex + 1,
      connections: [], // Clear connections for duplicated items
    }));

    setItems(prev => [...prev, ...duplicatedItems]);
    setActiveZIndex(prev => prev + duplicatedItems.length);
    
    if (!history.isUndoRedoing) {
      history.addToHistory({
        type: 'add',
        items: duplicatedItems,
      });
    }

    // Select the duplicated items
    selection.selectItems(duplicatedItems.map(item => item.id));
    
    toast({
      description: `Duplicated ${duplicatedItems.length} item(s)`,
    });
  }, [items, selection, activeZIndex, history, toast]);

  const copySelectedItems = React.useCallback(() => {
    const selectedItems = selection.getSelectedItems(items);
    if (selectedItems.length === 0) return;

    setClipboard(selectedItems);
    toast({
      description: `Copied ${selectedItems.length} item(s)`,
    });
  }, [items, selection, toast]);

  const pasteItems = React.useCallback(() => {
    if (clipboard.length === 0) return;

    const viewportCenterX = (window.innerWidth / 2 - panOffset.x) / scale;
    const viewportCenterY = (window.innerHeight / 2 - panOffset.y) / scale;

    const pastedItems = clipboard.map((item, index) => ({
      ...item,
      id: crypto.randomUUID(),
      position: {
        x: viewportCenterX + (index * 20),
        y: viewportCenterY + (index * 20),
      },
      zIndex: activeZIndex + index + 1,
      connections: [], // Clear connections for pasted items
    }));

    setItems(prev => [...prev, ...pastedItems]);
    setActiveZIndex(prev => prev + pastedItems.length);
    
    if (!history.isUndoRedoing) {
      history.addToHistory({
        type: 'add',
        items: pastedItems,
      });
    }

    // Select the pasted items
    selection.selectItems(pastedItems.map(item => item.id));
    
    toast({
      description: `Pasted ${pastedItems.length} item(s)`,
    });
  }, [clipboard, panOffset, scale, activeZIndex, history, selection, toast]);

  const alignSelectedItems = React.useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selectedItems = selection.getSelectedItems(items);
    if (selectedItems.length < 2) return;

    if (!history.isUndoRedoing) {
      history.addToHistory({
        type: 'move',
        items: selectedItems,
      });
    }

    let updatedItems: WindowItem[] = [];

    switch (alignment) {
      case 'left': {
        const minX = Math.min(...selectedItems.map(item => item.position.x));
        updatedItems = selectedItems.map(item => ({
          ...item,
          position: { ...item.position, x: minX }
        }));
        break;
      }
      case 'center': {
        const minX = Math.min(...selectedItems.map(item => item.position.x));
        const maxX = Math.max(...selectedItems.map(item => item.position.x + item.size.width));
        const centerX = (minX + maxX) / 2;
        updatedItems = selectedItems.map(item => ({
          ...item,
          position: { ...item.position, x: centerX - item.size.width / 2 }
        }));
        break;
      }
      case 'right': {
        const maxX = Math.max(...selectedItems.map(item => item.position.x + item.size.width));
        updatedItems = selectedItems.map(item => ({
          ...item,
          position: { ...item.position, x: maxX - item.size.width }
        }));
        break;
      }
      case 'top': {
        const minY = Math.min(...selectedItems.map(item => item.position.y));
        updatedItems = selectedItems.map(item => ({
          ...item,
          position: { ...item.position, y: minY }
        }));
        break;
      }
      case 'middle': {
        const minY = Math.min(...selectedItems.map(item => item.position.y));
        const maxY = Math.max(...selectedItems.map(item => item.position.y + item.size.height));
        const centerY = (minY + maxY) / 2;
        updatedItems = selectedItems.map(item => ({
          ...item,
          position: { ...item.position, y: centerY - item.size.height / 2 }
        }));
        break;
      }
      case 'bottom': {
        const maxY = Math.max(...selectedItems.map(item => item.position.y + item.size.height));
        updatedItems = selectedItems.map(item => ({
          ...item,
          position: { ...item.position, y: maxY - item.size.height }
        }));
        break;
      }
    }

    setItems(prev => prev.map(item => {
      const updatedItem = updatedItems.find(ui => ui.id === item.id);
      return updatedItem || item;
    }));

    toast({
      description: `Aligned ${selectedItems.length} items`,
    });
  }, [items, selection, history, toast]);

  const toggleLockSelectedItems = React.useCallback(() => {
    const selectedItems = selection.getSelectedItems(items);
    if (selectedItems.length === 0) return;

    const anyLocked = selectedItems.some(item => item.isLocked);
    const newLockState = !anyLocked;

    if (!history.isUndoRedoing) {
      history.addToHistory({
        type: 'update',
        items: selectedItems,
      });
    }

    setItems(prev => prev.map(item => 
      selection.isSelected(item.id) 
        ? { ...item, isLocked: newLockState }
        : item
    ));

    toast({
      description: `${newLockState ? 'Locked' : 'Unlocked'} ${selectedItems.length} item(s)`,
    });
  }, [items, selection, history, toast]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelectedItems();
          break;
        case 'a':
          if (isCtrl) {
            e.preventDefault();
            selection.selectAll(items);
          }
          break;
        case 'c':
          if (isCtrl) {
            e.preventDefault();
            copySelectedItems();
          }
          break;
        case 'v':
          if (isCtrl) {
            e.preventDefault();
            pasteItems();
          }
          break;
        case 'd':
          if (isCtrl) {
            e.preventDefault();
            duplicateSelectedItems();
          }
          break;
        case 'z':
          if (isCtrl && !e.shiftKey) {
            e.preventDefault();
            history.undo();
          } else if (isCtrl && e.shiftKey) {
            e.preventDefault();
            history.redo();
          }
          break;
        case 'y':
          if (isCtrl) {
            e.preventDefault();
            history.redo();
          }
          break;
        case 'Escape':
          e.preventDefault();
          selection.clearSelection();
          setLinking(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selection, deleteSelectedItems, copySelectedItems, pasteItems, duplicateSelectedItems, history]);

  // Simple connection deletion
  const handleConnectionDelete = React.useCallback((connectionId: string) => {
    const connection = connections.getConnectionById(connectionId);
    if (!connection) return;
    
    connections.deleteConnection(connectionId);
    
    // Remove from the owning item
    const ownerItem = items.find(item => 
      item.connections.some(c => c.id === connectionId)
    );
    
    if (ownerItem) {
      const updatedItem = {
        ...ownerItem,
        connections: ownerItem.connections.filter(c => c.id !== connectionId)
      };
      handleUpdateItem(updatedItem);
      
      if (!history.isUndoRedoing) {
        history.addToHistory({
          type: 'disconnect',
          items: [ownerItem],
          connections: [connection],
        });
      }
    }
    
    toast({
      description: "Connection deleted",
    });
  }, [connections, items, handleUpdateItem, history, toast]);

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  return (
    <ProtectedRoute>
      <div className="relative h-dvh w-full overflow-hidden antialiased">
        <Sidebar onAddItem={handleAddItem} />
        <WhiteboardCanvas
          items={filteredItems}
          connections={connections.connections}
          linking={linking}
          scale={scale}
          panOffset={panOffset}
          selection={selection}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onFocusItem={handleFocusItem}
          onToggleConnection={handleToggleConnection}
          onPanChange={handlePanChange}
          onScaleChange={handleScaleChange}
          onConnectionDelete={handleConnectionDelete}
        />
        <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
          <ThemeToggle />
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 bg-card shadow-lg pl-10"
            />
          </div>
        </div>
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={signOut}
            className="bg-card shadow-lg"
          >
            Sign Out
          </Button>
        </div>
        {/* Item Management Toolbar */}
        {selection.selectedIds.size > 0 && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border rounded-lg p-2 shadow-lg">
            <span className="text-sm font-medium text-muted-foreground">
              {selection.selectedIds.size} selected
            </span>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" onClick={copySelectedItems} title="Copy (Ctrl+C)">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={duplicateSelectedItems} title="Duplicate (Ctrl+D)">
              <Move className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={deleteSelectedItems} title="Delete (Del)">
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" onClick={() => alignSelectedItems('left')} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => alignSelectedItems('center')} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => alignSelectedItems('right')} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="sm" onClick={toggleLockSelectedItems} title="Toggle Lock">
              {selection.getSelectedItems(items).some(item => item.isLocked) ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}



        {/* History & Zoom Controls */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {/* History Controls */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={history.undo} 
              disabled={!history.canUndo}
              className="bg-card shadow-lg" 
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={history.redo} 
              disabled={!history.canRedo}
              className="bg-card shadow-lg" 
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleZoom('out')} className="bg-card shadow-lg" title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleZoom('reset')} className="bg-card shadow-lg w-auto px-3" title="Reset View">
              {Math.round(scale * 100)}%
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleZoom('in')} className="bg-card shadow-lg" title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => selection.selectAll(items)} 
              className="bg-card shadow-lg"
              title="Select All (Ctrl+A)"
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={pasteItems} 
              disabled={clipboard.length === 0}
              className="bg-card shadow-lg"
              title="Paste (Ctrl+V)"
            >
              Paste
            </Button>
          </div>
        </div>
        
        <Minimap
          items={items}
          scale={scale}
          panOffset={panOffset}
          onPanChange={handlePanChange}
        />


      </div>
    </ProtectedRoute>
  );
}
