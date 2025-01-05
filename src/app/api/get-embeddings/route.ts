import { NextResponse } from "next/server";
import { Cohere, CohereClient } from "cohere-ai";

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY!});

// Método POST
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { message: "Invalid text input" },
        { status: 400 }
      );
    }

    // Chamada à API da Cohere
    const response = await cohere.embed({
    texts: [text.replace(/\n/g, " ")],
      model: "embed-multilingual-v2.0", // Modelo multilíngue
    });

    // if (response.statusCode !== 200) {
    //   throw new Error(
    //     `Cohere API returned error: ${response.statusMessage} (${response.statusCode})`
    //   );
    // }

    // console.log("Embedded Text ressponse:",response);
    const embeddings = response.embeddings; // Extrai o embedding
    // console.log("Embedded dimensions:", );
    return NextResponse.json(embeddings, { status: 200 });
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return NextResponse.json(
      { message: "Failed to generate embeddings", error: String(error) },
      { status: 500 }
    );
  }
}
