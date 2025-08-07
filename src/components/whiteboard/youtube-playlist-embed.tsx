import * as React from 'react';
import type { WindowItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Download, AlertCircle, CheckCircle2, Play, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YoutubePlaylistEmbedProps {
  url: string;
  item?: WindowItem;
  onUpdate?: (item: WindowItem) => void;
}

interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  url: string;
}

export function YoutubePlaylistEmbed({ url, item, onUpdate }: YoutubePlaylistEmbedProps) {
  const [isScrapingPlaylist, setIsScrapingPlaylist] = React.useState(false);
  const [playlistVideos, setPlaylistVideos] = React.useState<PlaylistVideo[]>([]);

  const extractPlaylistId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('list');
    } catch {
      return null;
    }
  };

  const handleScrapePlaylist = async () => {
    if (!item || !onUpdate) return;
    
    setIsScrapingPlaylist(true);
    
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
          url,
          type: 'playlist'
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Update the item with scraped playlist data
        onUpdate({
          ...item,
          title: result.data.title || 'YouTube Playlist',
          scrapingStatus: 'success',
          scrapedData: {
            ...result.data,
            scrapedAt: new Date().toISOString(),
          },
        });

        // Extract playlist videos for grid display
        if (result.data.videos && Array.isArray(result.data.videos)) {
          setPlaylistVideos(result.data.videos.slice(0, 12)); // Show first 12 videos
        }
      } else {
        onUpdate({
          ...item,
          scrapingStatus: 'error',
        });
      }
    } catch (error) {
      console.error('Playlist scraping error:', error);
      onUpdate({
        ...item,
        scrapingStatus: 'error',
      });
    } finally {
      setIsScrapingPlaylist(false);
    }
  };

  const renderScrapingStatus = () => {
    const status = item?.scrapingStatus;
    
    if (status === 'loading' || isScrapingPlaylist) {
      return (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing playlist...</span>
          </div>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready for AI</span>
          </div>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Analysis failed</span>
          </div>
        </div>
      );
    }

    // Show scrape button if no analysis yet
    return (
      <Button
        className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm"
        size="sm"
        onClick={handleScrapePlaylist}
        disabled={isScrapingPlaylist}
      >
        {isScrapingPlaylist ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Analyze Playlist
      </Button>
    );
  };

  const playlistId = extractPlaylistId(url);
  const embedUrl = playlistId ? `https://www.youtube.com/embed/videoseries?list=${playlistId}` : null;

  return (
    <div className="relative h-full w-full">
      {/* Main playlist embed at top */}
      {embedUrl && (
        <div className="h-1/2 w-full mb-2">
          <iframe
            className="h-full w-full rounded-lg"
            src={embedUrl}
            title="YouTube playlist player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* Video grid below */}
      <div className="h-1/2 overflow-y-auto">
        {playlistVideos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 p-2">
            {playlistVideos.map((video, index) => (
              <div
                key={video.id || index}
                className="bg-muted rounded-lg overflow-hidden hover:bg-muted/80 transition-colors cursor-pointer group"
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {video.duration}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h4 className="text-xs font-medium line-clamp-2 mb-1">
                    {video.title}
                  </h4>
                  {video.views && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{(video.views / 1000).toFixed(1)}K views</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">📺 YouTube Playlist</div>
              <div className="text-sm mb-4">
                {url.length > 50 ? url.substring(0, 50) + '...' : url}
              </div>
              <div className="text-xs">
                Click "Analyze Playlist" to see videos and enable AI analysis
              </div>
            </div>
          </div>
        )}
      </div>

      {renderScrapingStatus()}

      {/* Playlist info preview */}
      {item?.scrapedData?.transcript && (
        <div className="absolute bottom-2 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 max-h-32 overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm">
              📋 {item.scrapedData.title}
            </h4>
          </div>
          
          <div className="flex gap-4 text-xs text-muted-foreground mb-2">
            {item.scrapedData.viewCount && (
              <span>👀 {(item.scrapedData.viewCount / 1000).toFixed(1)}K total views</span>
            )}
            {playlistVideos.length > 0 && (
              <span>🎬 {playlistVideos.length} videos</span>
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
