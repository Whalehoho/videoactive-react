"use client"; // Ensure it's a client component

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser } from "../services/api";


const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const router = useRouter();
  const socketRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [onlineContacts, setOnlineContacts] = useState([]);
  const [incomingCalls, setIncomingCalls] = useState([]); // Store incoming call data
  const [offerData, setOfferData] = useState(null); // Store offer data
  const [answerData, setAnswerData] = useState(null); // Store answer data
  const [hangUpData, setHangUpData] = useState(null); // Store hang-up data
  const [iceCandidateData, setIceCandidateData] = useState(null); // Store ICE candidate data

  useEffect(() => {
      fetchUser().then((data) => {
        if (!data) {
          router.push("/auth");
        } else {
          console.log("User data: ", data);
          setClientId(data.user.uid);
        }
      });
      
    }, []);

  useEffect(() => {
    if (!clientId || clientId === "DefaultClient") return;

    try {
      const socketConnection = new WebSocket(
        `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?clientId=${clientId}`
      );

      socketConnection.onopen = () => {
        console.log("Connected to WebSocket server");
      };

      socketConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
          console.log("Message received from server: ", message);
        } catch (error) {
          console.error(error);
        }
      };

      socketConnection.onclose = () => {
        console.log("Disconnected from WebSocket server");
      };

      socketRef.current = socketConnection;
    } catch (error) {
      console.error(error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [clientId]);

  // Handle incoming messages
  const handleMessage = (message) => {
    switch (message.type) {
      case "contacts-online":
        setOnlineContacts(message.contacts);
        break;
      case "signal":
        handleSignalingMessage(message);
        break;
      default:
        console.warn("Unknown message type:", message.type);
        break;
    }
  };

  // Handle incoming signaling messages
  const handleSignalingMessage = (message) => {
    console.log("Signal received: ", message);
    switch (message.signalType) {
        case 'offer':
            console.log("Incoming call from:", message.from);
            setIncomingCalls(prevCalls => [...prevCalls, message]); // Add to the queue
            break;
        case 'answer':
            console.log("Answer received from:", message.from);
            setAnswerData(message);
            break;
        case 'hang-up':
            console.log("Hang-up received from:", message.from);
            setIncomingCalls(prevCalls => prevCalls.filter(call => call.from !== message.from)); // Remove from the queue
            setHangUpData(message);
            break;
        case 'ice-candidate':
            console.log("ICE candidate received from:", message.from);
            setIceCandidateData(message);
            break;
        default:
            console.warn("Unknown signal type: ", message.signalType);
            break;
    }
  }

  useEffect(() => {
    if(incomingCalls.length > 0) {
        console.log("Incoming call detected");
        console.log("Incoming call data: ", incomingCalls);
    }
  }, [incomingCalls]);

  return (
    <WebSocketContext.Provider value={
        {   socketRef, 
            clientId, 
            onlineContacts, setOnlineContacts, 
            incomingCalls, setIncomingCalls, 
            offerData, setOfferData,
            answerData, setAnswerData, 
            hangUpData, setHangUpData,
            iceCandidateData, setIceCandidateData 
        }
    }>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
