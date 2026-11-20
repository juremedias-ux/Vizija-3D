"use client";

import dynamic from "next/dynamic";

/** Seznam se prebere iz brskalnika (IndexedDB), zato se izriše samo na odjemalcu. */
const ProjectList = dynamic(
  () => import("./ProjectList").then((m) => m.ProjectList),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="text-fg-muted">
        Nalagam modele …
      </p>
    ),
  },
);

export function ProjectListLoader() {
  return <ProjectList />;
}
