import { S3 } from "@aws-sdk/client-s3";
import fs from "fs";
import { Readable } from "stream";
import path from "path";

export async function downloadFromS3(file_key: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const s3 = new S3({
        region: "eu-north-1",
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
        },
      });

      const params = {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
        Key: file_key,
      };
      console.log("params: ", params);

      // Definir o caminho do diretório compatível com o sistema operacional
      const tempDir = path.resolve(__dirname, "tmp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const file_name = path.join(tempDir, `document${Date.now().toString()}.pdf`);

      const obj = await s3.getObject(params);
      if (obj.Body instanceof Readable) {
        const file = fs.createWriteStream(file_name);
        file.on("finish", () => resolve(file_name)); // Resolva o nome do arquivo ao terminar
        obj.Body.pipe(file).on("error", reject); // Lidar com erros durante o streaming
      } else {
        reject(new Error("File body is not a readable stream"));
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}
