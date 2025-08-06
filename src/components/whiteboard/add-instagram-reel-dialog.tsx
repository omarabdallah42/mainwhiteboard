
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddInstagramReelDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddReel: (link: string) => void;
}

export function AddInstagramReelDialog({ isOpen, onOpenChange, onAddReel }: AddInstagramReelDialogProps) {
  const [link, setLink] = React.useState<string>('');

  const handleSubmit = () => {
    if (link.trim() !== '') {
      onAddReel(link);
    }
    onOpenChange(false);
    setLink(''); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Instagram Reel</DialogTitle>
          <DialogDescription>
            Enter the URL of the Instagram reel you want to add to the whiteboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="instagram-reel-link" className="text-right">
              Link
            </Label>
            <Input
              id="instagram-reel-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="col-span-3"
              placeholder="https://www.instagram.com/reel/..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Add Reel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
