import { getSession } from "@auth0/nextjs-auth0";
import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";
import Head from "next/head";
import { useRouter } from "next/router";
import { streamReader } from "openai-edge-stream";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { TailSpin } from "react-loading-icons";

// Both the routes will work - [[chatId]]
/* /chat
  /chat/7t8yg
*/
export default function ChatPage({ chatId, title, messages = [] }) {
  console.log(messages);
  const [newChatId, setNewChatId] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [originalChatId, setOriginalChatId] = useState(chatId);
  const router = useRouter();

  const routeHasChanged = chatId !== originalChatId;

  // when our route changes
  useEffect(() => {
    setNewChatMessages([]);
    setNewChatId(null);
  }, [chatId]);

  // save the newly streamed message to new chat messages
  useEffect(() => {
    if (!routeHasChanged && !generatingResponse && incomingMessage) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: incomingMessage,
        },
      ]);
      setIncomingMessage("");
    }
  }, [generatingResponse, incomingMessage, routeHasChanged]);

  // if we've created a new chat
  useEffect(() => {
    if (!generatingResponse && newChatId) {
      setNewChatId(null);
      router.push(`/chat/${newChatId}`);
    }
  }, [newChatId, generatingResponse, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setOriginalChatId(chatId);
    setNewChatMessages((prev) => [
      {
        _id: uuid(),
        role: "user",
        content: messageText,
      },
    ]);
    setMessageText("");

    console.log("NEW CHAT: ", { chatId, message: messageText });
    const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ chatId, message: messageText }),
    });
    const data = await response.json();
    if (!data) {
      return;
    }
    
    setNewChatId(data.chatId);
    setIncomingMessage(data.content);
    setGeneratingResponse(false);
  };

  const allMessages = [...messages, ...newChatMessages];

  console.log({allMessages});

  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
      {/* Sidebar with 260px, remaining be occupied for chat screen */}
      <div className="grid h-screen grid-cols-[260px_1fr] scrollbar-hide">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex flex-1 flex-col-reverse overflow-scroll text-white">
            {!allMessages.length && !incomingMessage && (
              <div className="m-auto flex items-center justify-center text-center">
                <div>
                  <FontAwesomeIcon
                    icon={faRobot}
                    className="text-6xl text-emerald-200"
                  />
                  <h1 className="mt-2 text-4xl font-bold text-white/50">
                    Ask me a question!
                  </h1>
                </div>
              </div>
            )}
            {!!allMessages.length && (
              <div className="mb-auto">
                {allMessages.map((message) => (
                  <Message
                    key={message._id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {!!incomingMessage && !routeHasChanged && (
                  <Message role="assistant" content={incomingMessage} />
                )}
                {!!incomingMessage && !!routeHasChanged && (
                  <Message
                    role="notice"
                    content="Only one message at a time. Please allow any other responses to complete before sending another message"
                  />
                )}
              </div>
            )}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={generatingResponse ? "" : "Send a message..."}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                {generatingResponse ? (
                  <div className="btn flex items-center justify-center">
                    <TailSpin
                      stroke="#98ff98"
                      strokeOpacity={0.825}
                      speed={0.75}
                    />
                  </div>
                ) : (
                  <button type="submit" className="btn">
                    Send
                  </button>
                )}
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null;
  if (chatId) {
    let objectId;

    try {
      objectId = new ObjectId(chatId);
    } catch (e) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    const { user } = await getSession(ctx.req, ctx.res);
    const client = await clientPromise;
    const db = client.db("longshotGPT");
    const chat = await db.collection("chats").findOne({
      userId: user.sub,
      _id: objectId,
    });

    if (!chat) {
      return {
        redirect: {
          destination: "/chat",
        },
      };
    }

    return {
      props: {
        chatId,
        title: chat.title,
        messages: chat.messages.map((message) => ({
          ...message,
          _id: uuid(),
        })),
      },
    };
  }
  return {
    props: {},
  };
};
