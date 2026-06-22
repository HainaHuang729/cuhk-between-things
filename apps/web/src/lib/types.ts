export type ItemStatus = "available" | "reserved" | "sold" | "off_shelf";
export type GroupStatus = "recruiting" | "formed" | "closed" | "cancelled";

export type FeedItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  dormitory: string;
  college: string;
  handover_location: string;
  status: ItemStatus;
  cover_image_url?: string;
  created_at: string;
};

export type FeedGroup = {
  id: string;
  title: string;
  description: string;
  source_platform: string;
  total_price?: number;
  per_person_price?: number;
  target_size: number;
  current_size: number;
  deadline_at: string;
  dormitory: string;
  college: string;
  handover_location: string;
  status: GroupStatus;
  created_at: string;
};

export type ApiError = {
  error: string;
};
