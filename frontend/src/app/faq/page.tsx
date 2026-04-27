import EmptyState from "@/components/empty-state";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "សំនួរ និងចម្លើយ | Our Novel",
};

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20">
        <EmptyState title="សំនួរ និងចម្លើយ" />
      </main>
      <BottomNav />
      <Footer />
    </div>
  );
}
