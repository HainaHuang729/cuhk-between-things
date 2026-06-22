import Link from "next/link";

const stats = [
  { label: "待处理举报", value: "12" },
  { label: "今日新增商品", value: "28" },
  { label: "招募中拼团", value: "9" },
  { label: "邮箱用户", value: "146" }
];

export default function AdminPage() {
  return (
    <main className="adminShell">
      <header className="topHeader">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>后台概览</h1>
        </div>
      </header>

      <div className="statGrid">
        {stats.map((stat) => (
          <section className="statCard" key={stat.label}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </section>
        ))}
      </div>

      <nav className="adminNav">
        <Link href="/admin/reports">举报管理</Link>
        <Link href="/admin/items">商品管理</Link>
        <Link href="/admin/groups">拼团管理</Link>
        <Link href="/admin/users">用户管理</Link>
      </nav>
    </main>
  );
}
