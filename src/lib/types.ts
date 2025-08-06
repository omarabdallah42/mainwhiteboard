export type WindowType = 'youtube' | 'doc' | 'url' | 'social' | 'ai';

export type WindowItem = {
  id: string;
  title: string;
  type: WindowType;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isAttached: boolean;
  zIndex: number;
};
