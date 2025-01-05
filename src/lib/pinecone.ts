import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

export const getPineconeClient = () => {
  return new Pinecone({
    // environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

// export async function loadS3IntoPinecone(fileKey: string) {
//   // 1. obtain the pdf -> downlaod and read from pdf
//   console.log("downloading s3 into file system");
//   const file_name = await downloadFromS3(fileKey);
//   if (!file_name) {
//     throw new Error("could not download from s3");
//   }
//   console.log("loading pdf into memory" + file_name);
//   const loader = new PDFLoader(file_name);
//   const pages = (await loader.load()) as PDFPage[];

//   // 2. split and segment the pdf
//   const documents = await Promise.all(pages.map(prepareDocument));

//   // 3. vectorise and embed individual documents
//   const vectors = await Promise.all(documents.flat().map(embedDocument));

//   // 4. upload to pinecone
//   const client = await getPineconeClient();
//   const pineconeIndex = await client.index("chatpdf");
//   const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

//   console.log("inserting vectors into pinecone");
//   await namespace.upsert(vectors);

//   return documents[0];
// }
export async function loadS3IntoPinecone(fileKey: string) {
  console.log("Downloading from S3...");
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) throw new Error("Could not download from S3");

  console.log("Loading PDF into memory...");
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];
  if (pages.length === 0) throw new Error("No pages found in the PDF.");

  console.log("Preparing documents...");
  const documents = await Promise.all(pages.map(prepareDocument));
  if (documents.length === 0) throw new Error("No documents were prepared from the PDF.");

  console.log("Generating vectors...");
  const vectors = await Promise.all(documents.flat().map(embedDocument));
  if (vectors.length === 0) throw new Error("No vectors were generated from the documents.");

  console.log("Uploading vectors to Pinecone...");
  const client = await getPineconeClient();
  const pineconeIndex = await client.index("chatpdf");
  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  await namespace.upsert(vectors);
  return documents[0];
}


async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, "");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
