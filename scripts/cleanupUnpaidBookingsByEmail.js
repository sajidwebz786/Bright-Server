const { sequelize } = require('../config/database');
const { User, Booking, Order, Payment } = require('../models');
require('../models/associations')();

async function cleanup(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email argument is required');
  const user = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), normalizedEmail) });
  if (!user) return { email: normalizedEmail, bookingsDeleted: 0, ordersDeleted: 0, message: 'User not found' };

  return sequelize.transaction(async transaction => {
    const paidOrderIds = (await Payment.findAll({ where: { userId: user.id, status: 'captured' }, attributes: ['orderId'], transaction })).map(item => item.orderId);
    const pendingOrders = await Order.findAll({
      where: { userId: user.id, status: { [require('sequelize').Op.ne]: 'paid' }, ...(paidOrderIds.length ? { id: { [require('sequelize').Op.notIn]: paidOrderIds } } : {}) },
      transaction
    });
    const ordersDeleted = pendingOrders.length;
    for (const order of pendingOrders) await order.destroy({ transaction });

    const orphanPending = await Booking.findAll({
      where: {
        userId: user.id,
        status: { [require('sequelize').Op.in]: ['pending', 'waitlisted'] }
      },
      transaction
    });
    for (const booking of orphanPending) await booking.destroy({ transaction });
    return { email: normalizedEmail, bookingsDeleted: orphanPending.length, ordersDeleted };
  });
}

const email = process.argv[2];
sequelize.authenticate()
  .then(() => cleanup(email))
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(error => { console.error(error); process.exitCode = 1; })
  .finally(() => sequelize.close());
