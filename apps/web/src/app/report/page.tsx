import Link from "next/link";

export default function ReportPage() {
  return (
    <main className="detailShell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
      </nav>
      <section className="detailBlock">
        <h1>举报</h1>
        <form className="formStack">
          <label>
            原因
            <select name="reason" defaultValue="scam">
              <option value="scam">诈骗</option>
              <option value="fake_item">虚假商品</option>
              <option value="harassment">骚扰</option>
              <option value="inappropriate">不当内容</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label>
            描述
            <textarea name="description" rows={5} />
          </label>
          <button type="button" className="primaryButton wide">
            提交举报
          </button>
        </form>
      </section>
    </main>
  );
}
