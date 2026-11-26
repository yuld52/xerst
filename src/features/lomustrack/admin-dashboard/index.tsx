import { CompanyDashboard } from "@/features/lomustrack/admin/components/CompanyDashboard";
import { EmailSender } from "@/features/lomustrack/admin/components/EmailSender";
import { getStoredUser } from "@/services/auth";

export default function AdminDashboardPage() {
  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <div className="p-6 space-y-8">
      <CompanyDashboard />
      {isSuperAdmin && (
        <div>
          <EmailSender />
        </div>
      )}
    </div>
  );
}
