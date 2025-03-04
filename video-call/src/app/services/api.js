// calling Frontend API for more security
export async function fetchUser() {
  try {
    const response = await fetch("/api/auth/getUser", {
      method: "GET",
      credentials: "include", // ✅ Include cookies in request
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function updateUser(data) {
  try {

    const response = await fetch("/api/user/updateProfile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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




export async function uploadImage(file) {
  // console.log("Sending request to Next.js API:", file);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/user/uploadImage", {
      method: "POST",
      body: formData,
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



export async function handleLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/auth"; // Redirect to login page
}



export const loginRedirectUrl = "/api/auth/login"; // Use the new API route
