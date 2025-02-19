// app/page.js
'use client'; // Essential for client-side functionality

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Import the Link component

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true); // Set loading to true before fetch
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false); // Set loading to false after fetch, regardless of success/failure
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Welcome to my Next.js 13 App Router page!</h1>

      {data && (
        <div>
          <Link href="/about">Go to About Page</Link>
          <h2>Data from API:</h2>
          <p>User ID: {data.userId}</p>
          <p>Title: {data.title}</p>
          <p>Completed: {data.completed ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
}