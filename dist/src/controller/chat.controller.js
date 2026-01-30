"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChatList = exports.saveChatMessage = void 0;
const chat_model_1 = __importDefault(require("../models/chat.model"));
const chatList_model_1 = __importDefault(require("../models/chatList.model"));
const saveChatMessage = async (message) => {
    const chat = new chat_model_1.default(message);
    await chat.save();
};
exports.saveChatMessage = saveChatMessage;
//update chat function
const updateChatList = async (userId, chatWithUserId, message, timestamp) => {
    // Check if the chat list entry exists for the user
    const existingChatList = await chatList_model_1.default.findOne({
        userId: userId,
        chatWithUserId: chatWithUserId,
    });
    if (existingChatList) {
        // Update the existing chat list entry with the latest message and timestamp
        existingChatList.lastMessage = message;
        existingChatList.lastMessageAt = timestamp;
        await existingChatList.save();
    }
    else {
        // Create a new entry in the chat list for the user
        const newChatListEntry = new chatList_model_1.default({
            userId: userId,
            chatWithUserId: chatWithUserId,
            lastMessage: message,
            lastMessageAt: timestamp,
        });
        await newChatListEntry.save();
    }
};
exports.updateChatList = updateChatList;
