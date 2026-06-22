import Link from "next/link";

import { ItemCard } from "@/components/ItemCard";
import { SearchBar } from "@/components/SearchBar";
import { mockItems } from "@/lib/mock";

export default function ItemsPage() {
  return (
    <main className="shell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
        <Link className="primaryButton" href="/items/new">
          发布商品
        </Link>
      </nav>
      <SearchBar />
      <section className="sectionHeader">
        <h1>二手交易</h1>
      </section>
      <div className="listStack">
        {mockItems.map((item) => (
          <ItemCard item={item} key={item.id} />
        ))}
      </div>
    </main>
  );
}
