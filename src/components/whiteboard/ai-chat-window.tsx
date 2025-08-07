
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bot, MessageCircle, Send, ChevronDown } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import type { WindowItem } from '@/lib/types';
import { generateScriptFromContext } from '@/lib/ai-generate-script';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

interface AiChatWindowProps {
    item: WindowItem;
    items: WindowItem[];
}

export function AiChatWindow({ item, items }: AiChatWindowProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const { toast } = useToast();
  const scrollViewportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    const autoScrollToBottom = () => {
      if (scrollViewportRef.current) {
        const viewport = scrollViewportRef.current;
        viewport.scrollTop = viewport.scrollHeight;
      }
    };

    // Use a small delay to ensure content is rendered
    const timeoutId = setTimeout(autoScrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  // Check if user is at bottom of chat
  const checkIfAtBottom = React.useCallback(() => {
    if (!scrollViewportRef.current) return;
    
    const viewport = scrollViewportRef.current;
    const isAtBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 10; // 10px threshold
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [messages.length]);

  // Scroll to bottom function
  const scrollToBottom = React.useCallback(() => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Add scroll event listener
  React.useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      checkIfAtBottom();
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // Check if at bottom when messages change
  React.useEffect(() => {
    checkIfAtBottom();
  }, [messages, checkIfAtBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, newUserMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        const connectedWindowIds = item.connections.map(conn => conn.to);
        const connectedItems = items.filter(i => connectedWindowIds.includes(i.id));
        
        const context = connectedItems.map(i => {
            let content = '';
            
            // Handle YouTube videos with comprehensive data
            if (i.type === 'youtube' && i.scrapedData?.transcript) {
                content = `📺 YouTube Video: "${i.scrapedData.title}"\n`;
                content += `👤 Channel: ${i.scrapedData.author}`;
                if (i.scrapedData.channelSubscribers) {
                    content += ` (${(i.scrapedData.channelSubscribers / 1000).toFixed(1)}K subscribers)`;
                }
                content += `\n⏱️ Duration: ${i.scrapedData.duration}\n`;
                if (i.scrapedData.viewCount) {
                    content += `👀 Views: ${(i.scrapedData.viewCount / 1000).toFixed(1)}K`;
                }
                if (i.scrapedData.likes) {
                    content += ` | 👍 Likes: ${(i.scrapedData.likes / 1000).toFixed(1)}K`;
                }
                if (i.scrapedData.commentsCount) {
                    content += ` | 💬 Comments: ${i.scrapedData.commentsCount}`;
                }
                content += `\n`;
                if (i.scrapedData.uploadDate) {
                    content += `📅 Published: ${i.scrapedData.uploadDate}\n`;
                }
                if (i.scrapedData.description && i.scrapedData.description !== i.scrapedData.transcript) {
                    content += `📋 Description: ${i.scrapedData.description.substring(0, 200)}...\n`;
                }
                content += `📝 Full Transcript: ${i.scrapedData.transcript}`;
            }
            
            // Handle YouTube playlists with comprehensive data
            if (i.type === 'youtube-playlist' && i.scrapedData?.transcript) {
                content = `📋 YouTube Playlist: "${i.scrapedData.title}"\n`;
                content += `👤 Creator: ${i.scrapedData.author}\n`;
                if (i.scrapedData.videos && Array.isArray(i.scrapedData.videos)) {
                    content += `🎬 Total Videos: ${i.scrapedData.videos.length}\n`;
                    content += `⏱️ Total Duration: ${i.scrapedData.totalDuration || 'N/A'}\n`;
                }
                if (i.scrapedData.viewCount) {
                    content += `👀 Total Views: ${(i.scrapedData.viewCount / 1000).toFixed(1)}K\n`;
                }
                if (i.scrapedData.description) {
                    content += `📋 Description: ${i.scrapedData.description.substring(0, 200)}...\n`;
                }
                content += `📝 Combined Content: ${i.scrapedData.transcript}`;
            }
            
            // Handle documents
            else if (i.type === 'doc') {
                try {
                    const parsedDocs = JSON.parse(i.content);
                    if (Array.isArray(parsedDocs)) {
                        content = parsedDocs.map((doc: {name: string, content: string}) => `Document: ${doc.name}\n${doc.content}`).join('\n\n');
                    }
                } catch {
                    content = i.content;
                }
            } 
            // Handle other content types
            else {
               content = i.content;
            }
            
            return `## ${i.title} (${i.type})\n${content}`;
        }).join('\n\n---\n\n');
        
        const result = await generateScriptFromContext({
            prompt: currentInput,
            context: context
        });

        const aiResponse: Message = { role: 'ai', content: result.script };
        setMessages((prev) => [...prev, aiResponse]);

    } catch (error) {
        console.error('Error generating script:', error);
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: 'Failed to get a response from the AI. Please try again.',
        });
        const aiErrorResponse: Message = { role: 'ai', content: "Sorry, I couldn't process that request." };
        setMessages((prev) => [...prev, aiErrorResponse]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden relative">
       <ScrollArea className="flex-1 min-h-0" viewportRef={scrollViewportRef}>
          <div className="p-4 space-y-4 min-h-full">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 gap-4">
                    <MessageCircle className="h-10 w-10" />
                    <p>Start a conversation with the AI assistant.</p>
                </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 items-start ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
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
              <div className="flex justify-start gap-3 items-start">
                <Bot className="h-6 w-6 text-primary flex-shrink-0" />
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
        
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="absolute bottom-16 right-4 z-10">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={scrollToBottom}
              title="Scroll to newest message"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="border-t bg-background p-2 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    </div>
  );
}
