"use client"; // Ensure it's a client component

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchAuthToken } from "../services/api";


const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const router = useRouter();
  const socketRef = useRef(null);
  const [authToken, setAuthToken] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [onlineContacts, setOnlineContacts] = useState([]);
  const [incomingCalls, setIncomingCalls] = useState([]); // Store incoming call data
  const [offerData, setOfferData] = useState(null); // Store offer data
  const [answerData, setAnswerData] = useState(null); // Store answer data
  const [hangUpData, setHangUpData] = useState(null); // Store hang-up data
  const [iceCandidateData, setIceCandidateData] = useState(null); // Store ICE candidate data
  const [messageHistory, setMessageHistory] = useState([]);
  // messageHistory would be an array of objects with sender and message properties, sorted by timestamp
  // Example: [{ sender: "User1", message: "Hi", createdAt: "2022-01-01T12:00:00Z" }, ...]

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
      const fetchToken = async () => {
        if (!clientId || clientId === "DefaultClient") return;
        await fetchAuthToken().then((data) => {
          console.log("Auth token fetched: ", data);
          setAuthToken(data);
        });
      };
      fetchToken();
    }, [clientId]);



  useEffect(() => {
    console.log("clientId: ", clientId);
    console.log("authToken: ", authToken);
    if (!clientId || clientId === "DefaultClient") return;
    if (!authToken) return;

    try {

      console.log("authToken: ", authToken);
      const socketConnection = new WebSocket(
        `${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/direct?authToken=${authToken}`
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
  }, [clientId, authToken]);

  // Handle incoming messages
  const handleMessage = (message) => {
    switch (message.type) {
      case "online-contacts":
    if (Array.isArray(message.contacts)) {
      setOnlineContacts((prevContacts) => {
        // Filter out any undefined values from the previous contacts
        const filteredContacts = prevContacts.filter(contact => contact);
        
        // Merge new contacts, ensuring uniqueness based on contactId
        const newContacts = message.contacts.filter(newContact =>
          !filteredContacts.some(contact => String(contact.contactId) === String(newContact.contactId))
        );
        
        return [...filteredContacts, ...newContacts];
      });
    }
    break;


  case "contact-online":
    if (message.contact && message.contact.contactId) {
      setOnlineContacts((prevContacts) => {
        // Ensure no undefined values are included
        const filteredContacts = prevContacts.filter(contact => contact);
        
        // Prevent duplicates before adding
        const contactExists = filteredContacts.some(contact => String(contact.contactId) === String(message.contact.contactId));
        
        return contactExists ? filteredContacts : [...filteredContacts, message.contact];
      });
    }
    break;

  case "contact-offline":
    console.log("Contact offline: ", message.contact);
    if (message.contact && message.contact.contactId) {
      setOnlineContacts((prevContacts) =>
        prevContacts.filter(contact => contact && String(contact.contactId) !== String(message.contact.contactId))
      );
    }
    break;
      case "signal":
        handleSignalingMessage(message);
        break;
      default:
        console.warn("Unknown message type:", message.type);
        break;
    }
  };

  // Send signaling message to the server
  const sendSignalingMessage = (type, to, from, signal) => {
    const message = {
        type: 'signal',
        to: to,
        from: from,
        signalType: type,
        signalData: signal,
    };
    if (socketRef) {
        console.log("Sending signal: ", message);
        socketRef.current.send(JSON.stringify(message));
    } else {
        console.error("Socket connection not available.");
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
        case 'instant-message':
            console.log("Instant message received from:", message.from);
            setMessageHistory(prevMessages => [...prevMessages, { sender: message.from, senderName: message.signalData.senderName, message: message.signalData.content, createdAt: message.signalData.createdAt }]);
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
            iceCandidateData, setIceCandidateData,
            sendSignalingMessage,
            messageHistory, setMessageHistory 
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
