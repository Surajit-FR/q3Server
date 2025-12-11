"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChatList = exports.saveChatMessage = void 0;
const chat_model_1 = __importDefault(require("../models/chat.model"));
const chatList_model_1 = __importDefault(require("../models/chatList.model"));
const saveChatMessage = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = new chat_model_1.default(message);
    yield chat.save();
});
exports.saveChatMessage = saveChatMessage;
//update chat function
const updateChatList = (userId, chatWithUserId, message, timestamp) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the chat list entry exists for the user
    const existingChatList = yield chatList_model_1.default.findOne({
        userId: userId,
        chatWithUserId: chatWithUserId,
    });
    if (existingChatList) {
        // Update the existing chat list entry with the latest message and timestamp
        existingChatList.lastMessage = message;
        existingChatList.lastMessageAt = timestamp;
        yield existingChatList.save();
    }
    else {
        // Create a new entry in the chat list for the user
        const newChatListEntry = new chatList_model_1.default({
            userId: userId,
            chatWithUserId: chatWithUserId,
            lastMessage: message,
            lastMessageAt: timestamp,
        });
        yield newChatListEntry.save();
    }
});
exports.updateChatList = updateChatList;
