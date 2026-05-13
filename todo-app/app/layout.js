import "./globals.css";

export const metadata = {
  title: "업무 노트",
  description: "내 업무 To-Do",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
