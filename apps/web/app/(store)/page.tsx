import { HomePage } from "@/components/legacy/home";
import { api } from "@/lib/api";

export default async function Page() {
  const [featured, directory] = await Promise.all([api.featured(), api.designers()]);
  return <HomePage featured={featured} directory={directory} />;
}
