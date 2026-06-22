import type { FeedGroup, FeedItem } from "@/lib/types";

export const mockItems: FeedItem[] = [
  {
    id: "mock-item-1",
    title: "Dell 27寸显示器",
    description: "状态良好，含 HDMI 线，适合宿舍桌面使用。",
    price: 500,
    category: "electronics",
    condition: "good",
    dormitory: "56座",
    college: "wu_yee_sun",
    handover_location: "伍宜孙56座大堂",
    status: "available",
    cover_image_url: "",
    created_at: "2026-06-22T08:00:00Z"
  },
  {
    id: "mock-item-2",
    title: "IKEA椅子",
    description: "搬宿出，轻微使用痕迹。",
    price: 80,
    category: "furniture",
    condition: "usable",
    dormitory: "23座",
    college: "chung_chi",
    handover_location: "23座门口",
    status: "available",
    cover_image_url: "",
    created_at: "2026-06-22T07:30:00Z"
  }
];

export const mockGroups: FeedGroup[] = [
  {
    id: "mock-group-1",
    title: "Costco纸巾拼团",
    description: "凑一箱纸巾，到货后在宿舍楼下分。",
    source_platform: "Costco",
    total_price: 300,
    per_person_price: 50,
    target_size: 6,
    current_size: 4,
    deadline_at: "2026-06-22T16:00:00Z",
    dormitory: "56座",
    college: "wu_yee_sun",
    handover_location: "伍宜孙56座大堂",
    status: "recruiting",
    created_at: "2026-06-22T06:00:00Z"
  }
];
