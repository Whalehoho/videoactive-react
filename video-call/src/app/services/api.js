export async function fetchUser() {
  try {
    const response = await fetch("/api/auth/user", {
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

export async function handleLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/auth"; // Redirect to login page
}

export const loginRedirectUrl = "/api/auth/login"; // Use the new API route
