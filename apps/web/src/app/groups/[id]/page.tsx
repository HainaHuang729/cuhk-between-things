import Link from "next/link";
import { Copy, Flag, Share2 } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { groupStatusLabels } from "@/lib/constants";
import { mockGroups } from "@/lib/mock";

type GroupDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ authed?: string }>;
};

export default async function GroupDetailPage({
  params,
  searchParams
}: GroupDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const group =
    mockGroups.find((entry) => entry.id === resolvedParams.id) ?? mockGroups[0];
  const isAuthed = resolvedSearchParams?.authed === "1";
  const deadline = new Intl.DateTimeFormat("zh-HK", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(group.deadline_at));

  return (
    <main className="detailShell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
        <button type="button" className="ghostButton">
          <Share2 aria-hidden="true" size={16} />
          分享
        </button>
      </nav>

      <section className="detailBlock">
        <div className="cardTopline">
          <h1>{group.title}</h1>
          <StatusBadge
            label={groupStatusLabels[group.status]}
            tone={group.status === "recruiting" ? "amber" : "gray"}
          />
        </div>
        <p className="groupProgress">
          当前 {group.current_size} / 目标 {group.target_size}
        </p>
        <p className="meta">截止：{deadline}</p>
      </section>

      <section className="detailBlock">
        <h2>拼团信息</h2>
        <dl className="factGrid">
          <div>
            <dt>来源</dt>
            <dd>{group.source_platform}</dd>
          </div>
          <div>
            <dt>总价</dt>
            <dd>{group.total_price ? `HKD ${group.total_price}` : "待定"}</dd>
          </div>
          <div>
            <dt>人均</dt>
            <dd>
              {group.per_person_price ? `HKD ${group.per_person_price}` : "待定"}
            </dd>
          </div>
          <div>
            <dt>交收</dt>
            <dd>{group.handover_location}</dd>
          </div>
        </dl>
      </section>

      <section className="detailBlock">
        <h2>描述</h2>
        <p>{group.description}</p>
      </section>

      <button type="button" className="primaryButton wide">
        加入拼团
      </button>

      <section className="detailBlock">
        <h2>联系团长</h2>
        {isAuthed ? (
          <div className="contactBox">
            <p>微信号 cuhk_leader</p>
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

      <Link className="reportLink" href={`/report?target_type=group&target_id=${group.id}`}>
        <Flag aria-hidden="true" size={15} />
        举报
      </Link>
    </main>
  );
}
