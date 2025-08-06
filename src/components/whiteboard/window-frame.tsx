'use client';
import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { YoutubeEmbed } from './youtube-embed';
import { X, Paperclip, GripVertical } from 'lucide-react';
import { AiChatWindow } from './ai-chat-window';

interface WindowFrameProps {
  item: WindowItem;
  items: WindowItem[];
  onUpdate: (item: WindowItem) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
  onToggleAttachment: (id: string) => void;
}

export function WindowFrame({ item, items, onUpdate, onDelete, onFocus, onToggleAttachment }: WindowFrameProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.window-control')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - item.position.x, y: e.clientY - item.position.y });
    onFocus(item.id);
  };

  const handleDrag = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      onUpdate({
        ...item,
        position: { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y },
      });
    },
    [isDragging, dragStart, item, onUpdate]
  );

  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    } else {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  const renderContent = () => {
    switch (item.type) {
      case 'youtube':
        return <YoutubeEmbed url={item.content} />;
      case 'url':
      case 'social':
        return <iframe src={item.content} className="h-full w-full border-0" title={item.title}></iframe>;
      case 'doc':
        return (
          <Textarea
            value={item.content}
            onChange={(e) => onUpdate({ ...item, content: e.target.value })}
            className="h-full w-full resize-none border-0 focus-visible:ring-0"
            placeholder="Start writing..."
          />
        );
      case 'ai':
        return <AiChatWindow items={items} />;
      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: item.position.x,
        top: item.position.y,
        width: item.size.width,
        height: item.size.height,
        zIndex: item.zIndex,
      }}
      onMouseDown={() => onFocus(item.id)}
    >
      <Card className="flex h-full w-full flex-col shadow-2xl transition-all duration-300 hover:shadow-primary/30">
        <CardHeader
          className="flex cursor-move flex-row items-center justify-between p-2"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <Input
              value={item.title}
              onChange={(e) => onUpdate({ ...item, title: e.target.value })}
              className="h-7 border-none bg-transparent text-sm font-medium focus-visible:ring-1"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={`window-control h-7 w-7 ${item.isAttached ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => onToggleAttachment(item.id)}
              title={item.isAttached ? 'Detach from context' : 'Attach to context'}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="window-control h-7 w-7"
              onClick={() => onDelete(item.id)}
              title="Close window"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
