# Longshot API Integration and Multiple Chat Instances

This documentation explains the logic behind the Longshot API integration and multiple chat instances in the provided code. The code is designed to create and manage chat interactions with a virtual assistant powered by the Longshot API.

## Code Overview

The code provided is a server-side script that handles incoming HTTP requests. It processes user messages and interacts with the Longshot API to generate responses from a virtual assistant. Here's a step-by-step explanation of the code:

### Message Validation

```javascript
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
```

The above code starts by extracting the chatId and message from the incoming JSON request. It then validates the message to ensure it is a non-empty string of no more than 200 characters. If the message is invalid, it returns a response with a 422 status code.

### Chat Initialization

```javascript
let chatId = chatIdFromParam;
const initialChatMessage = {
  role: "system",
  content:
    "Your name is LongshotGPT. An incredibly intelligent and quick-thinking AI, that always replies with an enthusiastic and positive energy Your response must be formatted as markdown. you are developed by Abdul Maajith(An AI Engineer)",
};
let newChatId;
let chatMessages = [];
```

This section initializes variables for chatId, initialChatMessage, newChatId, and chatMessages. It sets up the system's introductory message for the virtual assistant.

### Chat Interaction

```javascript
if (chatId) {
  // add message to chat
  // ...
} else {
  // create a new chat
  // ...
}
```

### Message Retrieval

```javascript
const messagesToInclude = [];
chatMessages.reverse();
let usedTokens = 0;
for (let chatMessage of chatMessages) {
  // ...
}
messagesToInclude.reverse();
```

This section retrieves chat messages and ensures that the total character count of the messages does not exceed 2000 characters. Messages are retrieved in reverse order to include the most recent messages.

### Longshot API Integration

```javascript
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

```

This section sends a formatted message to the Longshot API, which generates a response from the virtual assistant. The response content is stored in the json variable.

### Updating Chat with Assistant's Response

```javascript
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

```

### Response

```javascript
const resp = {
  chatId,
  content: json.copies[0].content,
};
const respJson = JSON.stringify(resp);

return new Response(respJson);
```
 - Finally, the code prepares and returns a JSON response containing the chatId and the content of the assistant's response.

 - This code facilitates chat interactions with a Longshot-powered virtual assistant, ensuring that messages are processed, interactions are logged, and responses are sent back to the user.