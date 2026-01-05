import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketAuth.middleware";
import ChatModel from "../models/chat.model";
import { saveChatMessage, updateChatList } from "../controller/chat.controller";
import { fetchAssociatedCustomer } from "../controller/towingServiceBooking.controller";

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(socketAuthMiddleware);

  // Store connected customers
  const connectedCustomers: { [key: string]: string } = {};
  const connectedProviders: { [key: string]: string } = {};
  const connectedAgent: { [key: string]: string } = {};
  const onlineUsers: { [userId: string]: boolean } = {};

  io.on("connection", (socket: Socket) => {
    console.log("connection established");

    const userId = socket.data.userId;
    const usertype = socket.data.userType;

    const userToken =
      socket.handshake.headers.accesstoken || socket.handshake.auth.accessToken;
    console.log(
      `A ${usertype} with userId ${userId} connected on socket ${socket.id}`
    );

    if (usertype === "Customer") {
      connectedCustomers[userId] = socket.id;
    } else if (usertype === "ServiceProvider") {
      connectedProviders[userId] = socket.id;
      const serviceProvidersRoom = "ProvidersRoom";
      socket.join(serviceProvidersRoom);
      // console.log(`A Service Provider ${userId} joined to ${serviceProvidersRoom}`);+
    } else {
      connectedAgent[userId] = socket.id;
    }

    // Mark user as online
    onlineUsers[userId] = true;
    io.emit("userStatusUpdate", { userId, isOnline: true });

    console.log({ connectedCustomers });
    console.log({ connectedProviders });
    console.log({ connectedAgent });
    console.log({ onlineUsers });

    // Handle chat messages
    socket.on(
      "chatMessage",
      async (message: { toUserId: string; content: string }) => {
        const { toUserId, content } = message;
        if (!toUserId || !content) {
          return socket.emit("error", {
            error: "Invalid payload: toUserId and content are required.",
          });
        }
        const now = new Date();
        try {
          // Identify recipient socket ID
          const recipientSocketId =
            connectedProviders[toUserId] ||
            connectedCustomers[toUserId] ||
            connectedAgent[toUserId];

          let isRead = false;

          if (recipientSocketId) {
            // Recipient is online and will see the message now
            isRead = true;
          }

          // Save the chat message in the database
          await saveChatMessage({
            fromUserId: userId,
            toUserId,
            content,
            isRead,
            timestamp: now,
          });

          // Update chat lists for both users
          await updateChatList(userId, toUserId, content, now);
          await updateChatList(toUserId, userId, content, now);

          if (recipientSocketId) {
            console.log(
              "Sending message to:",
              toUserId,
              "Socket ID:",
              recipientSocketId
            );

            io.to(recipientSocketId).emit("chatMessage", {
              fromUserId: userId,
              content,
              timestamp: now,
            });

            io.to(recipientSocketId).emit("chatNotification", {
              fromUserId: userId,
              content,
              timestamp: now,
            });
          }
        } catch (error) {
          console.error("Error handling chatMessage:", error);
          socket.emit("error", {
            error: "Failed to send message. Please try again.",
          });
        }
      }
    );

    // When a user opens a chat (marks messages as read)
    socket.on("markMessagesRead", async ({ toUserId }) => {
      try {
        await ChatModel.updateMany(
          { toUserId, isRead: false },
          { $set: { isRead: true } }
        );
        console.log(`Marked messages as read for conversation: ${userId} `);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // update fetch nearby service requests list when service is accepted
    socket.on("updateNearbyServices", async () => {
      try {
        // console.log(`Fetching nearby service requests `);
        const date = new Date();
        // Send the event back to the client
        io.to("ProvidersRoom").emit("nearbyServicesUpdate", {
          success: true,
          message: "Service list is need a update",
          date: date,
        });
      } catch (error) {
        socket.emit("nearbyServicesUpdate", {
          success: false,
          error: "Failed to fetch nearby services. Please try again.",
        });
      }
    });

    socket.on("acceptServiceRequest", async (requestId: string) => {
      console.log({ requestId });

      console.log(
        `Service provider with _id ${userId} accepted the request ${requestId}`
      );
      //execute get single service request to get  associated userId
      const customerId = await fetchAssociatedCustomer(requestId);
      // Notify the customer that the service provider is on the way
      if (customerId && connectedCustomers[customerId]) {
        io.to(connectedCustomers[customerId]).emit("serviceProviderAccepted", {
          message: `A service provider with userId ${userId} is on the way`,
          requestId,
        });
      }

      // Handle service provider's location updates and send them to the customer
      socket.on(
        "locationUpdate",
        async (location: { latitude: number; longitude: number }) => {
          if (customerId && connectedCustomers[customerId]) {
            io.to(connectedCustomers[customerId]).emit(
              "serviceProviderLocationUpdate",
              {
                latitude: location.latitude,
                longitude: location.longitude,
              }
            );
            // console.log("Service provider location update =>");
          }
        }
      );
    });

    //Declne service request by service provider
    socket.on("declineServiceRequest", async (requestId: string) => {
      console.log("socket on for declineServiceRequest");
      console.log({ requestId });

      console.log(
        `Service provider with _id ${userId} declined the request ${requestId}`
      );
      //execute get single service request to get  associated userId
      const customerId = await fetchAssociatedCustomer(requestId);
      // Notify the customer that the service provider is on the way
      if (customerId && connectedCustomers[customerId]) {
        io.to(connectedCustomers[customerId]).emit("serviceProviderDeclined", {
          message: `A service provider with userId ${userId}  declined the request.`,
          requestId,
        });
      }

      // Handle service provider's location updates and send them to the customer
      socket.on(
        "locationUpdate",
        async (location: { latitude: number; longitude: number }) => {
          if (customerId && connectedCustomers[customerId]) {
            io.to(connectedCustomers[customerId]).emit(
              "serviceProviderLocationUpdate",
              {
                latitude: location.latitude,
                longitude: location.longitude,
              }
            );
            // console.log("Service provider location update =>");
          }
        }
      );
    });

    // update fetch nearby service requests list when service is assigned
    socket.on("serviceAssigned", async () => {
      try {
        // console.log(`Accepted service is assigned to field agent`);
        const date = new Date();
        // Send the event back to the client
        io.to("ProvidersRoom").emit("jobListUpdate", {
          success: true,
          message: "Service list is need a update",
          date: date,
        });
      } catch (error) {
        socket.emit("jobListUpdate", {
          success: false,
          error: "Failed to assign field agent. Please try again.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("socket disconnect");
    });
  });

  return io;
};
