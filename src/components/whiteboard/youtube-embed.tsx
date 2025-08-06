import * as React from 'react';

interface YoutubeEmbedProps {
  url: string;
}

export function YoutubeEmbed({ url }: YoutubeEmbedProps) {
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
        if (pathname.startsWith('/user/') || pathname.startsWith('/c/') || pathname.startsWith('/channel/')) {
           // This is a simple approximation. For custom user URLs, a lookup would be needed.
           const channelPath = pathname.split('/')[2];
           return `https://www.youtube.com/embed/videoseries?list=UU${channelPath.substring(2)}`;
        }
      }
    } catch (error) {
      console.error("Invalid URL:", error);
      return null;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    return <div className="p-4 text-destructive">Invalid or unsupported YouTube URL</div>;
  }

  return (
    <iframe
      className="h-full w-full"
      src={embedUrl}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
}
