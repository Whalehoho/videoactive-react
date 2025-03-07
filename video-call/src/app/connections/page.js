"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchContacts } from "../services/api"; // ✅ Use centralized API function
import { useWebSocket } from '../context/WebSocketContext'; // ✅ Use WebSocket context

export default function ConnectionPage() {
  const { 
    socketRef, 
    clientId, 
    onlineContacts, setOnlineContacts, 
    incomingCalls, setIncomingCalls, 
    offerData, setOfferData,
    answerData, setAnswerData, 
    hangUpData, setHangUpData,
    iceCandidateData, setIceCandidateData  
  } = useWebSocket();
  const [targetClientId, setTargetClientId] = useState(null);
  const [status, setStatus] = useState("idle");
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const candidateQueue = useRef([]);

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
      console.log("Answering call from: ", targetClientId);
      setStatus("calling");
      // Set offer data from incoming call
      const remoteOfferData = incomingCalls.find(call => call.from === targetClientId)?.signalData;
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
    console.log("Hanging up call...");
    setStatus("idle");
    sendSignalingMessage('hang-up', null);
    setTargetClientId(null);
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
            sendSignalingMessage('ice-candidate', event.candidate);
        }
    };
  };

  

  // Send signaling message to the server
  const sendSignalingMessage = (type, signal) => {
    const message = {
        type: 'signal',
        to: targetClientId,
        from: clientId,
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
        sendSignalingMessage('offer', offer);
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
          sendSignalingMessage('answer', answer);
      } catch (error) {
          console.error("Error creating answer: ", error);
      }
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
          <h2 className="text-lg font-semibold">Online Contacts</h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mt-2 text-black border border-gray-300 rounded"
          />
          <ul className="space-y-2">
            {onlineContacts
              .filter((contact) =>
                contact.contactName.toLowerCase().includes(search.toLowerCase())
              ).map((contact) => {
                const hasIncomingCall = incomingCalls.some((call) => call.from === contact.contactId);

                return (
                  <li
                    key={contact.contactId}
                    onClick={() => setTargetClientId(contact.contactId)}
                    className={`relative p-2 rounded-lg cursor-pointer ${
                      targetClientId === contact ? "bg-blue-500 text-white" : ""
                    } hover:bg-blue-400 hover:text-white`}
                  >
                    {contact.contactName}
                    {hasIncomingCall && (
                      <span className="absolute top-1 right-2 w-3 h-3 bg-pink-600 rounded-full animate-pulse"></span>
                    )}
                  </li>
                );
              })}
          </ul>
        </aside>

        {/* Video Call Section */}
        <section className="flex-1 flex flex-col items-center justify-center p-10 relative">
          <h2 className="text-xl font-bold mb-4">UserName: {user?.username}</h2>
          <div className="mb-6 text-lg">
            {targetClientId ? (
              incomingCalls.some((call) => call.from === targetClientId) ? (
                <p>
                  Answer <span className="font-semibold">{onlineContacts.find(contact => contact.contactId === targetClientId)?.contactName}</span>
                </p>
              ) : (
                <p>
                  Calling: <span className="font-semibold">{onlineContacts.find(contact => contact.contactId === targetClientId)?.contactName}</span>
                </p>
              )
            ) : (
              <p className="text-gray-500">Select a contact to start a call.</p>
            )}
          </div>

          {/* Call Buttons */}
          {status === "idle" && (
            incomingCalls.some((call) => call.from === targetClientId) ? (
              <button
                onClick={answerCall}
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
              >
                Answer
              </button>
            ) : (
              <button
                onClick={startCall}
                className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition"
              >
                Start Call
              </button>
            )
          )}

          {status === "calling" && (
            <>
              <div className="w-full h-[90vh] flex items-center justify-center relative">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full" />
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
            <div className="absolute top-4 right-4 w-48 h-36 border border-black">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <p className="text-center text-sm text-white bg-gray-700">local video</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
