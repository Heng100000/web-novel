"use client";

import { useRouter } from "next/navigation";
import { BookForm } from "../../_components/forms/book-form";
import { IconBooks } from "../../dashboard-icons";
import { PermissionGuard } from "../../_components/permission-guard";

export default function CreateBookPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/books");
    router.refresh();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PermissionGuard resource="books" action="can_create">
      <div className="w-full pb-20">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-text-main font-battambang">បន្ថែមសៀវភៅថ្មី</h1>
            </div>
          </div>
        </div>

        <BookForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </PermissionGuard>
  );
}
