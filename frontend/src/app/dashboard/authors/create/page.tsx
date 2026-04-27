"use client";

import { useRouter } from "next/navigation";
import { AuthorForm } from "../../_components/forms/author-form";
import { IconPen } from "../../dashboard-icons";

export default function CreateAuthorPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/authors");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="w-full pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">បន្ថែមអ្នកនិពន្ធថ្មី</h1>
          </div>
        </div>
      </div>

      <AuthorForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
