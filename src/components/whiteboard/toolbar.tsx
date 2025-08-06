'use client';

import * as React from 'react';
import type { WindowType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Youtube, Link as LinkIcon, FileText, Share2 } from 'lucide-react';

interface ToolbarProps {
  onAddItem: (type: WindowType, content?: string) => void;
}

export function Toolbar({ onAddItem }: ToolbarProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<WindowType | null>(null);
  const [inputValue, setInputValue] = React.useState('');

  const openDialog = (type: WindowType) => {
    setDialogType(type);
    setInputValue(type === 'doc' ? '' : 'https://');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    if (dialogType) {
      onAddItem(dialogType, inputValue);
    }
    setDialogOpen(false);
    setInputValue('');
  };

  const getDialogInfo = () => {
    switch(dialogType) {
      case 'youtube':
        return { title: 'Embed YouTube Video', label: 'YouTube URL' };
      case 'url':
        return { title: 'Embed URL', label: 'Website URL' };
      case 'social':
        return { title: 'Embed Social Media', label: 'Profile or Post URL'};
      default:
        return { title: 'Add Item', label: 'Content' };
    }
  }

  const {title, label} = getDialogInfo();

  return (
    <>
      <header className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-card/80 p-2 shadow-lg backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="primary" className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={() => openDialog('youtube')}>
              <Youtube className="mr-2 h-4 w-4" />
              <span>YouTube Video</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('url')}>
              <LinkIcon className="mr-2 h-4 w-4" />
              <span>Website / URL</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddItem('doc')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Document</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => openDialog('social')}>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Social Media</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content-input" className="text-right">
                {label}
              </Label>
              <Input
                id="content-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
