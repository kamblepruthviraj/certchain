const User = require('../models/User');

const seedUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] No existing users found. Seeding default demo accounts...');

      const defaultUsers = [
        {
          name: 'Administrator (University Registrar)',
          email: 'admin@univ.edu',
          password: 'AdminPassword123!',
          role: 'Admin'
        },
        {
          name: 'Dr. Ramesh Sharma (Controller of Examinations)',
          email: 'official1@univ.edu',
          password: 'OfficialPassword123!',
          role: 'University Official'
        },
        {
          name: 'Prof. Ananya Sen (Dean of Academic Affairs)',
          email: 'official2@univ.edu',
          password: 'OfficialPassword123!',
          role: 'University Official'
        }
      ];

      for (const u of defaultUsers) {
        const passwordHash = await User.hashPassword(u.password);
        await User.create({
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role
        });
      }

      console.log('[Seed] Default demo accounts created:');
      console.log('       - admin@univ.edu (Admin)');
      console.log('       - official1@univ.edu (Official 1)');
      console.log('       - official2@univ.edu (Official 2)');
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed default users:', error.message);
  }
};

module.exports = seedUsers;
