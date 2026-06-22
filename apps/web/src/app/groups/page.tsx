import Link from "next/link";

import { GroupCard } from "@/components/GroupCard";
import { SearchBar } from "@/components/SearchBar";
import { mockGroups } from "@/lib/mock";

export default function GroupsPage() {
  return (
    <main className="shell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
        <Link className="primaryButton" href="/groups/new">
          发起拼团
        </Link>
      </nav>
      <SearchBar />
      <section className="sectionHeader">
        <h1>拼团</h1>
      </section>
      <div className="listStack">
        {mockGroups.map((group) => (
          <GroupCard group={group} key={group.id} />
        ))}
      </div>
    </main>
  );
}
