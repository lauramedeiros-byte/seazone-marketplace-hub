"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renderiza o markdown do briefing e dos roteiros, incluindo tabelas (GFM). */
export function Md({ children }: { children: string }) {
  return (
    <div className="text-sm text-gray-700 leading-relaxed space-y-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
      <div className="[&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:bg-gray-50 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-700 [&_th]:px-2 [&_th]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-gray-200 [&_td]:align-top overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
      </div>
    </div>
  );
}
