"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchAuthToken, acceptContactRequest } from "../services/api"; // ✅ Use centralized API function
import Modal from "../components/Modal"; // Import the Modal component
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css'; // Import the styles for the resizable component
import { resolve } from "styled-jsx/css";

// Random call does not use WebSocketContext because unlike direct call, we only need to establish a connection when starting a call
export default function ConnectionPage() {
  const socketRef = useRef(null);
  const [authToken, setAuthToken] = useState(null);
  const [pairId, setPairID] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [status, setStatus] = useState("disconnected"); // disconnected, searching, connected
  const [offerData, setOfferData] = useState(null);
  const [answerData, setAnswerData] = useState(null);
  const [contactStatus, setContactStatus] = useState("none"); // none, pending, accepted
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingFriendId, setPendingFriendId] = useState(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [iceCandidateData, setIceCandidateData] = useState(null);
  const candidateQueue = useRef([]);

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ICE serves help establish a connection between peers by bypassing NAT and firewalls
  // STUN servers help find the public IP address of a user
  // TURN servers help relay media if direct connection fails, consumes more bandwidth, and is slower
  // We use free TURN servers from Xirsys, so calls might fail ocassionally
  // const iceServers = {
  //   iceServers: [
  //     { urls: 'stun:stun.l.google.com:19302' },
  //     { urls: 'stun:stun2.l.google.com:19302' },
  //     {
  //       urls: "turn:global.xirsys.net",
  //       username: process.env.NEXT_PUBLIC_XIRSYS_USERNAME,
  //       credential: process.env.NEXT_PUBLIC_XIRSYS_CREDENTIAL,
  //     }
  //   ],
  // };

  const iceServers = {
    iceServers: [
      {
        urls: process.env.NEXT_PUBLIC_STUN_SERVER,
      },
      {
        urls: process.env.NEXT_PUBLIC_TURN_SERVER_UDP,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
      {
        urls: process.env.NEXT_PUBLIC_TURN_SERVER_TCP,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
      {
        urls: process.env.NEXT_PUBLIC_TURN_SERVER_TLS,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
      {
        urls: process.env.NEXT_PUBLIC_TURNS_SERVER_TCP,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
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
      // console.log(user);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchToken = async () => {
      const token = localStorage.getItem("authToken");
      setAuthToken(token);
    };
    fetchToken();
  }, [user]);

  useEffect(() => {
    // This cleanup function will run when component unmounts
    return () => {
      console.log("Component unmounting - cleaning up");
      hangUp();
    };
  }, []); // Empty dependency array means this runs only on mount/unmount


  const startCall = async () => {
    if (!authToken) {
      console.error("Auth token not available.");
      return;
    }
    try {
      // 1. Set call status to in-progress
      localStorage.setItem('callStatus', 'in-progress');
      setStatus("searching");
      await getLocalMedia();

      // 2. Establish WebSocket connection
      const socketConnection = new WebSocket(`${process.env.NEXT_PUBLIC_BACKEND_WEBSOCKET_URL}/ws/random?authToken=${authToken}`);
      socketConnection.onopen = () => {
        console.log("Connected to WebSocket server");
        setStatus("searching");
      };

      // 3. Handle incoming messages, the first incoming message should be match-found
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
        setContactStatus("none");
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
    setContactStatus("none");
    setIsCaller(false);
    setOfferData(null);
    setAnswerData(null);
    setIceCandidateData(null);
    candidateQueue.current = [];

    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
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

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    if (socketRef.current) {
      if (pairId) {
        const message = {
          type: 'hang-up',
          pairId: pairId
        };
        socketRef.current.send(JSON.stringify(message));
      }
      setPairID(null);
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    // Reset call status
    localStorage.setItem('callStatus', 'disconnected');
    // Reload the page (hard reload), do this avoid all bugs=_=
  // window.location.reload();

  //print all related things to check if the peer connection is fully reset

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
      case 'peer-disconnected': // Peer disconnected, hang up the call
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
    console.log("My role:", message.role);
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
    if (!localStreamRef.current) {
      await getLocalMedia();
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    peerRef.current = new RTCPeerConnection(iceServers);

    localStreamRef.current.getTracks().forEach(track => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    peerRef.current.ontrack = (event) => {
      const remoteStream = event.streams[0];

      console.log("Incoming remote stream:", event.streams[0])
      console.log("Check stream tracks:", remoteStream.getTracks())
      console.log("Check video tracks:", remoteStream.getVideoTracks())

      // Force Video Rendering by Restarting Track
      // if(remoteStream.getVideoTracks()){
      //   remoteStream.getVideoTracks().forEach(track => {
      //     track.enabled = false;
      //     setTimeout(() => (track.enabled = true), 500);
      //   });
        
      // }
    
      // Avoid setting the srcObject multiple times
      if (!remoteVideoRef.current.srcObject || remoteVideoRef.current.srcObject !== remoteStream) {
        remoteStreamRef.current = remoteStream;
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("Setting up remote video with remote stream")
      }

    
      // Delay playing the video slightly
      setTimeout(() => {
        console.log("Remote video Status:", remoteVideoRef.current.readyState);
        if (remoteVideoRef.current.paused || remoteVideoRef.current.ended) {
          remoteVideoRef.current.play().then(
            () => {
              console.log("Playing video")
            }
          ).catch(error => {
            console.error("Error playing remote video:", error);
          });
        }
      }, 500); // Add slight delay to allow proper loading
    };

    peerRef.current.onicecandidate = (event) => { // When available ice candidate is found
      if (event.candidate) {
        // console.log("Sending ICE candidate to peer: ", event.candidate);
        sendSignalingMessage('ice-candidate', event.candidate);
      }
    };
  };

  // Create an offer
  const createOffer = async () => {
    // console.log('socketRef: ', socketRef);
    try {
      if (!peerRef.current) {
        await createPeerConnection(); // Ensure peerRef.current is set
      }
      // console.log("peerRef.current: ", peerRef.current);
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      // console.log("Offer created: ", offer);
      sendSignalingMessage('offer', offer);
      // Sleep a bit to ensure callee have enuf time to set up peer connection
      await new Promise((resolve) => setTimeout(resolve, 3000));
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
        // console.log("Local media stream obtained.", stream);
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
      // role: isCaller===true ? 'caller' : 'callee',
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
      case 'offer': // Incoming WebRTC offer (In random call, websocket server decides who sends offer)
        handleOffer(message.signalData);
        break;
      case 'answer': // Incoming WebRTC answer
        handleAnswer(message.signalData);
        break;
      case 'ice-candidate': // Incoming ICE candidate
        setIceCandidateData(message);
        break;
      case 'contact-request': // Peer wants to add you as a contact
        handleContactRequest(message.signalData);
        break;
      case 'accept-request': // Peer accepted your contact request
        handleAcceptRequest(message.signalData);
        break;
      default:
        console.warn("Unknown signal type: ", message.signalType);
        break;
    }
  };

  //When receiving an incoming ICE candidate
  useEffect(() => {
    if (!iceCandidateData) {
      return;
    }
  
    const handleIceCandidate = async (message) => {
      // Candidate must be added after setting remote description
      if (!peerRef.current) {
        console.warn("Peer connection not initialized. ICE candidate queued.");
        candidateQueue.current.push(message.signalData); // Queue the candidate
        return;
      }
  
      else if (!peerRef.current.remoteDescription) {
        console.warn("Remote description not set yet. ICE candidate queued.");
        candidateQueue.current.push(message.signalData); // Queue the candidate
        return;
      }
  
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(message.signalData));
        // console.log("ICE candidate added successfully.");
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    };
  
    handleIceCandidate(iceCandidateData);
  }, [iceCandidateData]);
  
  // Process queued ICE candidates after setting remote description
  const processQueuedCandidates = async () => {
    if (!peerRef.current || !peerRef.current.remoteDescription) {
      console.warn("Cannot process ICE candidates: Remote description not set.");
      return;
    }

    if(candidateQueue.current.length <= 0) {
      console.log("No ICE candidate in queue");
    }
  
    while (candidateQueue.current.length > 0) {
      var i = 0;
      const candidate = candidateQueue.current.shift();
      peerRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => 
        { 
          console.log(++i)
        }
        )
        .catch(error => console.error("Error adding queued ICE candidate:", error));
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
    await createPeerConnection();
    console.log("Setting remote description with offer data: ", offerData);
    await peerRef.current.setRemoteDescription(offerData);
    await processQueuedCandidates(); 
    await createAnswer();
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
        await processQueuedCandidates(); // Add ICE candidates that were stored earlier
    };
    console.log("Answer signal data: ", answerData.signalData);
    handleAnswer(answerData.signalData);
  }, [answerData]);

  // Handle an incoming answer
  const handleAnswer = async (message) => {
    console.log("Answer received: ", message);
    // setAnswerData(message);
    console.log("Setting remote description with answer data: ", message);
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(message))
      .catch(error => {
        console.error("Error setting remote description: ", error);
      });
      await processQueuedCandidates();
  };

  // Handle contact request
  const handleContactRequest = (message) => {
    console.log("Contact request received: ", message);
    const { clientId } = message;
    setPendingFriendId(clientId);
    setIsModalOpen(true);
  };

  // Handle accept request
  const handleAcceptRequest = (message) => {
    setContactStatus("accepted");
  };

  const sendContactRequest = () => {
    sendSignalingMessage('contact-request', { clientId: user.uid });
    setContactStatus("pending");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPendingFriendId(null);
  };

  const handleModalConfirm = () => {
    if (pendingFriendId) {
      acceptContactRequest(pendingFriendId).then(() => {
        sendSignalingMessage('accept-request', { clientId: user.uid });
        setContactStatus("accepted");
      });
    }
    handleModalClose();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex flex-row h-[80%] relative">
        {/* Left Section */}
        <div className="w-1/4 py-20 flex flex-col items-center space-y-12">
          <p className="text-gray-500 text-lg">Status: {status}</p>
          {status === "disconnected" && (
            <button
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
              onClick={startCall}
            >
              Start Call
            </button>
          )}
          {(status === "searching" || status === "connected") && (
            <button
              onClick={hangUp}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600  transition"
            >
              Hang Up
            </button>
          )}
        </div>

        {/* Right Section (Remote Video) */}
        <div className="flex-1 flex items-end justify-center relative">
          <div
            className="w-full h-full flex-1 flex items-center justify-center rounded-lg border-0 border-gray-700"
            // resizeHandles={["nw"]}
          >

            {/* Video remains positioned normally inside ResizableBox */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="relative z-10 w-full h-full rounded-lg"
            />
                {status === "connected" && (
                  <p className="absolute z-0 inset-0 flex items-center justify-center text-lg text-gray-700">
                    Receiving media from peer...
                  </p>
                )}
          </div>
        </div>

  

        {/* Local Video in Bottom Left Corner */}
        <div className="absolute z-20 bottom-0 left-4">
        <ResizableBox
          width={250}
          height={160}
          minConstraints={[250, 160]}
          maxConstraints={[500, 480]}
          className="absolute bottom-0 left-4 rounded-lg border border-black"
          resizeHandles={["ne"]}
        >
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
          <p className="text-center text-sm text-white bg-gray-700">local video</p>
        </ResizableBox>
        </div>
      </div>
      {/* Contact Request Section */}
      <div className="mt-4 text-center">
        {status === "connected" && (
          <>
            {contactStatus === "none" && (
              <button
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
                onClick={sendContactRequest}
              >
                Add to Contact
              </button>
            )}
            {contactStatus === "pending" && (
              <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg" disabled>
                Pending
              </button>
            )}
            {contactStatus === "accepted" && (
              <button className="bg-green-500 text-white px-6 py-3 rounded-lg" disabled>
                Accepted
              </button>
            )}
          </>
        )}
      </div>
      {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <Modal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          message={`You have a contact request from ${pendingFriendId}. Do you accept?`}
        />
      </div>
    )}
      
    </div>
  );
}
