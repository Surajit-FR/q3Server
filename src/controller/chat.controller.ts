import ChatModel from "../models/chat.model";
import { Request, Response } from "express";
import ChatListModel from "../models/chatList.model";

export const saveChatMessage = async (message: {
  fromUserId: string;
  toUserId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}) => {
  const chat = new ChatModel(message);
  await chat.save();
};

//update chat function
export const updateChatList = async (
  userId: string,
  chatWithUserId: string,
  message: string,
  timestamp: Date
) => {
  // Check if the chat list entry exists for the user
  const existingChatList = await ChatListModel.findOne({
    userId: userId,
    chatWithUserId: chatWithUserId,
  });

  if (existingChatList) {
    // Update the existing chat list entry with the latest message and timestamp
    existingChatList.lastMessage = message;
    existingChatList.lastMessageAt = timestamp;
    await existingChatList.save();
  } else {
    // Create a new entry in the chat list for the user
    const newChatListEntry = new ChatListModel({
      userId: userId,
      chatWithUserId: chatWithUserId,
      lastMessage: message,
      lastMessageAt: timestamp,
    });
    await newChatListEntry.save();
  }
};
