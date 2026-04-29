import { signIn, signUp } from "@/app/auth/actions";

export function AuthForm({ message }: { message?: string }) {
  return (
    <div className="auth-grid">
      <form className="form-panel" action={signIn}>
        <div>
          <h2>Sign in</h2>
          <p>Continue an existing practice dashboard.</p>
        </div>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required minLength={6} />
        </label>
        <button className="primary-button" type="submit">
          Sign in
        </button>
      </form>

      <form className="form-panel" action={signUp}>
        <div>
          <h2>Create account</h2>
          <p>Start saving evaluations privately.</p>
        </div>
        <label>
          Display name
          <input name="displayName" type="text" autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" required minLength={6} />
        </label>
        <button className="primary-button secondary" type="submit">
          Create account
        </button>
      </form>

      {message ? <p className="form-message">{message}</p> : null}
    </div>
  );
}
