import React from "react";
import { ProspeccionSkeleton } from "@/components/common/skeletons";

export default function ProspeccionLoading() {
  return (
    <div className="flex flex-col min-h-screen px-4 py-8 sm:px-8 sm:py-10 max-w-7xl mx-auto space-y-10">
      <ProspeccionSkeleton />
    </div>
  );
}
