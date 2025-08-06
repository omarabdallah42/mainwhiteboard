'use client';

import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { WindowFrame } from './window-frame';
import { ConnectionLine } from './connection-line';

interface WhiteboardCanvasProps {
  items: WindowItem[];
  linking: { from: string } | null;
  onUpdateItem: (item: WindowItem) => void;
  onDeleteItem: (id: string) => void;
  onFocusItem: (id: string) => void;
  onToggleConnection: (id: string) => void;
}

export function WhiteboardCanvas({
  items,
  linking,
  onUpdateItem,
  onDeleteItem,
  onFocusItem,
  onToggleConnection
}: WhiteboardCanvasProps) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    if (linking) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [linking]);

  const getHandlePosition = (item: WindowItem, side: 'left' | 'right') => {
    return {
      x: item.position.x + (side === 'right' ? item.size.width : 0),
      y: item.position.y + item.size.height / 2,
    };
  };

  const linkingFromItem = linking ? items.find(item => item.id === linking.from) : null;
  const allConnections = items.flatMap(item => item.connections);

  return (
    <main className="h-full w-full" onClick={() => linking && onToggleConnection('')}>
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white_0,white_calc(100%-4rem),transparent_100%)] dark:bg-grid-slate-700/40"></div>
      <svg className="absolute inset-0 pointer-events-none h-full w-full">
        {allConnections.map((conn, index) => {
          const fromItem = items.find(item => item.id === conn.from);
          const toItem = items.find(item => item.id === conn.to);
          if (!fromItem || !toItem) return null;

          const p1 = getHandlePosition(fromItem, 'right');
          const p2 = getHandlePosition(toItem, 'left');

          return <ConnectionLine key={index} from={p1} to={p2} />;
        })}
        {linkingFromItem && (
           <ConnectionLine from={getHandlePosition(linkingFromItem, 'right')} to={mousePosition} />
        )}
      </svg>
      <div className="relative h-full w-full">
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
