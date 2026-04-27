import CheckoutClient from "./checkout-client";

export const metadata = {
  title: "Checkout - Book Novel",
  description: "Review and complete your book order.",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
