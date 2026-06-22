import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <form className="searchBar">
      <Search aria-hidden="true" size={18} />
      <input
        name="q"
        placeholder="搜索商品、拼团、宿舍"
        type="search"
        aria-label="搜索"
      />
    </form>
  );
}
