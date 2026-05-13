"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import TodoApp from "@/components/TodoApp";

export default function Home() {
  const [supabase] = useState(() => createClient());
  return <TodoApp supabase={supabase} />;
}
