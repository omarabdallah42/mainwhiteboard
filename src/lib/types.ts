export type WindowType = 'youtube' | 'youtube-playlist' | 'doc' | 'url' | 'social' | 'ai' | 'image' | 'tiktok' | 'instagram';

export type ConnectionType = 
  | 'flow' 
  | 'dependency' 
  | 'association' 
  | 'inheritance' 
  | 'composition' 
  | 'aggregation'
  | 'communication'
  | 'reference';

export type ConnectionStyle = {
  color: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  arrowType: 'none' | 'arrow' | 'diamond' | 'circle' | 'square';
  animated?: boolean;
};

export type Connection = {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  label?: string;
  description?: string;
  style?: Partial<ConnectionStyle>;
  bidirectional?: boolean;
  strength?: number; // 1-5 scale
  metadata?: Record<string, any>;
  created: number;
  updated: number;
};

export type ConnectionPoint = {
  itemId: string;
  side: 'top' | 'right' | 'bottom' | 'left';
  offset?: number; // 0-1 position along the side
};

export type WindowItem = {
  id: string;
  title: string;
  type: WindowType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isAttached: boolean;
  zIndex: number;
  connections: Connection[];
  isSelected?: boolean;
  isLocked?: boolean;
  groupId?: string;
  // Content scraping data
  scrapingStatus?: 'idle' | 'loading' | 'success' | 'error';
  scrapedData?: {
    title?: string;
    author?: string;
    duration?: string;
    transcript?: string;
    thumbnails?: string[];
    videoId?: string;
    scrapedAt?: string;
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
};

export type SelectionBox = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type HistoryAction = {
  type: 'add' | 'update' | 'delete' | 'move' | 'resize' | 'connect' | 'disconnect';
  items: WindowItem[];
  connections?: Connection[];
  timestamp: number;
};

export type ConnectionTemplate = {
  id: string;
  name: string;
  description: string;
  pattern: {
    type: 'linear' | 'hub' | 'tree' | 'mesh' | 'custom';
    connectionType: ConnectionType;
    bidirectional?: boolean;
  };
};

export type LayoutAlgorithm = 'force' | 'tree' | 'circular' | 'grid' | 'hierarchical';
