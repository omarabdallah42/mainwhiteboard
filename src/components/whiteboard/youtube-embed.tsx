import * as React from 'react';

interface YoutubeEmbedProps {
  url: string;
}

export function YoutubeEmbed({ url }: YoutubeEmbedProps) {
  const getYouTubeId = (url: string) => {
    let ID = '';
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      ID = urlObj.pathname.slice(1);
    } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      ID = urlObj.searchParams.get('v') || '';
    }
    return ID;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) {
    return <div className="p-4 text-destructive">Invalid YouTube URL</div>;
  }

  return (
    <iframe
      className="h-full w-full"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
}
