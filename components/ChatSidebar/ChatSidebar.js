import {
  faMessage,
  faPlus,
  faRightFromBracket,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export const ChatSidebar = ({ chatId }) => {
  const [chatList, setChatList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const loadChatList = async () => {
      const response = await fetch(`/api/chat/getChatList`, {
        method: "POST",
      });
      const json = await response.json();
      setChatList(json?.chats || []);
    };
    loadChatList();
  }, [chatId]);

  const handleDelete = async (e, chatIdToDelete) => {
    e.preventDefault();
    const response  = await fetch(`/api/chat/deleteChat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatId: chatIdToDelete,
      }),
    });
    
    if (response.ok) {
      if(chatList.length !== 1) {
        setChatList(chatList.filter((chat) => chat._id !== chatIdToDelete));
      } else {
        router.reload();
      }
    }
  }

  return (
    <div className="flex flex-col overflow-hidden bg-gray-900 text-white">
      <Link
        href="/chat"
        className="side-menu-item bg-emerald-500 hover:bg-emerald-600"
      >
        <FontAwesomeIcon icon={faPlus} /> New chat
      </Link>
      <div className="flex-1 overflow-auto bg-gray-950">
        {chatList.map((chat) => (
          <Link
            key={chat._id}
            href={`/chat/${chat._id}`}
            className={`side-menu-item group relative  ${
              chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""
            }`}
          >
            <FontAwesomeIcon icon={faMessage} className="text-white/50" />{" "}
            <span
              title={chat.title}
              className="overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {chat.title}
            </span>
            <button onClick={(e) => handleDelete(e,chat._id)}>
              <FontAwesomeIcon
                icon={faTrash}
                className="invisible absolute bottom-3 left-56 text-white/50 group-hover:visible"
              />
            </button>
          </Link>
        ))}
      </div>
      <Link href="/api/auth/logout" className="side-menu-item">
        <FontAwesomeIcon icon={faRightFromBracket} /> Logout
      </Link>
    </div>
  );
};
