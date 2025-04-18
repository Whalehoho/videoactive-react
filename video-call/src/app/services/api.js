// calling frontend internal api routes from here and exporting them to be used in components

export const loginRedirectUrl = "/api/auth/login"; // will be used in auth page to redirect to google login page

export async function fetchAuthToken() {
  try {
    const response = await fetch("/api/auth/token", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch auth token");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching auth token:", error);
    return null;
  }
}

export async function handleLogout() { //this function will handle logout
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include", // ✅ Include cookies in request to tell backend it's a logged-in user
  });
}

export async function fetchUser() {// this function will validate token and return user data and will be used in every page for authentication
  try {
    const response = await fetch("/api/auth/getUser", {
      method: "GET",
      credentials: "include", // ✅ Include cookies in request

      
    });
    if (!response.ok) {
      return null;
    }
    return await response.json()
  } catch (error) {
    // console.error("Error fetching user:", error);
    return null;
  }
}

export async function updateUser(data) { // this function will call frontend server to call backend to update user data in profile page
  try {
    const response = await fetch("/api/user/updateProfile", {
      method: "POST",
      body: JSON.stringify(data),
      credentials: "include", // ✅ Ensures cookies are sent
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from Next.js API:", errorText);
      throw new Error("Failed to update user");
    }

    const result = await response.json();
    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

export async function uploadImage(file) { // this function specifically seperated in profile page to upload image.
  // console.log("Sending request to Next.js API:", file);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/user/uploadImage", {
      method: "POST",
      body: formData,
      credentials: "include", // ✅ Ensures cookies are sent
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return await response.json(); // Expected response: { url: "https://your-image-server.com/image.jpg" }
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
}

export async function fetchContacts() {// this function will validate token and return user data and will be used in every page for authentication
  try {
    const response = await fetch("/api/connections/getContacts", {
      method: "GET",
      credentials: "include", // ✅ Include cookies in request
    });

    if (!response.ok) {
      return null;
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function addContactRequest(friendId) { // this function used on random call page to allow users to add other user as friends
  try {
    const response = await fetch("/api/addContact", {
      method: "POST",
      body: JSON.stringify({ friendId }),
      credentials: "include", // ✅ Ensures cookies are sent
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to add contact.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error adding contact:", error);
    return null;
  }
}


export async function acceptContactRequest(friendId) {
  try {
    const response = await fetch("/api/connections/acceptContact", {
      method: "POST",
      body: JSON.stringify( {friendId} ),
      credentials: "include", // ✅ Ensures cookies are sent
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to accept contact.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error accepting contact:", error);
    return null;
  }
}

export async function rejectContactRequest(friendId) {
  try {
    const response = await fetch("/api/rejectContact", {
      method: "POST",
      body: JSON.stringify({ friendId }),
      credentials: "include",
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to reject contact.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error rejecting contact:", error);
    return null;
  }
}

export async function insertMessage(messageText, senderId, receiverId) {
  try {
    const response = await fetch("/api/message/addMessage", {
      method: "POST",
      body: JSON.stringify({ messageText, senderId, receiverId }),
      credentials: "include",
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Error response from Next.js API:", result);
      throw new Error(result.error || "Failed to insert message.");
    }

    console.log("Success response from Next.js API:", result);
    return result;
  } catch (error) {
    console.error("Error inserting message:", error);
    return null;
  }
}

export async function fetchMessages() {
  try {
    const response = await fetch("/api/message/getMessages", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    return null;
  }
}

export async function logStartCall(callerId, calleeId, callType) {
  try{
    console.log("CallerId: ", callerId);
    console.log("CalleeId: ", calleeId);
    const response = await fetch("/api/logs/startCall", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ callerId, calleeId, callType }),
    });

    if (!response.ok) {
      throw new Error("Invalid session");
    }

    return response;
  }
  catch (error) {
    console.error("User fetch error:", error);
    return null;
  }
}

export async function logEndCall(callerId, calleeId) {
  try{
    const response = await fetch("/api/logs/endCall", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ callerId, calleeId }),
    });

    if (!response.ok) {
      throw new Error("Invalid session");
    }

    return response;
  }
  catch (error) {
    console.error("User fetch error:", error);
    return null;
  }
}


