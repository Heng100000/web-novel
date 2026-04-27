import EmptyState from "@/components/empty-state";
import Navbar from "@/components/navbar";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "អំពីពួកយើង | Our Novel",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20">
        <EmptyState title="អំពីពួកយើង" />
      </main>
      <BottomNav />
      <Footer />
    </div>
  );
}
