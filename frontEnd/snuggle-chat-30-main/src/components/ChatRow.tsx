import { User } from "lucide-react";

interface ChatRowProps {
  name: string;
  email: string;
  avatarUrl?: string;
  lastMessage?: string;
  onClick: () => void;
}

export default function ChatRow({ name, email, avatarUrl, lastMessage, onClick }: ChatRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-accent"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate font-semibold text-foreground">{name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {lastMessage || email}
        </p>
      </div>
    </button>
  );
}
