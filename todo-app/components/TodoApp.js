"use client";

import { useEffect, useState } from "react";

const CATEGORIES = [
  { name: "사업지원팀", bg: "#fff1e6", color: "#c2410c" },
  { name: "구매파트", bg: "#e0f2fe", color: "#0369a1" },
  { name: "사업관리파트", bg: "#ecfdf5", color: "#047857" },
  { name: "AI 프로그램", bg: "#f5f3ff", color: "#6d28d9" },
];

export default function TodoApp({ supabase }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todoInput, setTodoInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [catInput, setCatInput] = useState("");

  // 편집 상태
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ todo: "", note: "", category: "" });

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
    if (!todo) {
      alert("할 일을 입력해주세요");
      return;
    }
    if (!catInput) {
      alert("분류를 선택해주세요");
      return;
    }
    const note = noteInput.trim() || null;
    const category = catInput;

    setTodoInput("");
    setNoteInput("");

    const tempId = "temp-" + Date.now();
    const optimistic = {
      id: tempId,
      todo,
      note,
      category,
      status: "active",
      created_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("tasks")
      .insert({ todo, note, category })
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

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditDraft({
      todo: task.todo || "",
      note: task.note || "",
      category: task.category || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ todo: "", note: "", category: "" });
  };

  const saveEdit = async () => {
    const id = editingId;
    const todo = editDraft.todo.trim();
    const note = editDraft.note.trim() || null;
    const category = editDraft.category;

    if (!todo) {
      alert("할 일을 입력해주세요");
      return;
    }
    if (!category) {
      alert("분류를 선택해주세요");
      return;
    }

    const backup = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, todo, note, category } : t))
    );
    setEditingId(null);
    setEditDraft({ todo: "", note: "", category: "" });

    const { error } = await supabase
      .from("tasks")
      .update({ todo, note, category })
      .eq("id", id);
    if (error) {
      setTasks(backup);
      alert("저장 실패: " + error.message);
    }
  };

  const updateNote = async (id, note) => {
    // 더 이상 사용 안 함 (편집은 ✎ 버튼으로만 가능)
    return;
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}.${m}.${day}`;
  };

  const getCatStyle = (name) =>
    CATEGORIES.find((c) => c.name === name) || CATEGORIES[0];

  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const active = tasks
    .filter((t) => t.status === "active")
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  const completed = tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => (b.completed_at || "").localeCompare(a.completed_at || ""));

  // 편집 행 렌더링
  const renderEditRow = (t, idx, dateStr, isCompleted = false) => (
    <tr key={t.id} className="editing-row">
      <td className="cell-num">{idx + 1}</td>
      <td className="cell-date">{dateStr}</td>
      {isCompleted && (
        <td>
          <select
            value={editDraft.category}
            onChange={(e) =>
              setEditDraft((prev) => ({ ...prev, category: e.target.value }))
            }
            className="edit-input edit-select-cat"
          >
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
      )}
      <td className="cell-todo edit-cell">
        <input
          type="text"
          value={editDraft.todo}
          onChange={(e) =>
            setEditDraft((prev) => ({ ...prev, todo: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="edit-input"
          autoFocus
        />
        {!isCompleted && (
          <select
            value={editDraft.category}
            onChange={(e) =>
              setEditDraft((prev) => ({ ...prev, category: e.target.value }))
            }
            className="edit-input edit-select-cat"
            style={{ marginTop: 6 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="cell-note edit-cell">
        <input
          type="text"
          value={editDraft.note}
          onChange={(e) =>
            setEditDraft((prev) => ({ ...prev, note: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          placeholder="비고 (선택)"
          className="edit-input"
        />
      </td>
      <td className="cell-actions">
        <div className="check-actions">
          <button onClick={saveEdit} className="icon-btn save-btn" title="저장">
            ✓
          </button>
          <button onClick={cancelEdit} className="icon-btn" title="취소">
            ✕
          </button>
        </div>
      </td>
    </tr>
  );

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
            <select
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              className={`cat-select ${!catInput ? "empty" : ""}`}
            >
              <option value="">분류 선택 *</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={addTask}
              disabled={!todoInput.trim() || !catInput}
              className="add-btn"
            >
              + 추가
            </button>
          </div>
          <div className="add-hint">분류는 꼭 선택해야 추가돼요</div>
        </section>

        {loading ? (
          <section className="table-card">
            <div className="empty">불러오는 중...</div>
          </section>
        ) : (
          <>
            {/* 카테고리별 카드 4개 */}
            {CATEGORIES.map((cat) => {
              const catTasks = active.filter((t) => t.category === cat.name);
              return (
                <section
                  key={cat.name}
                  className="table-card cat-card"
                  style={{ borderLeftColor: cat.color }}
                >
                  <div className="card-head cat-head">
                    <span
                      className="tag"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.name}
                    </span>
                    <span className="count">{catTasks.length}건</span>
                  </div>

                  {catTasks.length === 0 ? (
                    <div className="empty">이 분류엔 진행 중인 할 일이 없어요</div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th style={{ width: 56 }}>NO.</th>
                            <th style={{ width: 110 }}>입력날짜</th>
                            <th>TO-DO</th>
                            <th style={{ width: "30%" }}>비고</th>
                            <th style={{ width: 160, textAlign: "center" }}>
                              완료 / 수정 / 삭제
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {catTasks.map((t, idx) =>
                            editingId === t.id
                              ? renderEditRow(t, idx, formatDate(t.created_at), false)
                              : (
                                <tr key={t.id}>
                                  <td className="cell-num">{idx + 1}</td>
                                  <td className="cell-date">{formatDate(t.created_at)}</td>
                                  <td className="cell-todo">{t.todo}</td>
                                  <td className="cell-note">
                                    {t.note || <span className="cell-note-empty">—</span>}
                                  </td>
                                  <td className="cell-check">
                                    <div className="check-actions">
                                      <label className="checkbox" title="완료">
                                        <input
                                          type="checkbox"
                                          checked={false}
                                          onChange={() => toggleComplete(t)}
                                        />
                                        <span className="checkmark" />
                                      </label>
                                      <button
                                        onClick={() => startEdit(t)}
                                        className="icon-btn"
                                        title="수정"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        onClick={() => deleteTask(t.id)}
                                        className="icon-btn icon-danger"
                                        title="삭제"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}

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
                        <th style={{ width: 120 }}>분류</th>
                        <th>TO-DO</th>
                        <th style={{ width: "25%" }}>비고</th>
                        <th style={{ width: 140, textAlign: "center" }}> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {completed.map((t, idx) => {
                        const c = getCatStyle(t.category);
                        return editingId === t.id ? (
                          renderEditRow(t, idx, formatDate(t.completed_at), true)
                        ) : (
                          <tr key={t.id} className="completed-row">
                            <td className="cell-num">{idx + 1}</td>
                            <td className="cell-date cell-date-done">
                              {formatDate(t.completed_at)}
                            </td>
                            <td>
                              {t.category && (
                                <span
                                  className="cell-cat"
                                  style={{ background: c.bg, color: c.color }}
                                >
                                  {t.category}
                                </span>
                              )}
                            </td>
                            <td className="cell-todo cell-todo-done">{t.todo}</td>
                            <td className="cell-note cell-note-done">
                              {t.note || "—"}
                            </td>
                            <td className="cell-actions">
                              <button
                                onClick={() => toggleComplete(t)}
                                className="icon-btn"
                                title="다시 진행 중으로"
                              >
                                ↩
                              </button>
                              <button
                                onClick={() => startEdit(t)}
                                className="icon-btn"
                                title="수정"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="icon-btn icon-danger"
                                title="삭제"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <div className="footer">자동 저장 · 어디서든 같은 목록</div>
      </div>

      <style jsx global>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
        * { box-sizing: border-box; }
        html, body {
          margin: 0;
          padding: 0;
          background: #f5f7fa !important;
          color: #0f172a;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px 18px 60px;
          background: #f5f7fa;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .header { padding: 4px 4px 6px; }
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
        .cat-card {
          border-left-width: 4px;
          border-left-style: solid;
        }
        .card-head { margin-bottom: 14px; }
        .cat-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        h2 {
          font-size: 16px;
          font-weight: 700;
          margin: 8px 0 0;
          color: #0f172a;
        }
        .count {
          display: inline-block;
          font-size: 14px;
          color: #94a3b8;
          font-weight: 600;
          margin-left: 4px;
        }
        .cat-head .count {
          margin-left: 0;
        }

        .add-form {
          display: grid;
          grid-template-columns: 1.3fr 1fr 180px auto;
          gap: 10px;
        }
        .add-form input, .add-form select {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          transition: all 0.15s;
          text-align: left;
        }
        .add-form input::placeholder { color: #94a3b8; }
        .add-form input:focus, .add-form select:focus {
          background: white;
          border-color: #fb923c;
          box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.12);
        }
        .cat-select { cursor: pointer; }
        .cat-select.empty { color: #94a3b8; }
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
        .add-hint {
          margin-top: 10px;
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
        }

        .table-wrap {
          overflow-x: auto;
          margin: 0 -24px -22px;
          padding: 0 24px 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
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

        .cell-num {
          color: #94a3b8;
          font-weight: 600;
          font-size: 13px;
          font-variant-numeric: tabular-nums;
        }
        .cell-date {
          color: #475569;
          font-size: 13px;
          font-variant-numeric: tabular-nums;
        }
        .cell-date-done { color: #047857; font-weight: 600; }
        .cell-todo { font-weight: 500; word-break: keep-all; }
        .cell-todo-done {
          color: #94a3b8;
          text-decoration: line-through;
          text-decoration-thickness: 1.5px;
        }
        .cell-cat {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 5px;
        }
        .cell-note {
          color: #64748b;
          font-size: 13px;
        }
        .cell-note-empty { color: #cbd5e1; }
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
        .cell-note-done {
          color: #94a3b8;
          font-size: 13px;
          padding-left: 9px;
        }
        .cell-check { text-align: center; }
        .cell-actions { text-align: center; white-space: nowrap; }
        .check-actions {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-wrap: nowrap;
        }
        .completed-row { background: #fcfdfc; }

        /* Edit mode styles */
        .editing-row { background: #fff7ed !important; }
        .editing-row:hover { background: #fff7ed !important; }
        .edit-cell { padding: 10px 14px; }
        .edit-input {
          width: 100%;
          background: white;
          border: 1.5px solid #fb923c;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          transition: all 0.12s;
        }
        .edit-input:focus {
          box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.18);
        }
        .edit-select-cat {
          font-size: 12px;
          font-weight: 600;
          padding: 7px 10px;
          cursor: pointer;
        }
        .save-btn {
          background: #10b981 !important;
          color: white !important;
          border-color: #10b981 !important;
          font-weight: 700;
        }
        .save-btn:hover {
          background: #059669 !important;
          color: white !important;
        }

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
          border-color: #10b981;
          background: #f0fdf4;
        }
        .checkbox input:checked + .checkmark {
          background: #10b981;
          border-color: #10b981;
        }
        .checkbox input:checked + .checkmark::after {
          content: "";
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
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .icon-btn:hover {
          background: #fff7ed;
          color: #ea580c;
          border-color: #fed7aa;
        }
        .icon-danger:hover {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .empty {
          text-align: center;
          padding: 30px 20px;
          color: #94a3b8;
          font-size: 13px;
        }

        .footer {
          text-align: center;
          margin-top: 8px;
          padding: 8px;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 720px) {
          .page { padding: 18px 12px 40px; }
          .container { gap: 12px; }
          .add-card, .table-card { padding: 16px; border-radius: 14px; }
          .add-form { grid-template-columns: 1fr; }
          .add-form input, .add-form select, .add-btn {
            padding: 13px 14px;
            font-size: 15px;
          }
          .add-hint { text-align: center; }
          .table-wrap { margin: 0 -16px -16px; padding: 0 16px 4px; }
          th, td { padding: 10px 10px; font-size: 13px; }
          .cell-note input { font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
