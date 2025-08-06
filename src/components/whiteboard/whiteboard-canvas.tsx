'use client';

import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { WindowFrame } from './window-frame';
import { ConnectionLine } from './connection-line';
import { X } from 'lucide-react';

interface WhiteboardCanvasProps {
  items: WindowItem[];
  linking: { from: string } | null;
  scale: number;
  panOffset: { x: number; y: number };
  onUpdateItem: (item: WindowItem) => void;
  onDeleteItem: (id: string) => void;
  onFocusItem: (id: string) => void;
  onToggleConnection: (id: string) => void;
}

export function WhiteboardCanvas({
  items,
  linking,
  scale,
  panOffset,
  onUpdateItem,
  onDeleteItem,
  onFocusItem,
  onToggleConnection,
}: WhiteboardCanvasProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const canvasRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({ 
          x: (e.clientX - rect.left - panOffset.x) / scale,
          y: (e.clientY - rect.top - panOffset.y) / scale 
        });
      }
    };
    if (linking) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [linking, scale, panOffset]);

  const getHandlePosition = (item: WindowItem, side: 'left' | 'right') => {
    return {
      x: item.position.x + (side === 'right' ? item.size.width : 0),
      y: item.position.y + item.size.height / 2,
    };
  };
  
  const handleDisconnect = (fromId: string, toId: string) => {
    const fromItem = items.find(item => item.id === fromId);
    if (fromItem) {
      const updatedConnections = fromItem.connections.filter(c => c.to !== toId);
      onUpdateItem({ ...fromItem, connections: updatedConnections });
    }
  };

  const linkingFromItem = linking ? items.find(item => item.id === linking.from) : null;
  const allConnections = items.flatMap(item => 
    item.connections.map(conn => ({...conn, from: item.id}))
  );

  return (
    <main ref={canvasRef} className="h-full w-full" onClick={() => linking && onToggleConnection('')}>
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white_0,white_calc(100%-4rem),transparent_100%)] dark:bg-grid-slate-700/40"></div>
      <div
        className="relative h-full w-full"
        style={{
          transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
          transformOrigin: '0 0',
        }}
      >
        <svg className="absolute inset-0 pointer-events-none h-full w-full" style={{ strokeWidth: 2 / scale }}>
          {allConnections.map((conn, index) => {
            const fromItem = items.find(item => item.id === conn.from);
            const toItem = items.find(item => item.id === conn.to);
            if (!fromItem || !toItem) return null;

            const p1 = getHandlePosition(fromItem, 'right');
            const p2 = getHandlePosition(toItem, 'left');

            return <ConnectionLine key={`${conn.from}-${conn.to}`} from={p1} to={p2} />;
          })}
          {linkingFromItem && (
            <ConnectionLine from={getHandlePosition(linkingFromItem, 'right')} to={mousePosition} />
          )}
        </svg>

        {/* Connection disconnect icons */}
        {allConnections.map((conn) => {
            const fromItem = items.find(item => item.id === conn.from);
            const toItem = items.find(item => item.id === conn.to);
            if (!fromItem || !toItem) return null;
            
            const p1 = getHandlePosition(fromItem, 'right');
            const p2 = getHandlePosition(toItem, 'left');

            const controlX1 = p1.x + 100;
            const controlY1 = p1.y;
            const controlX2 = p2.x - 100;
            const controlY2 = p2.y;

            const midX = Math.pow(0.5, 3) * p1.x + 3 * Math.pow(0.5, 2) * 0.5 * controlX1 + 3 * 0.5 * Math.pow(0.5, 2) * controlX2 + Math.pow(0.5, 3) * p2.x;
            const midY = Math.pow(0.5, 3) * p1.y + 3 * Math.pow(0.5, 2) * 0.5 * controlY1 + 3 * 0.5 * Math.pow(0.5, 2) * controlY2 + Math.pow(0.5, 3) * p2.y;

            return (
                <div
                    key={`${conn.from}-${conn.to}-icon`}
                    className="absolute z-10"
                    style={{ left: midX - 12, top: midY - 12 }}
                >
                    <button
                        className="flex h-6 w-6 items-center justify-center rounded-full border bg-card text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(conn.from, conn.to);
                        }}
                        title="Disconnect"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )
        })}

        {items.map((item) => (
          <WindowFrame
            key={item.id}
            item={item}
            items={items}
            isLinking={!!linking}
            isLinkingFrom={linking?.from === item.id}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onFocus={onFocusItem}
            onToggleConnection={onToggleConnection}
          />
        ))}
      </div>
    </main>
  );
}
