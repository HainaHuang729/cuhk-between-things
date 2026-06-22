import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="detailShell">
      <nav className="detailNav">
        <Link href="/">返回</Link>
      </nav>
      <section className="detailBlock">
        <h1>CUHK 邮箱登录</h1>
        <form className="formStack">
          <label>
            邮箱
            <input name="email" placeholder="name@link.cuhk.edu.hk" type="email" />
          </label>
          <button type="button" className="primaryButton wide">
            发送验证码
          </button>
          <label>
            验证码
            <input name="token" inputMode="numeric" placeholder="邮箱验证码" />
          </label>
          <button type="button" className="primaryButton wide">
            登录
          </button>
        </form>
      </section>
    </main>
  );
}
