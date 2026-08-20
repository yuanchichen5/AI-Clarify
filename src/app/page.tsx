import { redirect } from "next/navigation";

/** 根路径 → 知识库主页 */
export default function HomePage() {
  redirect("/library");
}
