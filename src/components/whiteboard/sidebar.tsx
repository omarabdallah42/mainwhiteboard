'use client';

import * as React from 'react';
import type { WindowType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bot, Youtube, Link as LinkIcon, FileText, Image as ImageIcon, Globe, Mic, Folder, GitFork } from 'lucide-react';

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


const TextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 6.1H7a1 1 0 0 0-1 1v1.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V8.3h1.5v7.4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1.5a1 1 0 0 0-1-1H5.5a1 1 0 0 0-1 1v1.5a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1V16h1.5v1.9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1.9H17a1 1 0 0 0 1-1v-1.5a1 1 0 0 0-1-1h-1.5a1 1 0 0 0-1 1v1.2h-1.5V8.3a1 1 0 0 1 1-1H17a1 1 0 0 0 1-1V7.1a1 1 0 0 0-1-1Z"/></svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);


export function Sidebar({ onAddItem }: SidebarProps) {
  
  const socialButtons = [
     { type: 'tiktok', icon: TikTokIcon, tooltip: 'TikTok', content: 'https://www.tiktok.com' },
     { type: 'youtube', icon: Youtube, tooltip: 'YouTube', content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
     { type: 'instagram', icon: InstagramIcon, tooltip: 'Instagram', content: 'https://www.instagram.com' },
  ]


  return (
    <TooltipProvider>
      <aside className="fixed top-1/2 left-4 z-50 -translate-y-1/2 rounded-full border bg-card/90 p-2 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-primary/20 text-primary hover:bg-primary/30 h-12 w-12" onClick={() => onAddItem('ai')}>
                        <Bot className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">AI Assistant</TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-2 gap-1 rounded-lg border p-1">
                {socialButtons.map(tool => (
                     <Tooltip key={tool.tooltip}>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-md" onClick={() => onAddItem(tool.type as WindowType, tool.content)}>
                                <tool.icon className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{tool.tooltip}</TooltipContent>
                    </Tooltip>
                ))}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-md">
                            <div className="h-5 w-5">+</div>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Add Social</TooltipContent>
                </Tooltip>
            </div>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem('social', 'https://www.facebook.com')}>
                        <FacebookIcon className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Facebook Post</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem('doc')}>
                        <Mic className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Audio Note</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem('image')}>
                        <ImageIcon className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Image</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem('doc')}>
                        <TextIcon className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Text Note</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem('url')}>
                        <Globe className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Website / URL</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onAddItem('doc')}>
                        <FileText className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Document</TooltipContent>
            </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
