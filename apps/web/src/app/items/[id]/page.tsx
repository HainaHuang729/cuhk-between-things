import Link from "next/link";
import { Copy, Flag, Share2 } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { itemStatusLabels } from "@/lib/constants";
import { mockItems } from "@/lib/mock";

type ItemDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ authed?: string }>;
};

export default async function ItemDetailPage({
  params,
  searchParams
}: ItemDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const item =
    mockItems.find((entry) => entry.id === resolvedParams.id) ?? mockItems[0];
  const isAuthed = resolvedSearchParams?.authed === "1";

  return (
    <main className="detailShell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
        <button type="button" className="ghostButton">
          <Share2 aria-hidden="true" size={16} />
          分享
        </button>
      </nav>

      <div className="imageHero">
        {item.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover_image_url} alt={item.title} />
        ) : (
          <span>商品图片</span>
        )}
      </div>

      <section className="detailBlock">
        <div className="cardTopline">
          <h1>{item.title}</h1>
          <StatusBadge
            label={itemStatusLabels[item.status]}
            tone={item.status === "available" ? "green" : "gray"}
          />
        </div>
        <p className="detailPrice">HKD {item.price}</p>
        <p className="meta">
          {item.category} · {item.condition} · {item.dormitory} ·{" "}
          {item.handover_location}
        </p>
      </section>

      <section className="detailBlock">
        <h2>描述</h2>
        <p>{item.description}</p>
      </section>

      <section className="detailBlock">
        <h2>联系卖家</h2>
        {isAuthed ? (
          <div className="contactBox">
            <p>微信号 cuhk_alex</p>
            <button type="button" className="primaryButton">
              <Copy aria-hidden="true" size={16} />
              复制微信号
            </button>
          </div>
        ) : (
          <div className="contactBox">
            <p>登录后查看联系方式</p>
            <Link className="primaryButton" href="/login">
              CUHK邮箱登录
            </Link>
          </div>
        )}
      </section>

      <Link className="reportLink" href={`/report?target_type=item&target_id=${item.id}`}>
        <Flag aria-hidden="true" size={15} />
        举报
      </Link>
    </main>
  );
}
