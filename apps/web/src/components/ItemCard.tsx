import Link from "next/link";

import { itemStatusLabels } from "@/lib/constants";
import type { FeedItem } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export function ItemCard({ item }: { item: FeedItem }) {
  return (
    <Link className="itemCard" href={`/items/${item.id}`}>
      <div className="thumb" aria-hidden="true">
        {item.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover_image_url} alt="" />
        ) : (
          <span>{item.category}</span>
        )}
      </div>
      <div className="cardMain">
        <div className="cardTopline">
          <h3>{item.title}</h3>
          <StatusBadge
            label={itemStatusLabels[item.status]}
            tone={item.status === "available" ? "green" : "gray"}
          />
        </div>
        <p className="price">HKD {item.price}</p>
        <p className="meta">
          {item.dormitory} · {item.handover_location}
        </p>
      </div>
    </Link>
  );
}
