import CartClient from "./cart-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "កន្ត្រកទំនិញ | Our Novel",
  description: "ពិនិត្យមើលសៀវភៅដែលអ្នកបានជ្រើសរើស និងបន្តការបញ្ជាទិញ។",
};

export default function CartPage() {
  return <CartClient />;
}
