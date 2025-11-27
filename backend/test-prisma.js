// Test Prisma database connection and operations
const prisma = require('./prisma/client');

async function testPrisma() {
  console.log('🧪 Testing Prisma Connection...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Test 2: Count existing records
    console.log('2️⃣ Checking existing data...');
    const userCount = await prisma.user.count();
    const moodCount = await prisma.moodEntry.count();
    const assessmentCount = await prisma.assessment.count();
    const profileCount = await prisma.patientProfile.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Mood Entries: ${moodCount}`);
    console.log(`   Assessments: ${assessmentCount}`);
    console.log(`   Patient Profiles: ${profileCount}\n`);

    // Test 3: Create a test user
    console.log('3️⃣ Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashed_password_here',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    console.log(`✅ Created user: ${testUser.email} (ID: ${testUser.id})\n`);

    // Test 4: Create a test mood entry
    console.log('4️⃣ Creating test mood entry...');
    const testMood = await prisma.moodEntry.create({
      data: {
        userId: testUser.id,
        date: new Date().toISOString().split('T')[0],
        mood: 7,
        energy: 6,
        anxiety: 4,
        sleep: 8,
        notes: 'Test mood entry',
        factors: ['test', 'demo']
      }
    });
    console.log(`✅ Created mood entry (ID: ${testMood.id})\n`);

    // Test 5: Create a test assessment
    console.log('5️⃣ Creating test assessment...');
    const testAssessment = await prisma.assessment.create({
      data: {
        userId: testUser.id,
        type: 'PHQ-9',
        date: new Date().toISOString().split('T')[0],
        score: 8,
        maxScore: 27,
        severity: 'mild',
        responses: { q1: 1, q2: 2, q3: 1 }
      }
    });
    console.log(`✅ Created assessment (ID: ${testAssessment.id})\n`);

    // Test 6: Query data
    console.log('6️⃣ Querying user data...');
    const userWithData = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        moodEntries: true,
        assessments: true
      }
    });
    console.log(`✅ User has ${userWithData.moodEntries.length} mood entries and ${userWithData.assessments.length} assessments\n`);

    // Test 7: Clean up test data
    console.log('7️⃣ Cleaning up test data...');
    await prisma.moodEntry.delete({ where: { id: testMood.id } });
    await prisma.assessment.delete({ where: { id: testAssessment.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All tests passed! Prisma is working correctly.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database');
  }
}

testPrisma();
