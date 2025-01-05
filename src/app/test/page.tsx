"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";

async function fetchEmbeddings(text: string): Promise<number[]> {
  const response = await fetch("/api/get-embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch embeddings");
  }

  return response.json();
}



export default function TestEmbeddingsPage() {
  const [text, setText] = useState("");
  const [embeddings, setEmbeddings] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text");
      return;
    }

    setLoading(true);
    setEmbeddings(null);
    try {
      const result = await fetchEmbeddings(text);
      setEmbeddings(result);
      toast.success("Embeddings generated successfully!");
    } catch (error) {
      toast.error((error as Error).message || "Error generating embeddings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Embeddings</h1>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={5}
        placeholder="Enter text to generate embeddings"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Embeddings"}
      </button>
      {embeddings && (
        <div className="mt-4">
          <h2 className="font-bold text-lg mb-2">Embeddings:</h2>
          <pre className="p-2 bg-gray-100 rounded overflow-x-auto">
            {JSON.stringify(embeddings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
