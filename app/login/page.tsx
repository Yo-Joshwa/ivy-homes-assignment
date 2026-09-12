import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="eyebrow">IVY HOMES</div>
        <h1>Property explorer</h1>
        <p className="muted">Sign in with one of the assigned demo accounts.</p>
        <LoginForm />
      </section>
    </main>
  );
}