"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchContacts } from "../services/api"; // ✅ Use centralized API function

export default function ConnectionPage() {
  const socketRef = useRef(null);
  const [pairId, setPairID] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [status, setStatus] = useState("disconnected"); // disconnected, searching, connected
  const [offerData, setOfferData] = useState(null);
  const [answerData, setAnswerData] = useState(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

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
    console.log("XIRSYS_USERNAME: ", process.env.NEXT_PUBLIC_XIRSYS_USERNAME);
    console.log("XIRSYS_CREDENTIAL: ", process.env.NEXT_PUBLIC_XIRSYS_CREDENTIAL);
    fetchUser().then((data) => {
      if (!data) {
        router.push("/auth");
      } else {
        setUser(data.user);
      }
      setLoading(false);
      console.log(user);
    });
  }, []);

  useEffect(() => {
    // This cleanup function will run when component unmounts
    return () => {
        console.log("Component unmounting - cleaning up");
        hangUp();
    };
  }, []); // Empty dependency array means this runs only on mount/unmount


  const startCall = async () => {
    try {
      // Check if a call is already in progress
      const callStatus = localStorage.getItem('callStatus');
      if (callStatus === 'in-progress') {
        alert("A call is already in progress. Please try again later.");
        return;
      }

      // Set call status to in-progress
      localStorage.setItem('callStatus', 'in-progress');
      setStatus("searching");
      await getLocalMedia();

      const socketConnection = new WebSocket(`${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/random`);
      socketConnection.onopen = () => {
        console.log("Connected to WebSocket server");
        setStatus("searching");
      };

      socketConnection.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("Error parsing message: ", error);
        }
      };

      socketConnection.onclose = () => {
        console.log("Disconnected from WebSocket server");
        setStatus("disconnected");
        // Reset call status
        localStorage.setItem('callStatus', 'disconnected');
      };

      socketRef.current = socketConnection;
    } catch (error) {
      console.error("Error starting call: ", error);
      hangUp();
    }
  };

  const hangUp = () => {
    setStatus("disconnected");
    setPairID(null);
    setIsCaller(false);
    setOfferData(null);

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject = null;
      }
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = null;
      }
    }

    if (socketRef.current) {
      if (pairId) {
        const message = {
          type: 'hang-up',
          pairId: pairId
        };
        socketRef.current.send(JSON.stringify(message));
      }
      socketRef.current.close();
    }

    // Reset call status
    localStorage.setItem('callStatus', 'disconnected');
  };

  // Handle incoming WebSocket messages
  const handleMessage = (message) => {
      switch (message.type) {
          case 'match-found':
              handleMatchFound(message);
              break;
          case 'signal':
              handleSignalingMessage(message);
              break;
          case 'peer-disconnected':
              console.log("Peer disconnected.");
              hangUp();
              break;
          default:
              console.warn("Unknown message type: ", message.type);
              break;
      }
  };

  // Handle a match found message
  const handleMatchFound = async (message) => {
      console.log("Match found with pair ID: ", message.pairId);
      setPairID(message.pairId);
      setIsCaller(message.role === 'caller');
      setStatus("connected");

      // Start WebRTC if you are the caller
      if (message.role === 'caller') {
          await createPeerConnection();
          await createOffer(); 
      }
  };

  // Create peer connection and add media tracks
  const createPeerConnection = async () => {
      if(!localStreamRef.current) {
          await getLocalMedia();
      }

      peerRef.current = new RTCPeerConnection(iceServers);

      localStreamRef.current.getTracks().forEach(track => {
          peerRef.current.addTrack(track, localStreamRef.current);
      });

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

      peerRef.current.onicecandidate = (event) => { // When available ice candidate is found
          if (event.candidate) {
              console.log("Sending ICE candidate to peer: ", event.candidate);
              sendSignalingMessage('ice-candidate', event.candidate);
          }
      };
  };

  // useEffect(() => {
  //     if(!peerRef.current) { return; }
  //     createOffer();
  // }, [peerRef.current]);

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

  // Send signaling message to the server
  const sendSignalingMessage = (type, signal) => {
      const message = {
          type: 'signal',
          pairId: pairId,
          pairId: pairId,
          role: isCaller ? 'caller' : 'callee',
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
              handleOffer(message.signalData);
              break;
          case 'answer':
              handleAnswer(message.signalData);
              break;
          case 'ice-candidate':
              // Add candidate immediately if possible
              if(!peerRef || !peerRef.current) {
                  peerRef.current = new RTCPeerConnection(iceServers);
              }
              peerRef.current.addIceCandidate(new RTCIceCandidate(message.signalData)).catch(error => {
                  console.error("Error adding ICE candidate:", error);
              });
              break;
          default:
              console.warn("Unknown signal type: ", message.signalType);
              break;
      }
  };

  // Handle an incoming offer
  const handleOffer = async (offer) => {
      console.log("Offer received: ", offer);
      setOfferData(offer); // Handle the offer in the useEffect hook to ensure the offer is set before creating the answer
  };

  useEffect(() => {
      if (!offerData) {
          return;
      }
      processOffer(offerData);
  }, [offerData]);

  // Process offer
  const processOffer = async (offerData) => {
      await getLocalMedia();
      createPeerConnection();
      console.log("Setting remote description with offer data: ", offerData);
      await peerRef.current.setRemoteDescription(offerData);
      createAnswer();
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

  // Handle an incoming answer
  const handleAnswer = async (message) => {
      console.log("Answer received: ", message);
      setAnswerData(message);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(message))
          .catch(error => {
              console.error("Error setting remote description: ", error);
          });
  };

  const handleRandomCall = async () => {
    console.log("Starting a random call...");
    console.log(user);
    const response = await fetchContacts();
    console.log(response);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col md:flex-row">
        <section className="flex-1 flex flex-col items-center justify-center p-10">
          {/* <h1 className="text-2xl text-black font-bold">
            My Username: <span className="text-pink-600">{user?.email || "Guest"}</span>
          </h1> */}
          <div>
                {status === "disconnected" && (
                    <button 
                        className="bg-green-500 text-white px-6 py-3 rounded-lg mt-5 hover:bg-green-600 transition"
                        onClick={startCall}
                    >Start Call
                    </button>
                )}
                {(status === "searching" || status === "connected") && (
                    <button 
                        onClick={hangUp}
                        className="bg-red-500 text-white px-6 py-3 rounded-lg mt-5 hover:bg-red-600 transition"    
                    >Hang Up</button>
                )}
                <p>Status: {status}</p>
            </div>
            <div>
                <video ref={localVideoRef} autoPlay playsInline muted></video>
                <video ref={remoteVideoRef} autoPlay playsInline></video>
            </div>
        </section>
      </main>
    </div>
  );
}
