import { useState } from "react";
import { useToast } from "../hooks/useToast";
import { UserPlus, UserX, Loader2, Handshake, UserMinus } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type FriendStatus =
  | "self"
  | "not_friends"
  | "request_sent"
  | "request_received"
  | "friends";

interface Props {
  userId: number;
  status: FriendStatus;
  onStatusChange: (status: FriendStatus) => void;
}

export default function ActionButton({
  userId,
  status,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAction = async (
    action: "request" | "accept" | "refuse" | "remove",
  ) => {
    setLoading(true);
    let url = "";
    switch (action) {
      case "request":
        url = `${API_BASE}/api/friends/request.php`;
        break;
      case "accept":
        url = `${API_BASE}/api/friends/accept.php`;
        break;
      case "refuse":
        url = `${API_BASE}/api/friends/refuse.php`;
        break;
      case "remove":
        url = `${API_BASE}/api/friends/remove.php`;
        break;
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ friend_id: userId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onStatusChange(data.friend_status);
      toast.success(data.message || "Action réussie.");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l’action.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "self") return null;

  // Style commun morphable
  const baseBtn =
    "relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-base shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 select-none disabled:opacity-60 disabled:cursor-not-allowed";
  const secondary =
    "bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700";
  const primary =
    "bg-[#1877f2] border border-[#1877f2] text-white hover:bg-[#166fe5] shadow-[#1877f2]/20";
  const loader = <Loader2 className="animate-spin w-5 h-5" />;

  // Morphing selon l'état
  if (status === "friends") {
    return (
      <button
        className={`${baseBtn} ${secondary} group`}
        aria-label="Retirer des amis"
        disabled={loading}
        onClick={() => handleAction("remove")}
      >
        {loading ? (
          loader
        ) : (
          <UserMinus className="w-5 h-5 transition-transform group-hover:scale-110" />
        )}
        <span className="transition-all">
          {loading ? "Suppression..." : "Retirer"}
        </span>
      </button>
    );
  }
  if (status === "not_friends") {
    return (
      <button
        className={`${baseBtn} ${primary} hover:scale-[1.02] active:scale-98`}
        aria-label="Ajouter en ami"
        disabled={loading}
        onClick={() => handleAction("request")}
      >
        {loading ? (
          loader
        ) : (
          <UserPlus className="w-5 h-5 transition-transform" />
        )}
        <span className="transition-all">
          {loading ? "Envoi..." : "Ajouter"}
        </span>
      </button>
    );
  }
  if (status === "request_sent") {
    return (
      <button
        className={`${baseBtn} ${secondary} group`}
        aria-label="Annuler la demande d'ami"
        disabled={loading}
        onClick={() => handleAction("remove")}
      >
        {loading ? (
          loader
        ) : (
          <UserX className="w-5 h-5 transition-transform group-hover:scale-110" />
        )}
        <span className="transition-all">
          {loading ? "Annulation..." : "Annuler"}
        </span>
      </button>
    );
  }
  if (status === "request_received") {
    return (
      <div className="flex gap-2">
        <button
          className={`${baseBtn} ${primary} hover:scale-[1.02] active:scale-98`}
          aria-label="Accepter la demande d'ami"
          disabled={loading}
          onClick={() => handleAction("accept")}
        >
          {loading ? loader : <Handshake className="w-5 h-5" />}
          <span>{loading ? "Acceptation..." : "Accepter"}</span>
        </button>
        <button
          className={`${baseBtn} ${secondary} group`}
          aria-label="Refuser la demande d'ami"
          disabled={loading}
          onClick={() => handleAction("refuse")}
        >
          {loading ? (
            loader
          ) : (
            <UserX className="w-5 h-5 transition-transform group-hover:scale-110" />
          )}
          <span>{loading ? "Refus..." : "Refuser"}</span>
        </button>
      </div>
    );
  }
  return null;
}
