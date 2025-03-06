"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchUser, fetchContacts } from "../services/api"; // ✅ Use centralized API function

export default function ConnectionPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetchUser().then((data) => {
      if (!data) {
        router.push("/auth");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
    
    fetchContacts().then((data) => {
      if (data && data.contacts) {
        setContacts(data.contacts);
      }
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) return null; // Prevents flickering during redirect

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col md:flex-row">
        <aside className="w-full md:w-1/3 bg-gray-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Online Contacts</h2>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mt-2 text-black border border-gray-300 rounded"
          />
          <ul className="mt-4">
            {contacts
              .filter((contact) =>
                contact.contactName.toLowerCase().includes(search.toLowerCase())
              )
              .map((contact) => (
                <li key={contact.contactId} className="p-2 border-b border-gray-500">
                  {contact.contactName}
                </li>
              ))}
          </ul>
        </aside>
        <section className="flex-1 flex flex-col items-center justify-center p-10">
          <h1 className="text-2xl text-black font-bold">
            My Username: <span className="text-pink-600">{user?.email || "Guest"}</span>
          </h1>
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg mt-5 hover:bg-green-600 transition">
            Start a Direct Call
          </button>
        </section>
      </main>
    </div>
  );
}
