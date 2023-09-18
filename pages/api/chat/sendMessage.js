export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const { chatId: chatIdFromParam, message } = await req.json();

    // validate message data
    if (!message || typeof message !== "string" || message.length > 200) {
      return new Response(
        {
          message: "message is required and must be less than 200 characters",
        },
        {
          status: 422,
        }
      );
    }

    let chatId = chatIdFromParam;
    console.log("MESSAGE: ", message);
    const initialChatMessage = {
      role: "system",
      content:
        "Your name is LongshotGPT. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy Your response must be formatted as markdown. you are developed by Abdul Maajith(An AI Engineer)",
    };

    let newChatId;
    let chatMessages = [];

    if (chatId) {
      // add message to chat
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
      const json = await response.json();
      chatMessages = json.chat.messages || [];
    } else {
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            message,
          }),
        }
      );
      const json = await response.json();
      chatId = json._id;
      newChatId = json._id;
      chatMessages = json.messages || [];
    }

    const messagesToInclude = [];
    chatMessages.reverse();
    let usedTokens = 0;
    for (let chatMessage of chatMessages) {
      const messageTokens = chatMessage.content.length / 4;
      usedTokens = usedTokens + messageTokens;
      if (usedTokens <= 2000) {
        messagesToInclude.push(chatMessage);
      } else {
        break;
      }
    }

    messagesToInclude.reverse();

    let formattedText = `${initialChatMessage.content}, Question: ${message}`;

    const response = await fetch(
      "https://api-v2.longshot.ai/custom/api/generate/instruct",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.LONGSHOT_API_SECRET}`,
        },
        body: JSON.stringify({
          text: formattedText,
        }),
      }
    );
    const json = await response.json();

    await fetch(`${req.headers.get("origin")}/api/chat/addMessageToChat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: req.headers.get("cookie"),
      },
      body: JSON.stringify({
        chatId,
        role: "assistant",
        content: json.copies[0].content,
      }),
    });

    console.log("Credits used from LongshotAPI: " + json.credits_used);

    const resp = {
      chatId,
      content: json.copies[0].content,
    };
    const respJson = JSON.stringify(resp);

    return new Response(respJson);

  } catch (e) {
    console.log(e);
    return new Response(
      { message: "An error occurred in sendMessage" },
      {
        status: 500,
      }
    );
  }
}
