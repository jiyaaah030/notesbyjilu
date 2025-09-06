import { getAuth } from "firebase/auth";

export async function authedFetch(url: string, options: RequestInit = {}) {
  try {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken();

    console.log("authedFetch token:", token);

    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      // Removed credentials: "include" to avoid CORS/credentials issues
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export async function searchUsers(query: string) {
  try {
    // Adjusted endpoint to match backend route prefix if any
    const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
}
