
import { StreamingTextResponse } from 'ai';
import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { CohereClient, CohereClientV2 } from 'cohere-ai';

export const runtime = "edge";

// Inicializa o cliente Cohere
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    
    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const prompt = `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
     AI assistant is a knowledgeable, helpful, and articulate artificial intelligence.
    AI can provide answers using both the provided CONTEXT BLOCK and its vast general knowledge. If the context contains relevant information, it should prioritize it, but otherwise, it can use its own knowledge to assist.
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK

      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer, the AI assistant will provide the best response using its general knowledge.
      
      User messages history:
      ${messages
        .filter((message: any) => message.role === "user")
        .map((message: any) => message.content)
        .join("\n")}
      
      Current user message: ${lastMessage.content}`;

    const stream = await cohere.chatStream({
      message: prompt,
      model: "command-r-plus-08-2024"  // ou outro modelo Cohere apropriado
      
    });

    const textStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.eventType === "text-generation") {
            controller.enqueue(chunk.text);
          }
        }
        controller.close();
      },
    });

    // Save user message
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    let fullResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        fullResponse += chunk;
        controller.enqueue(chunk);
      },
      flush(controller) {
        // Save AI response after stream ends
        db.insert(_messages).values({
          chatId,
          content: fullResponse,
          role: "system",
        });
      },
      
    });
   

    return new StreamingTextResponse(textStream.pipeThrough(transformStream));
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}