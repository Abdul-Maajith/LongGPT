import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const { chatId } = req.body;
    const client = await clientPromise;
    const db = client.db("longshotGPT");
    let chatObjectId = new ObjectId(chatId);
    const chats = await db.collection("chats").findOneAndDelete({
      _id: chatObjectId,
      userId: user.sub,
    });

    res.status(200).json({ 
        message: "Successfully deleted the chat"
    });
  } catch (e) {
    res
      .status(500)
      .json({ message: "An error occurred when getting the chat list" });
  }
}
