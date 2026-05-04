import WishlistClient from "./wishlist-client";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BottomNav from "@/components/bottom-nav";

export default function WishlistPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-20">
        <WishlistClient />
      </div>
      <BottomNav />
      <Footer />
    </main>
  );
}
