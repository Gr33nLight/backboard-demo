import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { client } from "./client.js";

const filePath = process.argv[2];
const question = process.argv[3] ?? "What are the key points in this document?";

async function main() {
  if (!filePath) {
    throw new Error("Usage: node rag-example.js <file> [question]");
  }

  const documentPath = resolve(filePath);
  await access(documentPath);

  const assistant = await client.createAssistant({
    name: "RAG Document Assistant",
    system_prompt:
      "Answer questions using the uploaded documents. If the documents do not contain the answer, say so.",
  });
  console.log(`Created assistant: ${assistant.assistantId}`);

  const document = await client.uploadDocumentToAssistant(
    assistant.assistantId,
    documentPath
  );
  console.log(`Uploaded ${document.filename} — status: ${document.status}`);

  // RAG can use the document only after asynchronous indexing finishes.
  const timeoutAt = Date.now() + 5 * 60 * 1000;
  let status;
  do {
    status = await client.getDocumentStatus(document.documentId);
    console.log(`Document status: ${status.status}`);

    if (status.status === "indexed") break;
    if (status.status === "error") {
      throw new Error(
        `Document indexing failed: ${status.statusMessage ?? "unknown error"}`
      );
    }
    if (Date.now() >= timeoutAt) {
      throw new Error("Timed out waiting for document indexing.");
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  } while (true);

  const response = await client.sendMessage({
    content: question,
    assistantId: assistant.assistantId,
  });

  console.log("\nAnswer:\n" + response.content);
  console.log(
    `\nRetrieved files: ${response.retrievedFilesCount ?? "not reported"}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
