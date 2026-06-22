import Link from "next/link";

export default function NewGroupPage() {
  return (
    <main className="detailShell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
      </nav>
      <section className="detailBlock">
        <h1>发起拼团</h1>
        <form className="formStack">
          <label>
            标题
            <input name="title" placeholder="例如 Costco纸巾拼团" />
          </label>
          <label>
            来源平台
            <input name="source_platform" placeholder="Costco / IKEA / 淘宝" />
          </label>
          <label>
            目标人数
            <input name="target_size" inputMode="numeric" placeholder="至少 2 人" />
          </label>
          <label>
            截止时间
            <input name="deadline_at" type="datetime-local" />
          </label>
          <label>
            描述
            <textarea name="description" rows={5} />
          </label>
          <label>
            交收地点
            <input name="handover_location" placeholder="例如 伍宜孙56座大堂" />
          </label>
          <button type="button" className="primaryButton wide">
            提交
          </button>
        </form>
      </section>
    </main>
  );
}
