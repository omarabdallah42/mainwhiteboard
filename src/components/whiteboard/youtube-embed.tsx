import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface YoutubeEmbedProps {
  url: string;
  item?: WindowItem;
  onUpdate?: (item: WindowItem) => void;
}

export function YoutubeEmbed({ url, item, onUpdate }: YoutubeEmbedProps) {
  const [isScrapingTranscript, setIsScrapingTranscript] = React.useState(false);
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      if (hostname === 'youtu.be') {
        const videoId = pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }
      
      if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
        if (pathname.startsWith('/embed/')) {
          return url;
        }
        if (pathname.startsWith('/watch')) {
          const videoId = searchParams.get('v');
          if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        }
        if (pathname.startsWith('/playlist')) {
          const listId = searchParams.get('list');
          if (listId) return `https://www.youtube.com/embed/videoseries?list=${listId}`;
        }
        if (pathname.startsWith('/channel/')) {
            const channelId = pathname.split('/')[2];
            // YouTube uses a convention where replacing 'UC' with 'UU' in a channel ID gives the uploads playlist ID.
            if (channelId && channelId.startsWith('UC')) {
              const uploadsListId = 'UU' + channelId.substring(2);
              return `https://www.youtube.com/embed/videoseries?list=${uploadsListId}`;
            }
        }
        // Handle @username format (e.g., youtube.com/@channelname)
        if (pathname.startsWith('/@')) {
          const channelHandle = pathname.substring(2);
          if (channelHandle) {
            // For @username, we'll show a placeholder that still allows scraping
            return `https://www.youtube.com/embed/videoseries?list=UUPlaceholder`;
          }
        }
        // Fallback for /c/ and /user/ custom URLs
        if (pathname.startsWith('/user/') || pathname.startsWith('/c/')) {
           const customUrlName = pathname.split('/')[2];
           if(customUrlName) {
             // Show placeholder for custom URLs that still allows scraping
             return `https://www.youtube.com/embed/videoseries?list=UUPlaceholder`;
           }
        }
      }
    } catch (error) {
      console.error("Invalid URL:", error);
      return null;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(url);

  const handleScrapeTranscript = async () => {
    if (!item || !onUpdate) return;
    
    setIsScrapingTranscript(true);
    
    // Update item to show loading state
    onUpdate({
      ...item,
      scrapingStatus: 'loading',
    });

    try {
      const response = await fetch('/api/scrape/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          type: 'video',
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Update item with scraped data
        onUpdate({
          ...item,
          scrapingStatus: 'success',
          scrapedData: {
            ...result.data,
            scrapedAt: new Date().toISOString(),
          },
        });
      } else {
        // Update item with error state
        onUpdate({
          ...item,
          scrapingStatus: 'error',
        });
      }
    } catch (error) {
      console.error('Error scraping transcript:', error);
      onUpdate({
        ...item,
        scrapingStatus: 'error',
      });
    } finally {
      setIsScrapingTranscript(false);
    }
  };

  const renderScrapingStatus = () => {
    if (!item) return null;

    const { scrapingStatus, scrapedData } = item;

    return (
      <div className="absolute top-2 right-2 z-10">
        {scrapingStatus === 'loading' || isScrapingTranscript ? (
          <Button variant="outline" size="sm" disabled>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Scraping...
          </Button>
        ) : scrapingStatus === 'success' && scrapedData ? (
          <Button variant="outline" size="sm" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
            Transcript Ready
          </Button>
        ) : scrapingStatus === 'error' ? (
          <Button variant="outline" size="sm" onClick={handleScrapeTranscript}>
            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
            Retry
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleScrapeTranscript}>
            <Download className="h-4 w-4 mr-2" />
            Get Transcript
          </Button>
        )}
      </div>
    );
  };

  if (!embedUrl) {
    // Still allow scraping even if embed fails - show a placeholder
    return (
      <div className="relative h-full w-full">
        <div className="flex items-center justify-center h-full bg-muted">
          <div className="text-center p-4">
            <div className="text-lg font-semibold mb-2">📺 YouTube Content</div>
            <div className="text-sm text-muted-foreground mb-4">
              URL: {url.length > 50 ? url.substring(0, 50) + '...' : url}
            </div>
            <div className="text-xs text-muted-foreground">
              Channel/Playlist URLs can't be embedded, but content can still be scraped for AI analysis.
            </div>
          </div>
        </div>
        {renderScrapingStatus()}
        {item?.scrapedData?.transcript && (
          <div className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 max-h-40 overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm flex-1">
                {item.scrapedData.title}
              </h4>
            </div>
            
            <div className="flex gap-4 text-xs text-muted-foreground mb-2">
              {item.scrapedData.viewCount && (
                <span>👀 {(item.scrapedData.viewCount / 1000).toFixed(1)}K views</span>
              )}
              {item.scrapedData.likes && (
                <span>👍 {(item.scrapedData.likes / 1000).toFixed(1)}K</span>
              )}
              {item.scrapedData.channelSubscribers && (
                <span>👥 {(item.scrapedData.channelSubscribers / 1000).toFixed(1)}K subs</span>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2">
              📝 {item.scrapedData.transcript.substring(0, 150)}...
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <iframe
        className="h-full w-full"
        src={embedUrl}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      
      {renderScrapingStatus()}

      {/* Enhanced Video Info Preview */}
      {item?.scrapedData?.transcript && (
        <div className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 max-h-40 overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm flex-1">
              {item.scrapedData.title}
            </h4>
          </div>
          
          <div className="flex gap-4 text-xs text-muted-foreground mb-2">
            {item.scrapedData.viewCount && (
              <span>👀 {(item.scrapedData.viewCount / 1000).toFixed(1)}K views</span>
            )}
            {item.scrapedData.likes && (
              <span>👍 {(item.scrapedData.likes / 1000).toFixed(1)}K</span>
            )}
            {item.scrapedData.channelSubscribers && (
              <span>👥 {(item.scrapedData.channelSubscribers / 1000).toFixed(1)}K subs</span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            📝 {item.scrapedData.transcript.substring(0, 150)}...
          </p>
        </div>
      )}
    </div>
  );
}
