import Link from "next/link";

import { groupStatusLabels } from "@/lib/constants";
import type { FeedGroup } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export function GroupCard({ group }: { group: FeedGroup }) {
  const deadline = new Intl.DateTimeFormat("zh-HK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(group.deadline_at));

  return (
    <Link className="groupCard" href={`/groups/${group.id}`}>
      <div className="cardTopline">
        <h3>{group.title}</h3>
        <StatusBadge
          label={groupStatusLabels[group.status]}
          tone={group.status === "recruiting" ? "amber" : "gray"}
        />
      </div>
      <p className="groupProgress">
        当前 {group.current_size}/{group.target_size}
      </p>
      <p className="meta">
        {group.source_platform} · {deadline} · {group.dormitory}
      </p>
    </Link>
  );
}
