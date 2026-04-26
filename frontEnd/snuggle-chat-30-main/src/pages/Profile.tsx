import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { User, LogOut, Edit, MessageCircle, Users, Mail } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Edit className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar & Info */}
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>


      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}
