const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { User } = require('../models');

async function run() {
  const email = 'admin@brightsoulspa.in';
  const oldEmail = 'admin@brightsoul.com';
  const password = await bcrypt.hash('admin123', 10);
  let admin = await User.findOne({ where: { email } });
  const oldAdmin = await User.findOne({ where: { email: oldEmail } });

  if (!admin && oldAdmin) {
    admin = oldAdmin;
    await admin.update({ email, password, phone: '+918095555958', isAdmin: true, isActive: true });
  } else if (!admin) {
    admin = await User.create({ fullName: 'Admin User', email, phone: '+918095555958', password, isAdmin: true, isActive: true });
  } else {
    await admin.update({ password, isAdmin: true, isActive: true });
    if (oldAdmin && oldAdmin.id !== admin.id) await oldAdmin.update({ isAdmin: false, isActive: false });
  }

  console.log(`Admin credentials updated: ${admin.email}`);
}

run()
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => sequelize.close());
