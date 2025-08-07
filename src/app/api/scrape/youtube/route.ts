import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for scraping YouTube content via Apify
 */

interface ScrapingRequest {
  url: string;
  type: 'video' | 'playlist' | 'channel';
}

interface ScrapingResponse {
  success: boolean;
  data?: {
    title: string;
    author: string;
    duration: string;
    transcript: string;
    thumbnails: string[];
    videoId: string;
    // Enhanced data from streamers/youtube-scraper
    viewCount?: number;
    likes?: number;
    commentsCount?: number;
    channelUrl?: string;
    channelSubscribers?: number;
    uploadDate?: string;
    description?: string;
    tags?: string[];
    // Playlist-specific data
    videos?: Array<{
      id: string;
      title: string;
      thumbnail: string;
      duration: string;
      views: number;
      url: string;
    }>;
    totalDuration?: string;
    videoCount?: number;
  };
  error?: string;
  jobId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url, type = 'video' }: ScrapingRequest = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const apifyApiKey = process.env.APIFY_API_KEY;
    if (!apifyApiKey) {
      return NextResponse.json(
        { success: false, error: 'Apify API key not configured' },
        { status: 500 }
      );
    }

    // Start scraping job
    const result = await scrapeYouTubeContent(url, type, apifyApiKey);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('YouTube scraping error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

async function scrapeYouTubeContent(
  url: string,
  type: 'video' | 'playlist' | 'channel',
  apiKey: string
): Promise<ScrapingResponse> {
  const actorId = 'streamers/youtube-scraper'; // Comprehensive YouTube Scraper

  const input = {
    startUrls: [url], // Fix: should be array of strings, not objects
    maxResults: 10, // Increase for better results
    proxyConfiguration: {
      useApifyProxy: true,
    },
  };

  try {
    // Start the actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Failed to start Apify actor: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // For immediate response, return job ID and let client poll
    // Or wait for quick results (30 seconds max)
    const results = await pollForResults(runId, apiKey, 15); // 15 attempts = ~30 seconds
    
    if (results.length === 0) {
      return {
        success: false,
        error: 'No transcript found for this video',
      };
    }

    const result = results[0];
    const videoId = extractVideoId(url);

    // Check if it's a playlist result
    const isPlaylist = type === 'playlist' || url.includes('playlist?list=');
    
    if (isPlaylist && Array.isArray(results)) {
      // Handle playlist data
      const playlistVideos = results.slice(0, 20).map((video: any, index: number) => ({
        id: video.id || `video-${index}`,
        title: video.title || `Video ${index + 1}`,
        thumbnail: video.thumbnailUrl || video.thumbnail || '',
        duration: video.duration || '',
        views: video.viewCount || video.views || 0,
        url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
      }));
      
      // Combine all transcripts/descriptions for AI analysis
      const combinedTranscript = results
        .map((video: any) => `Video: "${video.title}"\n${formatTranscript(video.subtitles || video.text || video.description || '')}`)
        .join('\n\n---\n\n');
      
      return {
        success: true,
        data: {
          title: result.title || 'YouTube Playlist',
          author: result.channelName || 'Unknown Creator',
          duration: '', // Not applicable for playlists
          transcript: combinedTranscript,
          thumbnails: [result.thumbnailUrl].filter(Boolean),
          videoId: '', // Not applicable for playlists
          // Playlist-specific data
          videos: playlistVideos,
          totalDuration: calculateTotalDuration(playlistVideos),
          videoCount: playlistVideos.length,
          // Enhanced data
          viewCount: playlistVideos.reduce((sum, video) => sum + (video.views || 0), 0),
          likes: result.likes || result.likeCount || 0,
          commentsCount: result.commentsCount || result.commentCount || 0,
          channelUrl: result.channelUrl || '',
          channelSubscribers: result.numberOfSubscribers || result.subscriberCount || 0,
          uploadDate: result.date || result.publishedAt || result.uploadDate || '',
          description: result.text || result.description || '',
          tags: result.tags || [],
        },
      };
    }

    return {
      success: true,
      data: {
        title: result.title || 'Untitled Video',
        author: result.channelName || 'Unknown Creator',
        duration: result.duration || '',
        transcript: formatTranscript(result.subtitles || result.text),
        thumbnails: result.thumbnails || [result.thumbnailUrl].filter(Boolean),
        videoId: videoId || result.id || '',
        // Additional rich data from streamers/youtube-scraper
        viewCount: result.viewCount || 0,
        likes: result.likes || 0,
        commentsCount: result.commentsCount || 0,
        channelUrl: result.channelUrl || '',
        channelSubscribers: result.numberOfSubscribers || 0,
        uploadDate: result.date || '',
        description: result.text || '',
        tags: result.tags || [],
      },
    };
  } catch (error) {
    console.error('Apify scraping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed',
    };
  }
}

async function pollForResults(runId: string, apiKey: string, maxAttempts = 15): Promise<any[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Check run status
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${apiKey}`
      );

      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        // Get results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apiKey}`
        );

        if (!resultsResponse.ok) {
          throw new Error(`Failed to get results: ${resultsResponse.statusText}`);
        }

        return await resultsResponse.json();
      }

      if (status === 'FAILED' || status === 'ABORTED') {
        throw new Error(`Actor run ${status.toLowerCase()}`);
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Timeout waiting for scraping to complete');
}

function formatTranscript(transcript: any): string {
  if (!transcript) return 'No transcript available.';

  if (typeof transcript === 'string') {
    return transcript;
  }

  if (Array.isArray(transcript)) {
    return transcript
      .map(item => {
        if (typeof item === 'string') return item;
        if (item.text) return item.text;
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }

  if (transcript.text) {
    return transcript.text;
  }

  return 'Transcript format not supported.';
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}



function calculateTotalDuration(videos: Array<{ duration: string }>): string {
  let totalSeconds = 0;
  
  videos.forEach(video => {
    if (video.duration) {
      // Parse duration in format "HH:MM:SS" or "MM:SS"
      const parts = video.duration.split(':').map(part => parseInt(part, 10));
      if (parts.length === 3) {
        // HH:MM:SS
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        // MM:SS
        totalSeconds += parts[0] * 60 + parts[1];
      }
    }
  });
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
