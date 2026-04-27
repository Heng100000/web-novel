"use client";

import { useRouter } from "next/navigation";
import { AddToCartForm } from "../../_components/forms/add-to-cart-form";
import { IconOrders } from "../../dashboard-icons";

export default function CreateAddToCartPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/add-to-cart");
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
            <h1 className="text-3xl font-black tracking-tight text-text-main">New Cart Entry</h1>
          </div>
        </div>
      </div>

      <AddToCartForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
