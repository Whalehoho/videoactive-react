"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchContacts, insertMessage } from "../services/api"; // ✅ Use centralized API function
import { useWebSocket } from '../context/WebSocketContext'; // ✅ Use WebSocket context
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css'; // Import the styles for the resizable component

export default function ConnectionPage() {
  const { 
    socketRef, 
    clientId, 
    onlineContacts, setOnlineContacts, 
    incomingCalls, setIncomingCalls, 
    offerData, setOfferData,
    answerData, setAnswerData, 
    hangUpData, setHangUpData,
    iceCandidateData, setIceCandidateData,
    sendSignalingMessage,
    messageHistory, setMessageHistory
  } = useWebSocket();
  const [targetClientId, setTargetClientId] = useState(null);
  const targetClientIdRef = useRef(targetClientId);
  const [status, setStatus] = useState("idle");
  const statusRef = useRef(status);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueue = useRef([]);

  const [contacts, setContacts] = useState([]);
  const [messageToSend, setMessageToSend] = useState("");
 

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: "turn:global.xirsys.net",
          username: process.env.NEXT_PUBLIC_XIRSYS_USERNAME,
          credential: process.env.NEXT_PUBLIC_XIRSYS_CREDENTIAL,
        }
    ],
  };

  

  useEffect(() => {
    //print online contacts
    console.log("Online contacts: ", onlineContacts);
  }, [onlineContacts]);

  useEffect(() => {
    //print message history
    console.log("Message history: ", messageHistory);
  }, [messageHistory]);

  useEffect(() => {
    fetchUser().then((data) => {
      if (!data) {
        router.push("/auth");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
    
    // fetchContacts().then((data) => {
    //   if (data && data.contacts) {
    //     setContacts(data.contacts);
    //   }
    // }); // Should only fetch online contacts, use websocket instead
  }, []);

  useEffect(() => {
    //fetch contacts
    const fetchContactsData = async () => {
      await fetchContacts().then((data) => {
        if (data && data.contacts) {
          console.log("Contacts fetched: ", data.contacts);
          setContacts(data.contacts);
        }
      });
    };
    fetchContactsData();
  }, []);

  useEffect(() => {
    // This cleanup function will run when component unmounts
    return () => {
        console.log("Component unmounting - cleaning up");
        hangUp();
    };
  }, []); // Empty dependency array means this runs only on mount/unmount

  //When receiving an incoming answer
  useEffect(() => {
    if (!answerData) {
      return;
    }
    const handleAnswer = async (message) => {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(message))
        .catch(error => {
            console.error("Error setting remote description: ", error);
        });
        processQueuedCandidates(); // Add ICE candidates that were stored earlier
    };
    console.log("Answer signal data: ", answerData.signalData);
    handleAnswer(answerData.signalData);
  }, [answerData]);

  //When receving a hang-up signal
  useEffect(() => {
    if (!hangUpData) {
      return;
    }
    hangUp();
  }, [hangUpData]);

  //When receiving an incoming ICE candidate
  useEffect(() => {
    if (!iceCandidateData) {
      return;
    }
  
    const handleIceCandidate = async (message) => {
      if (!peerRef.current) {
        console.warn("Peer connection not initialized. ICE candidate queued.");
        candidateQueue.current.push(message.signalData); // Queue the candidate
        return;
      }
  
      if (!peerRef.current.remoteDescription) {
        console.warn("Remote description not set yet. ICE candidate queued.");
        candidateQueue.current.push(message.signalData); // Queue the candidate
        return;
      }
  
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(message.signalData));
        console.log("ICE candidate added successfully.");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };
  
    handleIceCandidate(iceCandidateData);
  }, [iceCandidateData]);
  
  // Process queued ICE candidates after setting remote description
  const processQueuedCandidates = () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) {
      console.warn("Cannot process ICE candidates: Remote description not set.");
      return;
    }
  
    while (candidateQueue.current.length > 0) {
      const candidate = candidateQueue.current.shift();
      peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log("Queued ICE candidate added."))
        .catch(error => console.error("Error adding queued ICE candidate:", error));
    }
  };

  const startCall = async () => {
    try{
      if(!targetClientId) return;
      console.log("Starting call with: ", targetClientId);
      setStatus("calling");
      statusRef.current = "calling";
      // await getLocalMedia();
      await createPeerConnection();
      await createOffer();
    } catch (error) {
      console.error(error);
    }
  };

  const answerCall = async () => {
    try {
      if(!targetClientId) return;
      setIncomingCalls(prevCalls => prevCalls.filter(call => String(call.from) !== String(targetClientId))); // Remove from the queue
      console.log("Answering call from: ", targetClientId);
      setStatus("calling");
      statusRef.current = "calling";
      // Set offer data from incoming call
      const remoteOfferData = incomingCalls.find(call => String(call.from) === String(targetClientId))?.signalData;
      if(!remoteOfferData) {
        console.error("No offer data found for incoming call.");
        return;
      }
      // await getLocalMedia();
      await createPeerConnection();
      console.log("Setting remote description with offer data: ", remoteOfferData);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(remoteOfferData));
      processQueuedCandidates(); // Add ICE candidates that were stored earlier
      await createAnswer();
    } catch (error) {
      console.error(error);
    }
  };

  const hangUp = () => {
    if(statusRef.current === "idle") {
      console.log("No active call to hang up.");
      return;
    }
    console.log("Hanging up call...");
    setStatus("idle");
    statusRef.current = "idle";
    console.log("Sending hang-up signal from: ", clientId, " to: ", targetClientId);
    sendSignalingMessage('hang-up', targetClientIdRef.current, clientId, null); // Use ref to get the target client ID because it may have been reset
    setTargetClientId(null);
    targetClientIdRef.current = null;
    setOfferData(null);

    if(peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      if(localVideoRef.current && localVideoRef.current.srcObject) {
          localVideoRef.current.srcObject = null;
      }
    }

    if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
        remoteStreamRef.current = null;
        if(remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            remoteVideoRef.current.srcObject = null;
        }
    }


  };

  // Modified getLocalMedia to return the stream
  const getLocalMedia = async () => {
    try {
    if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
        });
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        console.log("Local media stream obtained.", stream);
    }
    return localStreamRef.current;
    } catch (error) {
    console.error("Error accessing media devices.", error);
    throw error;
    }
  };

  // Create peer connection and add media tracks
  const createPeerConnection = async () => {
    if(!localStreamRef.current) {
      console.log("Local media stream not available. Fetching...");
        await getLocalMedia();
    }

    peerRef.current = new RTCPeerConnection(iceServers);

    localStreamRef.current.getTracks().forEach(track => {
        peerRef.current.addTrack(track, localStreamRef.current);
    });

     // Debugging logs
     console.log("Local tracks added: ", localStreamRef.current.getTracks());

    peerRef.current.ontrack = (event) => {
        const remoteStream = event.streams[0];
        const videoTracks = remoteStream.getVideoTracks();

        console.log("Remote stream received with tracks: ", videoTracks);

        if (videoTracks.length > 0) {
            remoteStreamRef.current = remoteStream;
            remoteVideoRef.current.srcObject = remoteStream;
        } else {
            console.warn("No video tracks found in remote stream");
        }

        console.log("Is video playing? ", remoteVideoRef.current.paused);

        // Check if the remote stream is already assigned
        if(remoteVideoRef.current.srcObject !== remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("Remote stream assigned to video element.");
            console.log("Is video playing? ", remoteVideoRef.current.paused);
        }

        // Now, attempt to play the video
        if(remoteVideoRef.current.paused || remoteVideoRef.current.ended) {
            remoteVideoRef.current.play().then(() => {
                console.log("Remote video is playing.");
            }).catch((error) => {
                console.error("Error playing remote video: ", error);
            });
        }
    };

    peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("Sending ICE candidate to peer: ", event.candidate);
            sendSignalingMessage('ice-candidate', targetClientId, clientId, event.candidate);
        }
    };
  };


  // Create an offer
  const createOffer = async () => {
    console.log('socketRef: ', socketRef);
    try {
        if (!peerRef.current) {
            createPeerConnection(); // Ensure peerRef.current is set
        }
        console.log("peerRef.current: ", peerRef.current);
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        console.log("Offer created: ", offer);
        sendSignalingMessage('offer', targetClientId, clientId, offer);
    } catch (error) {
        console.error("Error creating offer: ", error);
    }
  };


  // Create an answer
  const createAnswer = async () => {
      try {
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          console.log("Answer created: ", answer);
          sendSignalingMessage('answer', targetClientId, clientId, answer);
      } catch (error) {
          console.error("Error creating answer: ", error);
      }
  };

  const sendMessage = async () => {
    if (!messageToSend || !targetClientId) return;
    console.log(`Sending message from ${clientId} to ${targetClientId}: `, messageToSend);
    const createdAt = new Date().toISOString();
    sendSignalingMessage(
      'instant-message', 
      targetClientId, clientId, 
      { 
        senderName: user.username,
        content: messageToSend, 
        createdAt: createdAt
       }
    );
    setMessageHistory(prevMessages => [...prevMessages, { sender: clientId, receiver: targetClientId, message: messageToSend, createdAt: createdAt }]);
    await insertMessage(messageToSend, clientId, targetClientId); // ✅ Insert message into database
    setMessageToSend("");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col md:flex-row relative">
        {/* Sidebar - Online Contacts */}
        <aside className="w-full md:w-1/5 bg-gray-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Contacts</h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mt-2 text-black border border-gray-300 rounded"
          />
          <ul className="space-y-2">
            {contacts
              .filter((contact) =>
                contact?.contactName.toLowerCase().includes(search.toLowerCase())
              )
              .map((contact) => {
                const isOnline = onlineContacts.some(
                  (online) => String(online.contactId) === String(contact.contactId)
                );

                const hasIncomingCall = incomingCalls.some(
                  (call) => String(call.from) === String(contact.contactId)
                );

                return (
                  <li
                    key={contact.contactId}
                    onClick={() => {
                        setTargetClientId(contact.contactId);
                        targetClientIdRef.current = contact.contactId;
                      }
                    }
                    className={`relative p-2 rounded-lg cursor-pointer ${
                      targetClientId === contact.contactId ? "" : ""
                    } hover:bg-blue-400 hover:text-white`}
                  >
                    <span className={isOnline ? "text-green-400 font-semibold" : ""}>
                      {contact.contactName}
                    </span>
                    {hasIncomingCall && (
                      <span className="absolute top-1 right-2 w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                    )}
                  </li>
                );
              })}
          </ul>
        </aside>
  
        {/* Chat Box - Resizable and Positioned Correctly */}
        { (targetClientId) &&
          <div className="absolute top-4 left-1/4 z-50  rounded-lg p-4 ">
            <ResizableBox
              width={400}
              height={200}
              minConstraints={[300, 150]}
              maxConstraints={[600, 800]}
              className="rounded-lg overflow-hidden bg-white border-2 border-gray-700"
              resizeHandles={["se"]}
            >
              <div className="flex flex-col h-full">
                {/* Message History */}
                <div className="flex-grow overflow-y-auto border-b-2 border-gray-500 p-2">
                  {messageHistory
                    .filter(
                      (msg) =>
                        String(msg.sender) === String(clientId) && String(msg.receiver) === String(targetClientId) || 
                        String(msg.sender) === String(targetClientId) && String(msg.receiver) === String(clientId)
                    )
                    .map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          String(msg.sender) === String(targetClientId) ? "justify-start" : "justify-end"
                        } p-2`}
                      >
                        <div
                          className={`rounded-lg px-3 py-2 max-w-xs ${
                            String(msg.sender) === String(targetClientId)
                              ? "bg-gray-200 text-black"
                              : "bg-gray-200 text-black"
                          }`}
                        >
                          <span className="font-semibold">
                            {String(msg.sender) === String(targetClientId) ? `${msg.senderName}:` : ""}
                          </span>{" "}
                          {msg.message}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Input and Send Button */}
                <div className="flex items-center space-x-2 p-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageToSend}
                    onChange={(e) => setMessageToSend(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        await sendMessage();
                      }
                    }}
                    className="flex-1 p-2 text-black border border-gray-300 rounded"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </ResizableBox>
          </div>
        }

  
        {/* Video Call Section */}
        <section className="flex-1 flex flex-col items-center justify-center p-10 relative">
          <h2 className="text-xl font-bold mb-4">UserName: {user?.username}</h2>
          <div className="mb-2 text-lg">
    {targetClientId ? (
      incomingCalls.some((call) => String(call.from) === String(targetClientId)) ? (
        <p>
          Answer{" "}
          <span className="font-semibold">
            {contacts.find((contact) => String(contact.contactId) === String(targetClientId))
              ?.contactName}
          </span>
        </p>
      ) : (
        <p>
          Calling:{" "}
          <span className="font-semibold">
            {contacts.find((contact) => String(contact.contactId) === String(targetClientId))
              ?.contactName}
          </span>
        </p>
      )
    ) : (
      <p className="text-gray-500">Select a contact to start a call.</p>
    )}
  </div>
  
          {/* Call Buttons */}
          {status === "idle" && (
    incomingCalls.some((call) => String(call.from) === String(targetClientId)) ? (
      <button
        onClick={answerCall}
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
      >
        Answer
      </button>
    ) : (
      <button
        onClick={startCall}
        className={`px-6 py-3 font-semibold rounded-lg shadow-md transition ${
          onlineContacts.some((online) => String(online.contactId) === String(targetClientId))
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
        }`}
        disabled={
          !onlineContacts.some((online) => String(online.contactId) === String(targetClientId))
        }
      >
        Start Call
      </button>
    )
  )}
  
          {status === "calling" && (
            <>
              <div className="w-full h-[60vh] flex items-end justify-start relative">
                <ResizableBox
                  width={800}
                  height={500}
                  minConstraints={[800, 500]}
                  maxConstraints={[1500, 700]}
                  className="rounded-lg"
                  resizeHandles={["ne"]}
                >
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                </ResizableBox>
              </div>
              <button
                onClick={hangUp}
                className="px-6 py-3 mt-4 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition"
              >
                Hang Up
              </button>
            </>
          )}
  
          {/* Local Video - Positioned Absolutely */}
          {status === "calling" && (
            <div className="absolute top-4 right-4">
              <ResizableBox
                width={250}
                height={160}
                minConstraints={[250, 160]}
                maxConstraints={[500, 480]}
                className="absolute bottom-0 left-4 rounded-lg border border-black"
                resizeHandles={["sw"]}
              >
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <p className="text-center text-sm text-white bg-gray-700">local video</p>
              </ResizableBox>
            </div>
          )}
        </section>
      </main>
    </div>
  );
  
  
}
