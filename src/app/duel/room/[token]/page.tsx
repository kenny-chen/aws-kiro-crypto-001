"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { Countdown } from "@/components/countdown";

type RoomData = {
  duelId: string;
  status: string;
  closeAt: string;
  totalStakeA: string;
  totalStakeB: string;
  participantCount: number;
  market: { title: string; optionALabel: string; optionBLabel: string; feeBps: number } | null;
  participants: { id: string; userId: string; side: string; stakeAmount: string; status: string }[];
};

type ChatMsg = { id: string; userId: string; message: string; createdAt: string };

export default function DuelRoomPage() {
  const { token } = useParams<{ token: string }>();
  const { userId } = useAuthStore();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  const fetchRoom = useCallback(() => {
    fetch(`/api/duel/room/${token}`).then((r) => r.json()).then((res) => {
      if (res.ok) setRoom(res.data);
    });
  }, [token]);

  const fetchChat = useCallback(() => {
    if (!room) return;
    fetch(`/api/chat/${room.duelId}`).then((r) => r.json()).then((res) => {
      if (res.ok) setMessages(res.data);
    });
  }, [room]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);
  useEffect(() => { fetchChat(); const id = setInterval(fetchChat, 5000); return () => clearInterval(id); }, [fetchChat]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !room || !userId) return;
    setSending(true);
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duelId: room.duelId, userId, message: chatInput }),
    });
    setChatInput("");
    setSending(false);
    fetchChat();
  };

  if (!room || !room.market) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading room...</p></main>;
  }

  const myParticipant = room.participants.find((p) => p.userId === userId);
  const statusColors: Record<string, string> = {
    open: "bg-green-900 text-green-300", closed: "bg-yellow-900 text-yellow-300",
    resolving: "bg-blue-900 text-blue-300", resolved: "bg-indigo-900 text-indigo-300",
    refunding: "bg-orange-900 text-orange-300", refunded: "bg-red-900 text-red-300",
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{room.market.title}</h1>
          <span className={`text-xs px-2 py-1 rounded ${statusColors[room.status] ?? "bg-gray-800 text-gray-400"}`}>{room.status}</span>
        </div>

        {/* Countdown */}
        <div className="flex justify-between text-sm text-gray-400">
          <span>Pool closes in</span>
          <Countdown target={room.closeAt} />
        </div>

        {/* Pools */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-400">{room.market.optionALabel}</p>
            <p className="mt-1 text-lg font-bold text-blue-400">{room.totalStakeA} USDC</p>
          </div>
          <div className="rounded-lg bg-gray-800 p-4 text-center">
            <p className="text-xs text-gray-400">{room.market.optionBLabel}</p>
            <p className="mt-1 text-lg font-bold text-purple-400">{room.totalStakeB} USDC</p>
          </div>
        </div>

        <p className="text-sm text-gray-400">{room.participantCount} participants</p>

        {/* My position */}
        {myParticipant && (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm">
            <p className="text-gray-400">Your position</p>
            <p className="mt-1">Side <span className="font-bold text-white">{myParticipant.side}</span> · {myParticipant.stakeAmount} USDC</p>
          </div>
        )}

        {/* Chat */}
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <p className="text-sm text-gray-400 mb-3">Chat</p>
          <div className="h-48 overflow-y-auto space-y-2 mb-3">
            {messages.map((m) => (
              <div key={m.id} className={`text-sm ${m.userId === userId ? "text-indigo-300" : "text-gray-300"}`}>
                <span className="text-xs text-gray-500">{m.userId.slice(0, 8)}:</span> {m.message}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..." maxLength={500}
              className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm text-white" />
            <button onClick={sendMessage} disabled={sending}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
