"use client";

import { useEffect, useRef, useState } from "react";

export default function TodoApp({ supabase, session }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [reasonFor, setReasonFor] = useState(null);
  const [reasonText, setReasonText] = useState("");
  const [view, setView] = useState("active");
  const reasonInputRef = useRef(null);

  // Load tasks from Supabase
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.error("로드 실패:", error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (reasonFor && reasonInputRef.current) {
      reasonInputRef.current.focus();
    }
  }, [reasonFor]);

  const addTask = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const tempId = "temp-" + Date.now();
    const optimistic = {
      id: tempId,
      text,
      status: "active",
      created_at: new Date().toISOString(),
      user_id: session.user.id,
    };
    setTasks((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from("tasks")
      .insert({ text, user_id: session.user.id })
      .select()
      .single();
    if (error) {
      console.error(error);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      alert("저장에 실패했어요: " + error.message);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === tempId ? data : t)));
    }
  };

  const completeTask = async (id) => {
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(backup);
      alert("삭제 실패: " + error.message);
    }
  };

  const startParking = (id) => {
    setReasonFor(id);
    setReasonText("");
  };

  const confirmParking = async () => {
    const reason = reasonText.trim();
    if (!reason) return;
    const id = reasonFor;
    const parked_at = new Date().toISOString();
    const backup = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "parked", reason, parked_at } : t
      )
    );
    setReasonFor(null);
    setReasonText("");
    const { error } = await supabase
      .from("tasks")
      .update({ status: "parked", reason, parked_at })
      .eq("id", id);
    if (error) {
      setTasks(backup);
      alert("저장 실패: " + error.message);
    }
  };

  const cancelParking = () => {
    setReasonFor(null);
    setReasonText("");
  };

  const reactivate = async (id) => {
    const backup = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "active", reason: null, parked_at: null } : t
      )
    );
    const { error } = await supabase
      .from("tasks")
      .update({ status: "active", reason: null, parked_at: null })
      .eq("id", id);
    if (error) {
      setTasks(backup);
      alert("실패: " + error.message);
    }
  };

  const deleteParked = async (id) => {
    if (!confirm("이 항목을 영구 삭제할까요?")) return;
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(backup);
      alert("삭제 실패: " + error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}.${m}.${day}`;
  };

  const active = tasks.filter((t) => t.status === "active");
  const parked = tasks.filter((t) => t.status === "parked");

  return (
    <div className="page">
      <div className="grain" />

      <div className="container">
        <header className="masthead">
          <div className="masthead-title">업무 노트</div>
          <div className="masthead-right">
            <span className="user-email">{session.user.email}</span>
            <button className="signout" onClick={signOut}>
              로그아웃
            </button>
          </div>
        </header>

        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="떠오른 일을 적어보세요..."
          />
          <button
            className="add-btn"
            onClick={addTask}
            disabled={!input.trim()}
          >
            추가 +
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${view === "active" ? "active" : ""}`}
            onClick={() => setView("active")}
          >
            진행 중<span className="tab-count">{active.length}</span>
          </button>
          <button
            className={`tab ${view === "parked" ? "active" : ""}`}
            onClick={() => setView("parked")}
          >
            보류<span className="tab-count">{parked.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="empty">
            <div className="empty-quote">불러오는 중...</div>
          </div>
        ) : view === "active" ? (
          active.length === 0 ? (
            <div className="empty">
              <div className="empty-quote">텅 빈 페이지.</div>
              <div className="empty-sub">add an idea</div>
            </div>
          ) : (
            active.map((t, idx) => (
              <div key={t.id} className="task">
                <div className="task-num">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="task-body">
                  <div className="task-text">{t.text}</div>
                  <div className="task-meta">
                    added {formatDate(t.created_at)}
                  </div>
                  {reasonFor === t.id && (
                    <div className="reason-input-row">
                      <input
                        ref={reasonInputRef}
                        type="text"
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmParking();
                          if (e.key === "Escape") cancelParking();
                        }}
                        placeholder="왜 못 했나요?"
                      />
                      <button
                        className="mini-btn"
                        onClick={confirmParking}
                        disabled={!reasonText.trim()}
                      >
                        저장
                      </button>
                      <button className="mini-btn" onClick={cancelParking}>
                        취소
                      </button>
                    </div>
                  )}
                </div>
                {reasonFor !== t.id && (
                  <div className="task-actions">
                    <button
                      className="icon-btn done"
                      onClick={() => completeTask(t.id)}
                      title="완료"
                    >
                      ✓
                    </button>
                    <button
                      className="icon-btn park"
                      onClick={() => startParking(t.id)}
                      title="못 했음"
                    >
                      ✗
                    </button>
                  </div>
                )}
              </div>
            ))
          )
        ) : parked.length === 0 ? (
          <div className="empty">
            <div className="empty-quote">보류된 일이 없습니다.</div>
            <div className="empty-sub">nothing parked</div>
          </div>
        ) : (
          parked.map((t, idx) => (
            <div key={t.id} className="task">
              <div className="task-num">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="task-body">
                <div className="task-text">{t.text}</div>
                <div className="task-meta">
                  parked {formatDate(t.parked_at)}
                </div>
                <div className="reason-box">
                  <div className="reason-label">사유</div>
                  <div className="reason-text">{t.reason}</div>
                </div>
              </div>
              <div className="task-actions">
                <button
                  className="icon-btn revive"
                  onClick={() => reactivate(t.id)}
                  title="다시 진행 중으로"
                >
                  ↺
                </button>
                <button
                  className="icon-btn trash"
                  onClick={() => deleteParked(t.id)}
                  title="영구 삭제"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}

        <div className="footer">— 자동 저장 · 어디서든 같은 목록 —</div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 48px 24px 80px;
          position: relative;
        }
        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          z-index: 0;
        }
        .container {
          max-width: 720px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .masthead {
          border-top: 3px double #2a2620;
          border-bottom: 1px solid #2a2620;
          padding: 18px 0 14px;
          margin-bottom: 36px;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
        }
        .masthead-title {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 36px;
          font-weight: 600;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .masthead-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-email {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-style: italic;
          color: rgba(42, 38, 32, 0.6);
        }
        .signout {
          background: transparent;
          border: 1px solid rgba(42, 38, 32, 0.3);
          padding: 4px 10px;
          font-size: 12px;
          color: #2a2620;
          cursor: pointer;
          transition: all 0.2s;
        }
        .signout:hover {
          background: #2a2620;
          color: #f5f1e8;
        }
        .input-row {
          display: flex;
          gap: 0;
          margin-bottom: 36px;
          border-bottom: 1px solid #2a2620;
          padding-bottom: 8px;
        }
        .input-row input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 18px;
          color: #2a2620;
          padding: 8px 0;
        }
        .input-row input::placeholder {
          color: rgba(42, 38, 32, 0.35);
          font-style: italic;
        }
        .add-btn {
          background: #2a2620;
          color: #f5f1e8;
          border: none;
          padding: 8px 20px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 16px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .add-btn:hover { background: #4a3f2f; }
        .add-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .tabs {
          display: flex;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(42, 38, 32, 0.2);
        }
        .tab {
          background: none;
          border: none;
          padding: 12px 20px 12px 0;
          margin-right: 28px;
          font-size: 15px;
          color: rgba(42, 38, 32, 0.5);
          cursor: pointer;
          position: relative;
          font-weight: 500;
          transition: color 0.2s;
        }
        .tab:hover { color: rgba(42, 38, 32, 0.8); }
        .tab.active { color: #2a2620; font-weight: 700; }
        .tab.active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 20px;
          bottom: -1px;
          height: 2px;
          background: #2a2620;
        }
        .tab-count {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          margin-left: 6px;
          opacity: 0.6;
        }
        .task {
          padding: 18px 0;
          border-bottom: 1px solid rgba(42, 38, 32, 0.12);
          display: flex;
          gap: 16px;
          align-items: flex-start;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .task-num {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 22px;
          color: rgba(42, 38, 32, 0.4);
          min-width: 32px;
          line-height: 1.4;
        }
        .task-body { flex: 1; }
        .task-text { font-size: 17px; line-height: 1.55; margin-bottom: 6px; }
        .task-meta {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-style: italic;
          color: rgba(42, 38, 32, 0.5);
        }
        .task-actions { display: flex; gap: 8px; align-items: center; }
        .icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(42, 38, 32, 0.25);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #2a2620;
          transition: all 0.2s;
        }
        .icon-btn.done:hover { background: #3d5a3d; color: #f5f1e8; border-color: #3d5a3d; }
        .icon-btn.park:hover { background: #8b4a3a; color: #f5f1e8; border-color: #8b4a3a; }
        .icon-btn.revive:hover { background: #2a2620; color: #f5f1e8; border-color: #2a2620; }
        .icon-btn.trash:hover { background: #8b4a3a; color: #f5f1e8; border-color: #8b4a3a; }
        .reason-box {
          margin-top: 10px;
          padding: 12px 14px;
          background: rgba(139, 74, 58, 0.06);
          border-left: 2px solid #8b4a3a;
        }
        .reason-label {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #8b4a3a;
          margin-bottom: 4px;
        }
        .reason-text { font-size: 14px; line-height: 1.5; color: rgba(42, 38, 32, 0.8); }
        .reason-input-row { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }
        .reason-input-row input {
          flex: 1;
          min-width: 200px;
          background: rgba(139, 74, 58, 0.06);
          border: none;
          border-left: 2px solid #8b4a3a;
          padding: 10px 12px;
          font-size: 14px;
          color: #2a2620;
          outline: none;
        }
        .reason-input-row input::placeholder {
          color: rgba(42, 38, 32, 0.4);
          font-style: italic;
        }
        .mini-btn {
          background: transparent;
          border: 1px solid rgba(42, 38, 32, 0.3);
          padding: 6px 12px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          color: #2a2620;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mini-btn:hover { background: #2a2620; color: #f5f1e8; }
        .empty {
          text-align: center;
          padding: 60px 20px;
          color: rgba(42, 38, 32, 0.4);
        }
        .empty-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 22px;
          margin-bottom: 8px;
        }
        .empty-sub { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid rgba(42, 38, 32, 0.15);
          text-align: center;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(42, 38, 32, 0.5);
        }
      `}</style>
    </div>
  );
}
