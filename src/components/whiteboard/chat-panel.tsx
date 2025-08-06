'use client';

import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  generateScriptFromContext,
  GenerateScriptFromContextOutput,
} from '@/ai/flows/generate-script-from-context';
import {
  summarizeDocument,
  SummarizeDocumentOutput,
} from '@/ai/flows/summarize-document';
import {
  summarizeYouTubeVideo,
  SummarizeYouTubeVideoOutput,
} from '@/ai/flows/summarize-youtube-video';
import { useToast } from '@/hooks/use-toast';
import { Bot, FileText, SendHorizonal, Youtube, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  items: WindowItem[];
}

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export function ChatPanel({ items }: ChatPanelProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const getAttachedContext = () => {
    return items
      .filter((item) => item.isAttached)
      .map(
        (item) =>
          `Type: ${item.type}\nTitle: ${item.title}\nContent: ${item.content}`
      )
      .join('\n\n---\n\n');
  };

  const handleAction = async (
    action: 'script' | 'summarizeDoc' | 'summarizeYT'
  ) => {
    setIsLoading(true);
    const attachedItems = items.filter((item) => item.isAttached);

    if (attachedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Content Attached',
        description: 'Please attach one or more windows to the context.',
      });
      setIsLoading(false);
      return;
    }

    try {
      let response: GenerateScriptFromContextOutput | SummarizeDocumentOutput | SummarizeYouTubeVideoOutput | null = null;

      if (action === 'script') {
        const context = getAttachedContext();
        setMessages((prev) => [...prev, { role: 'user', content: `Generate a script from the attached context.` }]);
        response = await generateScriptFromContext({ context });
        if ('script' in response) {
          setMessages((prev) => [...prev, { role: 'ai', content: response.script }]);
        }
      } else if (action === 'summarizeDoc') {
         setMessages((prev) => [...prev, { role: 'user', content: `Summarize attached documents.` }]);
        for (const item of attachedItems.filter(i => i.type === 'doc')) {
           response = await summarizeDocument({ documentText: item.content });
           if ('summary' in response) {
             setMessages((prev) => [...prev, { role: 'ai', content: `Summary for "${item.title}":\n\n${response.summary}` }]);
           }
        }
      } else if (action === 'summarizeYT') {
        setMessages((prev) => [...prev, { role: 'user', content: `Summarize attached YouTube videos.` }]);
        for (const item of attachedItems.filter(i => i.type === 'youtube')) {
            response = await summarizeYouTubeVideo({ youtubeVideoUrl: item.content });
            if ('summary' in response) {
                setMessages((prev) => [...prev, { role: 'ai', content: `Summary for "${item.title}":\n\n${response.summary}` }]);
            }
        }
      }
    } catch (error) {
      console.error('AI action failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while processing your request.',
      });
       setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAttachable = (type: 'doc' | 'youtube') => {
    return items.some(item => item.isAttached && item.type === type);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="primary"
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
          size="lg"
        >
          <Bot className="mr-2 h-5 w-5" />
          AI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Assistant</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-body">{message.content}</pre>
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="border-t bg-background p-4">
          <div className="mb-2 flex flex-wrap gap-2">
             <Button size="sm" onClick={() => handleAction('script')} disabled={isLoading || items.filter(i => i.isAttached).length === 0}>Generate Script</Button>
             <Button size="sm" onClick={() => handleAction('summarizeDoc')} disabled={isLoading || !hasAttachable('doc')}>
                <FileText className="mr-1 h-4 w-4"/> Summarize Docs
             </Button>
             <Button size="sm" onClick={() => handleAction('summarizeYT')} disabled={isLoading || !hasAttachable('youtube')}>
                <Youtube className="mr-1 h-4 w-4"/> Summarize Videos
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
