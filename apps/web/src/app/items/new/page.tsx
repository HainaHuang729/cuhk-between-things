import Link from "next/link";

export default function NewItemPage() {
  return (
    <main className="detailShell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
      </nav>
      <section className="detailBlock">
        <h1>发布商品</h1>
        <form className="formStack">
          <label>
            标题
            <input name="title" placeholder="例如 Dell 27寸显示器" />
          </label>
          <label>
            价格
            <input name="price" inputMode="decimal" placeholder="HKD" />
          </label>
          <label>
            分类
            <select name="category" defaultValue="electronics">
              <option value="electronics">电子产品</option>
              <option value="furniture">家具</option>
              <option value="dorm">宿舍用品</option>
              <option value="kitchen">厨房用品</option>
              <option value="textbook">教材</option>
              <option value="clothing">衣物</option>
              <option value="sports">运动用品</option>
              <option value="other">其他</option>
            </select>
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
