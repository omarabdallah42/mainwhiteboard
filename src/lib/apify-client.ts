'use client';

/**
 * Apify API client for scraping YouTube content
 */

interface ApifyConfig {
  apiToken: string;
  baseUrl?: string;
}

interface YouTubeScrapingInput {
  videoUrls: string[];
  language?: string;
  format?: string;
}

interface YouTubeTranscriptResult {
  url: string;
  title: string;
  author: string;
  duration: string;
  transcript: string;
  timestamps?: Array<{
    start: number;
    duration: number;
    text: string;
  }>;
  thumbnails: string[];
  status: 'success' | 'failed';
  error?: string;
}

export class ApifyClient {
  private config: ApifyConfig;

  constructor(config: ApifyConfig) {
    this.config = {
      baseUrl: 'https://api.apify.com/v2',
      ...config,
    };
  }

  /**
   * Scrape YouTube video transcript using Apify actor
   */
  async scrapeYouTubeTranscript(videoUrls: string[]): Promise<YouTubeTranscriptResult[]> {
    const actorId = 'lume/yt-transcripts'; // Using the YouTube Transcripts Extractor

    const input: YouTubeScrapingInput = {
      videoUrls,
      language: 'en', // Default to English
      format: 'json',
    };

    try {
      // Start the actor run
      const runResponse = await fetch(
        `${this.config.baseUrl}/acts/${actorId}/runs?token=${this.config.apiToken}`,
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

      // Poll for completion
      const results = await this.pollForResults(runId);
      return this.processTranscriptResults(results, videoUrls);
    } catch (error) {
      console.error('Error scraping YouTube transcript:', error);
      return videoUrls.map(url => ({
        url,
        title: 'Failed to load',
        author: '',
        duration: '',
        transcript: 'Failed to load transcript. Please try again later.',
        thumbnails: [],
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  /**
   * Poll Apify run until completion
   */
  private async pollForResults(runId: string, maxAttempts = 30): Promise<any[]> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Check run status
        const statusResponse = await fetch(
          `${this.config.baseUrl}/actor-runs/${runId}?token=${this.config.apiToken}`
        );

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (status === 'SUCCEEDED') {
          // Get results from dataset
          const resultsResponse = await fetch(
            `${this.config.baseUrl}/actor-runs/${runId}/dataset/items?token=${this.config.apiToken}`
          );

          if (!resultsResponse.ok) {
            throw new Error(`Failed to get results: ${resultsResponse.statusText}`);
          }

          return await resultsResponse.json();
        }

        if (status === 'FAILED' || status === 'ABORTED') {
          throw new Error(`Actor run ${status.toLowerCase()}`);
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Timeout waiting for Apify actor to complete');
  }

  /**
   * Process and format transcript results
   */
  private processTranscriptResults(rawResults: any[], originalUrls: string[]): YouTubeTranscriptResult[] {
    return originalUrls.map(url => {
      // Find result for this URL
      const result = rawResults.find(r => r.url === url || r.videoUrl === url);

      if (!result) {
        return {
          url,
          title: 'Not found',
          author: '',
          duration: '',
          transcript: 'Transcript not available for this video.',
          thumbnails: [],
          status: 'failed',
          error: 'Video not found in results',
        };
      }

      return {
        url: result.url || url,
        title: result.title || 'Untitled',
        author: result.author || result.channelName || 'Unknown',
        duration: result.duration || '',
        transcript: this.formatTranscript(result.transcript || result.subtitles),
        timestamps: result.timestamps,
        thumbnails: result.thumbnails || [],
        status: 'success',
      };
    });
  }

  /**
   * Format transcript text for better readability
   */
  private formatTranscript(transcript: any): string {
    if (!transcript) return 'No transcript available.';

    // Handle different transcript formats
    if (typeof transcript === 'string') {
      return transcript;
    }

    if (Array.isArray(transcript)) {
      // Format timestamped transcript
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

    return JSON.stringify(transcript);
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  static extractVideoId(url: string): string | null {
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

  /**
   * Validate YouTube URL
   */
  static isValidYouTubeUrl(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }
}

// Export default instance (will be configured with API key)
export const apifyClient = new ApifyClient({
  apiToken: process.env.NEXT_PUBLIC_APIFY_API_KEY || '',
});
