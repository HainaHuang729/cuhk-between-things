export const CUHK_EMAIL_DOMAINS = ["link.cuhk.edu.hk", "cuhk.edu.hk"] as const;

export function isCuhkEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return CUHK_EMAIL_DOMAINS.some((domain) => normalized.endsWith(`@${domain}`));
}

export const itemCategories = [
  { value: "electronics", label: "电子产品" },
  { value: "furniture", label: "家具" },
  { value: "dorm", label: "宿舍用品" },
  { value: "kitchen", label: "厨房用品" },
  { value: "textbook", label: "教材" },
  { value: "clothing", label: "衣物" },
  { value: "sports", label: "运动用品" },
  { value: "other", label: "其他" }
] as const;

export const colleges = [
  { value: "chung_chi", label: "崇基" },
  { value: "new_asia", label: "新亚" },
  { value: "united", label: "联合" },
  { value: "shaw", label: "逸夫" },
  { value: "morningside", label: "晨兴" },
  { value: "s_h_ho", label: "善衡" },
  { value: "cw_chu", label: "敬文" },
  { value: "wu_yee_sun", label: "伍宜孙" },
  { value: "lee_woo_sing", label: "和声" },
  { value: "postgraduate", label: "研究生" },
  { value: "other", label: "其他" }
] as const;

export const dormitories = ["23座", "39座", "56座", "研究生宿舍", "其他"] as const;

export const itemStatusLabels = {
  available: "在售",
  reserved: "已预订",
  sold: "已售出",
  off_shelf: "已下架"
} as const;

export const groupStatusLabels = {
  recruiting: "招募中",
  formed: "已成团",
  closed: "已截止",
  cancelled: "已取消"
} as const;
