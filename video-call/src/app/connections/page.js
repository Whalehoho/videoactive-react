"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ConnectionPage() {
  const { data: session } = useSession(); // Get session data
  const [search, setSearch] = useState("");

  // Dummy contact list with online/offline status
  const contacts = [
    { name: "Friend A", status: "offline" },
    { name: "Friend B", status: "online" },
    { name: "Friend C", status: "busy" },
  ];

  // Filter contacts based on search input
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar activePage="connections" />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Sidebar - Online Contacts */}
        <aside className="w-full md:w-1/3 bg-gray-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Online Contact</h2>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 mt-2 text-black rounded"
          />
          <div className="mt-4 space-y-2">
            {filteredContacts.map((contact, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-600 p-2 rounded-lg"
              >
                <span>{contact.name}</span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    contact.status === "online"
                      ? "bg-green-500"
                      : contact.status === "busy"
                      ? "bg-red-500"
                      : "bg-gray-400"
                  }`}
                ></span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col items-center justify-center p-10">
          <h1 className="text-2xl text-black font-bold">
            My User Name: <span>{session?.user?.name || "Guest"}</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Select a contact or straight start a call!
          </p>
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg mt-5 hover:bg-green-600">
            Start a Random Call
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
