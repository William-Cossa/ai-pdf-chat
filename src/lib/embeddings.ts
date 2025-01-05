// import { OpenAIApi, Configuration } from "openai-edge";

// const config = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

// export async function getEmbeddings(text: string) {
//   try {
//     const response = await openai.createEmbedding({
//       model: "text-embedding-ada-002",
//       input: text.replace(/\n/g, " "),
//     });
//     const result = await response.json();
//     return result.data[0].embedding as number[];
//   } catch (error) {
//     console.log("error calling openai embeddings api", error);
//     throw error;
//   }
// }


import 
{ CohereClient } from "cohere-ai";

// Configure a API Key da Cohere
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY!});
export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    // Chamar a API da Cohere com o modelo multilingual
    const response = await cohere.embed({
      model: "embed-multilingual-v2.0", // Modelo multilíngue
      texts: [text.replace(/\n/g, " ")], // A API espera um array de textos
    });

    // Retorna o vetor de embedding do primeiro texto
    // console.log("Retorna o vetor de embedding", response)
    return response.embeddings as number[];
  } catch (error) {
    console.log("error calling Cohere multilingual embeddings API", error);
    throw error;
  }
}
