import "dotenv/config.js";
import { Document } from "langchain/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { openai } from "./openai.js";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { YoutubeLoader } from "langchain/document_loaders/web/youtube";

const question = process.argv[2] || "hi";
const video = "https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn";

const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

export const docFromYTVideo = (video) => {
  const header = YoutubeLoader.createFromUrl(video, {
    language: "en",
    addVideoInfo: true,
  });
  return header.loadAndSplit(
    new CharacterTextSplitter({
      separator: " ",
      chunkSize: 2500,
      chunkOverlap: 100,
    })
  );
};

const docFromPDF = () => {
  const loader = new PDFLoader("xbox.pdf");
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: ". ",
      chunkOverlap: 200,
      chunkSize: 2500,
    })
  );
};

const loadStore = async () => {
  const videoDocs = await docFromYTVideo(video);
  const pdfDocs = await docFromPDF();
  return createStore([...videoDocs, ...pdfDocs]);
};

const query = async () => {
  const store = await loadStore();
  const results = await store.similaritySearch(question, 1);
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful AI Assistant. Answer questions to your best ability.",
      },
      {
        role: "user",
        content: `Answer the following questions using the provided context. If you cannot answer the questions with the context, don't lie and make up a stuff. Just say you need more context.
        Question: ${question}
        Context:${results.map((r) => r.pageContent).join("\n")}`,
      },
    ],
  });
  console.log(
    `Answer to query: ${
      response.choices[0].message.content
    }\nSources: ${results.map((r) => r.metadata.source).join(", ")}`
  );
};

query();