type FeedTabsProps = {
  active?: "all" | "items" | "groups";
};

export function FeedTabs({ active = "all" }: FeedTabsProps) {
  const tabs = [
    { key: "all", label: "全部" },
    { key: "items", label: "二手" },
    { key: "groups", label: "拼团" }
  ] as const;

  return (
    <div className="segmented" role="tablist" aria-label="内容类型">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={active === tab.key ? "isActive" : ""}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
