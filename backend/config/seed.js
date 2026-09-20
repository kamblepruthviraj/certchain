const User = require('../models/User');

const seedUsers = async () => {
  try {
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
      },
      {
        name: 'Prof. Vikram Malhotra (Member of Syndicate)',
        email: 'official3@univ.edu',
        password: 'OfficialPassword123!',
        role: 'University Official'
      },
      {
        name: 'Rahul S Verma (Graduating Student)',
        email: 'student@univ.edu',
        password: 'StudentPassword123!',
        role: 'Student',
        studentUsn: '1RV23CS042'
      },
      {
        name: 'Global Verification Services (Employer Verifier)',
        email: 'verifier@company.com',
        password: 'VerifierPassword123!',
        role: 'Verifier'
      }
    ];

    for (const u of defaultUsers) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        const passwordHash = await User.hashPassword(u.password);
        await User.create({
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          studentUsn: u.studentUsn
        });
        console.log(`[Seed] Created missing account: ${u.email} (${u.role})`);
      }
    }

    // Bootstrap initial KeyVersion 1 if not exists
    const { getActiveKeyVersion } = require('../services/keyEvolutionService');
    await getActiveKeyVersion();

    // Seed sample certificate requests for student/normal user
    const CertificateRequest = require('../models/CertificateRequest');
    const studentUser = await User.findOne({ role: 'Student' });
    if (studentUser) {
      const existingReq = await CertificateRequest.findOne({ requestId: 'REQ-2026-0001' });
      if (!existingReq) {
        await CertificateRequest.create([
          {
            requestId: 'REQ-2026-0001',
            userId: studentUser._id,
            userName: studentUser.name,
            userEmail: studentUser.email,
            studentUsn: studentUser.studentUsn || '1RV23CS042',
            certificateType: 'Degree Certificate',
            purpose: 'Employment Verification & Background Check',
            status: 'Pending',
            requestedDate: new Date('2026-09-20T10:30:00Z')
          },
          {
            requestId: 'REQ-2026-0002',
            userId: studentUser._id,
            userName: studentUser.name,
            userEmail: studentUser.email,
            studentUsn: studentUser.studentUsn || '1RV23CS042',
            certificateType: 'Transcript',
            purpose: 'Official Academic Transcript Submission',
            status: 'Approved',
            requestedDate: new Date('2026-09-19T14:15:00Z'),
            certificateId: 'CERT-2026-0001'
          }
        ]);
        console.log('[Seed] Created sample certificate requests for student');
      }
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed default users or key version:', error.message);
  }
};

module.exports = seedUsers;
