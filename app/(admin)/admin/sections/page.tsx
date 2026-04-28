"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { SECTIONS_DATA } from "@/lib/sections";

export default function SectionsAdmin() {
  return (
    <AdminShell>
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Sections</h1>
        <p className="text-sm text-gray-500 mb-4">Sections are fixed to the 6 original categories. Article numbering continues from the last article in each section.</p>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SECTIONS_DATA.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500">{s.number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{s.slug}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.description}</td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/section/${s.slug}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      View ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-1">Edition-2 article numbering</h3>
          <div className="text-xs text-amber-700 space-y-1">
            {[
              { sec: "1 — Editorial",          last: "1.1", next: "1.2" },
              { sec: "2 — Management",         last: "2.3", next: "2.4" },
              { sec: "3 — Analytics",          last: "3.4", next: "3.5" },
              { sec: "4 — What's Buzzing",     last: "4.3", next: "4.4" },
              { sec: "5 — Social",             last: "5.3", next: "5.4" },
              { sec: "6 — Campus Chronicles",  last: "6.4", next: "6.5" },
            ].map((r) => (
              <div key={r.sec}>
                <strong>{r.sec}</strong>: last edition-1 article is <code className="bg-amber-100 px-1 rounded">{r.last}</code> → next is <code className="bg-amber-100 px-1 rounded">{r.next}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
