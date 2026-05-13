"use client";

import { useEffect, useState } from "react";

export default function TodoApp({ supabase }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todoInput, setTodoInput] = useState("");
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) console.error("로드 실패:", error);
      else setTasks(data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const addTask = async () => {
    const todo = todoInput.trim();
    if (!todo) return;
    const note = noteInput.trim() || null;
    setTodoInput("");
    setNoteInput("");
    const tempId = "temp-" + Date.now();
    const optimistic = {
      id: tempId,
      todo,
      note,
      status: "active",
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ todo, note })
      .select()
      .single();
    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      alert("저장 실패: " + error.message);
    } else {
      setTasks((prev) => prev.map((t) => (t.id === tempId ? data : t)));
    }
  };

  const toggleComplete = async (task) => {
    const id = task.id;
    const newStatus = task.status === "active" ? "completed" : "active";
    const completed_at = newStatus === "completed" ? new Date().toISOString() : null;
    const backup = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus, completed_at } : t))
    );
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus, completed_at })
      .eq("id", id);
    if (error) {
      setTasks(backup);
      alert("실패: " + error.message);
    }
  };

  const deleteTask = async (id) => {
    if (!confirm("이 항목을 영구 삭제할까요?")) return;
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(backup);
      alert("삭제 실패: " + error.message);
    }
  };

  const updateNote = async (id, note) => {
    const value = note.trim() || null;
    const { error } = await supabase
      .from("tasks")
      .update({ note: value })
      .eq("id", id);
    if (error) console.error(error);
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}.${m}.${day}`;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const active = tasks.filter((t) => t.status === "active");
  const completed = tasks.filter((t) => t.status === "completed");

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <div>
            <div className="brand">업무 노트</div>
            <div className="brand-sub">{todayStr}</div>
          </div>
        </header>

        {/* Quick add */}
        <section className="add-card">
          <div className="card-head">
            <div className="tag tag-blue">새 할 일</div>
            <h2>빠른 추가</h2>
          </div>
          <div className="add-form">
            <input
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="할 일을 입력하세요"
              className="todo-input"
            />
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="비고 (선택)"
              className="note-input"
            />
            <button
              onClick={addTask}
              disabled={!todoInput.trim()}
              className="add-btn"
            >
              + 추가
            </button>
          </div>
        </section>

        {/* Active table */}
        <section className="table-card">
          <div className="card-head">
            <div className="tag tag-orange">진행 중</div>
            <h2>
              해야 할 일 <span className="count">{active.length}</span>
            </h2>
          </div>

          {loading ? (
            <div className="empty">불러오는 중...</div>
          ) : active.length === 0 ? (
            <div className="empty">아직 할 일이 없어요. 위에서 추가해보세요!</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>NO.</th>
                    <th style={{ width: 110 }}>입력날짜</th>
                    <th>TO-DO</th>
                    <th style={{ width: "30%" }}>비고</th>
                    <th style={{ width: 80, textAlign: "center" }}>완료</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((t, idx) => (
                    <tr key={t.id}>
                      <td className="cell-num">{idx + 1}</td>
                      <td className="cell-date">{formatDate(t.created_at)}</td>
                      <td className="cell-todo">{t.todo}</td>
                      <td className="cell-note">
                        <input
                          type="text"
                          defaultValue={t.note || ""}
                          onBlur={(e) => updateNote(t.id, e.target.value)}
                          placeholder="—"
                        />
                      </td>
                      <td className="cell-check">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => toggleComplete(t)}
                          />
                          <span className="checkmark" />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Completed table */}
        <section className="table-card">
          <div className="card-head">
            <div className="tag tag-green">완료</div>
            <h2>
              완료된 일 <span className="count">{completed.length}</span>
            </h2>
          </div>

          {completed.length === 0 ? (
            <div className="empty">아직 완료된 일이 없어요</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>NO.</th>
                    <th style={{ width: 110 }}>완료날짜</th>
                    <th>TO-DO</th>
                    <th style={{ width: "30%" }}>비고</th>
                    <th style={{ width: 100, textAlign: "center" }}> </th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((t, idx) => (
                    <tr key={t.id} className="completed-row">
                      <td className="cell-num">{idx + 1}</td>
                      <td className="cell-date cell-date-done">
                        {formatDate(t.completed_at)}
                      </td>
                      <td className="cell-todo cell-todo-done">{t.todo}</td>
                      <td className="cell-note cell-note-done">{t.note || "—"}</td>
                      <td className="cell-actions">
                        <button
                          onClick={() => toggleComplete(t)}
                          className="icon-btn"
                          title="다시 진행 중으로"
                        >
                          ↩
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="icon-btn icon-danger"
                          title="영구 삭제"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="footer">자동 저장 · 어디서든 같은 목록</footer>
      </div>

      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #f5f7fa;
          color: #0f172a;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
          -webkit-font-smoothing: antialiased;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      <style jsx>{`
        .page { min-height: 100vh; padding: 32px 20px 60px; }
        .container {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .header { padding: 4px 4px 8px; }
        .brand {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #0f172a;
        }
        .brand-sub {
          font-size: 13px;
          color: #64748b;
          margin-top: 2px;
          font-variant-numeric: tabular-nums;
        }

        .tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: 0.2px;
        }
        .tag-orange { background: #fff1e6; color: #ea580c; }
        .tag-blue   { background: #e0f2fe; color: #0369a1; }
        .tag-green  { background: #ecfdf5; color: #047857; }

        .add-card, .table-card {
          background: white;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          border: 1px solid #e2e8f0;
        }
        .card-head { margin-bottom: 16px; }
        h2 {
          font-size: 16px;
          font-weight: 700;
          margin: 8px 0 0;
          color: #0f172a;
        }
        .count {
          display: inline-block;
          margin-left: 4px;
          font-size: 14px;
          color: #94a3b8;
          font-weight: 600;
        }

        .add-form {
          display: grid;
          grid-template-columns: 1.4fr 1fr auto;
          gap: 10px;
        }
        .add-form input {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          transition: all 0.15s;
        }
        .add-form input::placeholder { color: #94a3b8; }
        .add-form input:focus {
          background: white;
          border-color: #fb923c;
          box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.12);
        }
        .add-btn {
          background: #fb923c;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .add-btn:hover:not(:disabled) { background: #ea580c; }
        .add-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

        .table-wrap {
          overflow-x: auto;
          margin: 0 -24px -22px;
          padding: 0 24px 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 560px;
        }
        thead { background: #f8fafc; }
        th {
          text-align: left;
          padding: 11px 14px;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }
        td {
          padding: 12px 14px;
          font-size: 14px;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
        }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr { transition: background 0.1s; }
        tbody tr:hover { background: #fafbfc; }

        .cell-num { color: #94a3b8; font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; }
        .cell-date { color: #475569; font-size: 13px; font-variant-numeric: tabular-nums; }
        .cell-date-done { color: #047857; font-weight: 600; }
        .cell-todo { font-weight: 500; word-break: keep-all; }
        .cell-todo-done {
          color: #94a3b8;
          text-decoration: line-through;
          text-decoration-thickness: 1.5px;
        }
        .cell-note input {
          background: transparent;
          border: 1px solid transparent;
          padding: 6px 9px;
          font-size: 13px;
          font-family: inherit;
          width: 100%;
          color: #64748b;
          border-radius: 6px;
          outline: none;
          transition: all 0.12s;
        }
        .cell-note input:hover { background: #f8fafc; }
        .cell-note input:focus {
          background: white;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .cell-note input::placeholder { color: #cbd5e1; }
        .cell-note-done { color: #94a3b8; font-size: 13px; padding-left: 9px; }
        .cell-check { text-align: center; }
        .cell-actions { text-align: center; white-space: nowrap; }
        .completed-row { background: #fcfdfc; }

        .checkbox {
          position: relative;
          display: inline-flex;
          cursor: pointer;
          user-select: none;
        }
        .checkbox input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .checkmark {
          width: 22px;
          height: 22px;
          background: white;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkbox:hover .checkmark {
          border-color: #fb923c;
          background: #fff7ed;
        }
        .checkbox input:checked + .checkmark {
          background: #fb923c;
          border-color: #fb923c;
        }
        .checkbox input:checked + .checkmark::after {
          content: '';
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2.5px 2.5px 0;
          transform: rotate(45deg);
          margin-top: -2px;
        }

        .icon-btn {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-family: inherit;
          margin: 0 2px;
          transition: all 0.15s;
        }
        .icon-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .icon-danger:hover {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .empty {
          text-align: center;
          padding: 36px 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        .footer {
          text-align: center;
          margin-top: 8px;
          padding: 8px;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 720px) {
          .page { padding: 20px 12px 40px; }
          .container { gap: 14px; }
          .add-card, .table-card { padding: 18px; border-radius: 14px; }
          .add-form { grid-template-columns: 1fr; }
          .add-form input, .add-btn { padding: 12px 14px; font-size: 15px; }
          .table-wrap { margin: 0 -18px -18px; padding: 0 18px 4px; }
          th, td { padding: 10px 10px; font-size: 13px; }
          .cell-note input { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
