'use client';

import * as React from 'react';
import type { WindowType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Youtube, FileText, Image as ImageIcon, Globe, MessageCircle } from 'lucide-react';

interface SidebarProps {
  onAddItem: (type: WindowType, content?: string) => void;
}

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16.5 6.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/>
        <path d="M12 15.5v-9"/>
        <path d="M12 15.5a4.5 4.5 0 1 0 4.5-4.5"/>
    </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
);

export function Sidebar({ onAddItem }: SidebarProps) {
  
  const toolButtons = [
     { type: 'youtube', icon: Youtube, tooltip: 'YouTube', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
     { type: 'tiktok', icon: TikTokIcon, tooltip: 'TikTok', content: 'https://www.tiktok.com' },
     { type: 'instagram', icon: InstagramIcon, tooltip: 'Instagram', content: 'https://www.instagram.com' },
     { type: 'doc', icon: FileText, tooltip: 'Document'},
     { type: 'url', icon: Globe, tooltip: 'Website / URL', content: 'https://google.com'},
     { type: 'image', icon: ImageIcon, tooltip: 'Image'},
  ]

  return (
    <TooltipProvider>
      <aside className="fixed top-1/2 left-4 z-50 -translate-y-1/2 rounded-full border bg-card/90 p-2 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-primary/20 text-primary hover:bg-primary/30 h-12 w-12" onClick={() => onAddItem('ai')}>
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Chat</TooltipContent>
            </Tooltip>
            
            <div className="my-2 h-px w-8 bg-border" />
            
            {toolButtons.map(tool => (
                 <Tooltip key={tool.tooltip}>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem(tool.type as WindowType, tool.content)}>
                            <tool.icon className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{tool.tooltip}</TooltipContent>
                </Tooltip>
            ))}
        </div>
      </aside>
    </TooltipProvider>
  );
}
