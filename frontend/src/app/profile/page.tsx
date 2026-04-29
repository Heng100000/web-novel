import ProfileClient from "./profile-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ប្រវត្តិរូប | Our Novel",
  description: "មើលប្រវត្តិរូប និងពិន្ទុរង្វាន់របស់អ្នក។",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
