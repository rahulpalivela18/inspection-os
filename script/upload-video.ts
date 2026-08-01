import { Storage } from "@google-cloud/storage";
import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const envContent = readFileSync(
    resolve(process.cwd(), ".env.local"),
    "utf-8",
  );
  const match = envContent.match(/^GCP_CREDENTIALS=(.+)$/m);
  if (!match) {
    console.error("No GCP_CREDENTIALS found");
    process.exit(1);
  }

  const credentials = JSON.parse(match[1]);
  const storage = new Storage({ projectId: "reportgen-494420", credentials });
  const bucket = storage.bucket("reportgen-images-rahul");

  const destination = `hotspot-demo-${Date.now()}.mp4`;
  const videoPath = resolve(
    process.cwd(),
    "client/public/videos/hotspot-demo.mov",
  );

  console.log("Uploading hotspot-demo.mov (186MB) to GCP...");
  await bucket.upload(videoPath, {
    destination,
    contentType: "video/mp4",
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  console.log("Done!");
  console.log(
    `URL: https://storage.googleapis.com/reportgen-images-rahul/${destination}`,
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
