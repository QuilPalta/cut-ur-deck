import { redirect } from "next/navigation";

export default function LeagueAdminPage() {
  // Si alguien entra a la raíz de admin, lo pateamos a la gestión de ligas por defecto
  redirect("/league/admin/leagues");
}