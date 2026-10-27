import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// If CLOUDINARY_URL is present in process.env, cloudinary will auto-configure or we can parse it
if (process.env.CLOUDINARY_URL) {
  const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    cloudinary.config({
      api_key: match[1],
      api_secret: match[2],
      cloud_name: match[3],
      secure: true
    });
  }
}

async function uploadImages() {
  console.log("Uploading diagrams to Cloudinary...");

  const q24Path = path.join(process.cwd(), 'public/uploads/questions/cet-2022-12th-shift1/q24_diagram.jpg');
  const q46Path = path.join(process.cwd(), 'public/uploads/questions/cet-2022-12th-shift1/q46_pie_chart.jpg');

  const res24 = await cloudinary.uploader.upload(q24Path, {
    folder: 'rajasthan_exam_twister/quizzes/cet-2022-12th-shift1',
    public_id: 'q24_figure_series',
    overwrite: true,
  });
  console.log("✅ Q24 Cloudinary URL:", res24.secure_url);

  const res46 = await cloudinary.uploader.upload(q46Path, {
    folder: 'rajasthan_exam_twister/quizzes/cet-2022-12th-shift1',
    public_id: 'q46_pie_chart',
    overwrite: true,
  });
  console.log("✅ Q46 Cloudinary URL:", res46.secure_url);
}

uploadImages().catch(err => {
  console.error("Upload error:", err);
  process.exit(1);
});
