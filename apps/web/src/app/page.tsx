import Link from "next/link";
import { Plus } from "lucide-react";

import { FeedTabs } from "@/components/FeedTabs";
import { FilterBar } from "@/components/FilterBar";
import { GroupCard } from "@/components/GroupCard";
import { ItemCard } from "@/components/ItemCard";
import { SearchBar } from "@/components/SearchBar";
import { mockGroups, mockItems } from "@/lib/mock";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topHeader">
        <div>
          <p className="eyebrow">CUHK Marketplace</p>
          <h1>校园交易与资源共享社区</h1>
        </div>
        <Link className="iconButton primary" href="/items/new" aria-label="发布">
          <Plus aria-hidden="true" size={18} />
        </Link>
      </header>

      <SearchBar />
      <FeedTabs />
      <FilterBar />

      <section className="sectionHeader">
        <h2>最新商品</h2>
        <Link href="/items">查看全部</Link>
      </section>
      <div className="listStack">
        {mockItems.map((item) => (
          <ItemCard item={item} key={item.id} />
        ))}
      </div>

      <section className="sectionHeader">
        <h2>最新拼团</h2>
        <Link href="/groups">查看全部</Link>
      </section>
      <div className="listStack">
        {mockGroups.map((group) => (
          <GroupCard group={group} key={group.id} />
        ))}
      </div>
    </main>
  );
}
