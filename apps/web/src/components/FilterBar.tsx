import { SlidersHorizontal } from "lucide-react";

export function FilterBar() {
  return (
    <div className="filterBar" aria-label="筛选">
      <button type="button">
        <SlidersHorizontal aria-hidden="true" size={15} />
        宿舍
      </button>
      <button type="button">书院</button>
      <button type="button">分类</button>
      <button type="button">最新发布</button>
    </div>
  );
}
