import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function linkToTestSeries() {
  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("No MongoDB URI found");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  const quiz = await db.collection('quizzes').findOne({ slug: 'rsmssb-cet-12th-level-04-feb-2023-shift-1' });
  if (!quiz) {
    console.error('Quiz not found!');
    process.exit(1);
  }

  const series = await db.collection('testseries').findOne({ slug: 'rajasthan-cet-2026-speed-test-series' });
  if (!series) {
    console.error('Test Series not found!');
    process.exit(1);
  }

  const existingQuizzes = series.quizzes || [];
  const alreadyLinked = existingQuizzes.some(
    (q) => q.quizId && q.quizId.toString() === quiz._id.toString()
  );

  if (alreadyLinked) {
    console.log('Quiz is already linked to Test Series!');
  } else {
    const newPaperEntry = {
      quizId: quiz._id,
      title: 'RSMSSB CET 2022 (12th Level) 04 Feb 2023 Shift-1 Official Master Paper',
      testType: 'PREVIOUS_YEAR',
      order: existingQuizzes.length + 1,
      isFreeDemo: true,
      durationMinutes: 180,
      totalQuestions: 150,
      totalMarks: 300,
    };

    const updatedQuizzes = [...existingQuizzes, newPaperEntry];

    await db.collection('testseries').updateOne(
      { _id: series._id },
      {
        $set: {
          quizzes: updatedQuizzes,
          totalTestsCount: updatedQuizzes.length,
          totalQuestionsCount: updatedQuizzes.reduce((acc, q) => acc + (q.totalQuestions || 0), 0),
          freeTestsCount: updatedQuizzes.filter((q) => q.isFreeDemo).length,
          updatedAt: new Date(),
        },
      }
    );

    console.log('✅ Successfully linked quiz to Test Series:', series.title);
    console.log(`Updated papers in series: ${updatedQuizzes.length} papers`);
  }

  // Also verify by querying testseries
  const verify = await db.collection('testseries').findOne({ slug: 'rajasthan-cet-2026-speed-test-series' });
  console.log('\n--- VERIFICATION IN DB ---');
  console.log('Series Title:', verify.title);
  console.log('Papers list:');
  verify.quizzes.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.testType}] ${p.title} (QuizID: ${p.quizId})`);
  });

  await mongoose.disconnect();
}

linkToTestSeries().catch((err) => {
  console.error('Error linking:', err);
  process.exit(1);
});
