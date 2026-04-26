import React from "react";

interface MessageBubbleProps {
  id: string;
  content: string;
  isSent: boolean;
  senderName: string;
  timestamp: string;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

export default React.memo(function MessageBubble({
  id,
  content,
  isSent,
  senderName,
  timestamp,
  onContextMenu,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"}`}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, id) : undefined}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isSent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-accent text-foreground rounded-bl-md"
        }`}
      >
        <p className="text-[11px] font-semibold opacity-80 mb-0.5">{senderName}</p>
        <p className="text-sm leading-relaxed break-words">{content}</p>
        <p className={`text-[10px] mt-1 text-right ${isSent ? "opacity-70" : "opacity-50"}`}>
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
})
