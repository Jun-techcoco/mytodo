"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import TodoApp from "@/components/TodoApp";

export default function Home() {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>불러오는 중...</div>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Cormorant Garamond', serif;
            font-style: italic;
            font-size: 20px;
            color: rgba(42, 38, 32, 0.5);
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="masthead-title">업무 노트</div>
          <div className="masthead-sub">Work · Ledger</div>

          {sent ? (
            <div className="sent-msg">
              <div className="sent-quote">📬 메일을 확인하세요</div>
              <div className="sent-sub">
                {email} 으로 로그인 링크를 보냈어요.
                <br />
                메일에서 링크를 클릭하면 자동으로 로그인됩니다.
              </div>
            </div>
          ) : (
            <form onSubmit={sendMagicLink} className="login-form">
              <p className="login-desc">
                이메일을 입력하면 로그인 링크를 보내드려요.
                <br />
                비밀번호는 필요 없어요.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
              <button type="submit" disabled={sending || !email.trim()}>
                {sending ? "보내는 중..." : "로그인 링크 받기"}
              </button>
              {error && <div className="error">{error}</div>}
            </form>
          )}
        </div>

        <style jsx>{`
          .login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .login-card {
            max-width: 420px;
            width: 100%;
            padding: 48px 40px;
            border-top: 3px double #2a2620;
            border-bottom: 1px solid #2a2620;
          }
          .masthead-title {
            font-family: 'Cormorant Garamond', serif;
            font-style: italic;
            font-size: 42px;
            font-weight: 600;
            line-height: 1;
            margin-bottom: 4px;
            text-align: center;
          }
          .masthead-sub {
            font-family: 'Cormorant Garamond', serif;
            font-size: 13px;
            letter-spacing: 3px;
            text-transform: uppercase;
            opacity: 0.7;
            text-align: center;
            margin-bottom: 36px;
          }
          .login-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .login-desc {
            font-size: 15px;
            line-height: 1.6;
            color: rgba(42, 38, 32, 0.7);
            margin: 0 0 12px;
            text-align: center;
          }
          .login-form input {
            background: transparent;
            border: none;
            border-bottom: 1px solid #2a2620;
            outline: none;
            font-size: 17px;
            padding: 10px 4px;
            color: #2a2620;
          }
          .login-form input::placeholder {
            color: rgba(42, 38, 32, 0.3);
            font-style: italic;
          }
          .login-form button {
            background: #2a2620;
            color: #f5f1e8;
            border: none;
            padding: 12px;
            font-family: 'Cormorant Garamond', serif;
            font-style: italic;
            font-size: 17px;
            letter-spacing: 1px;
            cursor: pointer;
            margin-top: 8px;
            transition: background 0.2s;
          }
          .login-form button:hover { background: #4a3f2f; }
          .login-form button:disabled { opacity: 0.4; cursor: not-allowed; }
          .error {
            color: #8b4a3a;
            font-size: 14px;
            text-align: center;
            margin-top: 8px;
          }
          .sent-msg { text-align: center; padding: 16px 0; }
          .sent-quote {
            font-family: 'Cormorant Garamond', serif;
            font-style: italic;
            font-size: 22px;
            margin-bottom: 12px;
          }
          .sent-sub {
            font-size: 14px;
            line-height: 1.6;
            color: rgba(42, 38, 32, 0.7);
          }
        `}</style>
      </div>
    );
  }

  return <TodoApp supabase={supabase} session={session} />;
}
