import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcbspeakxabfrjcavuhi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjYnNwZWFreGFiZnJqY2F2dWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDY0MzUsImV4cCI6MjA3MDEyMjQzNX0.KFEHEkP8ibkbMZbkWYY_lHD5f_NiL9GPS-ohiOqkTGQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export type User = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Whiteboard = {
  id: string;
  user_id: string;
  name: string;
  data: any; // This will store the whiteboard state
  created_at: string;
  updated_at: string;
};

export type WindowItem = {
  id: string;
  whiteboard_id: string;
  type: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  is_attached: boolean;
  z_index: number;
  connections: { from: string; to: string }[];
  created_at: string;
  updated_at: string;
};
