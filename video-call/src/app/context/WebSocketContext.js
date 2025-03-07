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
        setOnlineContacts(message.contacts);
        break;
      case "contact-online":
        useEffect(() => {
          // This cleanup function will run when component unmounts
          return () => {
              console.log("Component unmounting - cleaning up");
              hangUp();
          };
        }, []); // Empty dependency array means this runs only on mount/unmount
        break;
      case "contact-offline":
        setOnlineContacts((prevContacts) => prevContacts.filter(contact => contact.contactId !== message.contact.contactId));
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
