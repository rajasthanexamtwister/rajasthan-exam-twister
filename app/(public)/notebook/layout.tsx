import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Revision Notebook",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotebookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
