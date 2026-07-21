const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User } = require('../models');

async function run() {
  const email = 'testadmin@brightsoul.com';
  const password = 'testadmin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  const [user] = await User.findOrCreate({
    where: { email },
    defaults: {
      fullName: 'Test Admin - Customer Preview',
      phone: '+918095555958',
      password: hashedPassword,
      isAdmin: false,
      isActive: true,
    },
  });
  await user.update({ password: hashedPassword, isAdmin: false, isActive: true });
  console.log(`Customer UI test account ready: ${email}`);
}

run()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => sequelize.close());
