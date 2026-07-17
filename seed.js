const bcrypt = require('bcryptjs');
const { sequelize, Sequelize: { Op } } = require('./config/database');
const { User, Service, Coupon, Offer } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected, seeding...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    await User.bulkCreate([
      { fullName: 'Admin User', email: 'admin@brightsoul.com', phone: '+919876543210', password: adminPassword, isAdmin: true },
      { fullName: 'John Doe', email: 'john@example.com', phone: '+919876543211', password: userPassword, isAdmin: false },
      { fullName: 'Jane Smith', email: 'jane@example.com', phone: '+919876543212', password: userPassword, isAdmin: false },
      { fullName: 'Bob Wilson', email: 'bob@example.com', phone: '+919876543213', password: userPassword, isAdmin: false }
    ], { ignoreDuplicates: true });

    const services = [
      { name: 'Swedish Massage - 45 min', description: 'A classic and deeply relaxing body massage with medium pressure and flowing strokes.', category: 'Swedish Massage', duration: 45, price: 1999, image: '' },
      { name: 'Swedish Massage - 60 min', description: 'Extended Swedish massage for deeper relaxation and stress relief.', category: 'Swedish Massage', duration: 60, price: 2499, isOffer: true, offerPrice: 1500, image: '' },
      { name: 'Swedish Massage - 90 min', description: 'Ultimate Swedish massage experience for complete relaxation.', category: 'Swedish Massage', duration: 90, price: 3699, image: '' },
      { name: 'Swedish Massage - 120 min', description: 'Extended session for the ultimate relaxation experience.', category: 'Swedish Massage', duration: 120, price: 4999, image: '' },
      { name: 'Aromatherapy Massage - 45 min', description: 'A soothing massage with therapeutic essential oils (olive or almond oil).', category: 'Aromatherapy Massage', duration: 45, price: 2499, image: '' },
      { name: 'Aromatherapy Massage - 60 min', description: 'Enhanced aromatherapy session with premium essential oils.', category: 'Aromatherapy Massage', duration: 60, price: 2999, image: '' },
      { name: 'Aromatherapy Massage - 90 min', description: 'Full body aromatherapy experience.', category: 'Aromatherapy Massage', duration: 90, price: 3999, image: '' },
      { name: 'Aromatherapy Massage - 120 min', description: 'Complete aromatherapy wellness session.', category: 'Aromatherapy Massage', duration: 120, price: 5499, image: '' },
      { name: 'Balinese Massage - 45 min', description: 'Deeply relaxing session blending gentle stretches, acupressure, and skin rolling.', category: 'Balinese Massage', duration: 45, price: 2499, image: '' },
      { name: 'Balinese Massage - 60 min', description: 'Traditional Balinese massage with acupressure techniques.', category: 'Balinese Massage', duration: 60, price: 2999, image: '' },
      { name: 'Balinese Massage - 90 min', description: 'Extended Balinese massage for deep relaxation.', category: 'Balinese Massage', duration: 90, price: 3999, image: '' },
      { name: 'Balinese Massage - 120 min', description: 'Full Balinese treatment session.', category: 'Balinese Massage', duration: 120, price: 5499, image: '' },
      { name: 'Thai Massage - 45 min', description: 'A deeply energising massage combining assisted stretching with gentle to firm pressure.', category: 'Thai Massage', duration: 45, price: 1999, image: '' },
      { name: 'Thai Massage - 60 min', description: 'Traditional Thai massage with assisted stretching.', category: 'Thai Massage', duration: 60, price: 2499, image: '' },
      { name: 'Deep Tissue Massage - 60 min', description: 'Uses slow, intense pressure to target deep layers of muscle and connective tissue.', category: 'Deep Tissue Massage', duration: 60, price: 2999, image: '' },
      { name: 'Deep Tissue Massage - 90 min', description: 'Extended deep tissue work for chronic tension.', category: 'Deep Tissue Massage', duration: 90, price: 3999, image: '' },
      { name: 'Pain Soothening - 45 min', description: 'A personalised massage targeting only the areas that need attention.', category: 'Pain Soothening Custom Massage', duration: 45, price: 2499, image: '' },
      { name: 'Pain Soothening - 60 min', description: 'Targeted relief massage for specific pain areas.', category: 'Pain Soothening Custom Massage', duration: 60, price: 2999, image: '' },
      { name: 'Pain Soothening - 90 min', description: 'Extended pain relief session.', category: 'Pain Soothening Custom Massage', duration: 90, price: 3999, image: '' },
      { name: 'Four Hands Massage - 60 min', description: 'A luxurious massage where two highly trained therapists work in perfect synchronization.', category: 'Four Hands Massage', duration: 60, price: 4999, image: '' },
      { name: 'Four Hands Massage - 90 min', description: 'Extended luxury four hands massage experience.', category: 'Four Hands Massage', duration: 90, price: 7499, image: '' },
      { name: 'Couple Massage - 60 min', description: 'Reconnect with your loved one in a tranquil environment. Side-by-side massage.', category: 'Couple Massage', duration: 60, price: 4999, image: '' },
      { name: 'Couple Massage - 90 min', description: 'Extended couple massage experience.', category: 'Couple Massage', duration: 90, price: 7499, image: '' },
      { name: 'VIP Massage With Jacuzzi - 75 min', description: '60 min Massage + 15 min Jacuzzi with hydrotherapy treatment.' , category: 'VIP Massage with Jacuzzi', duration: 75, price: 7000, image: '' }
    ];
    await Service.bulkCreate(services, { ignoreDuplicates: true });

    await Coupon.bulkCreate([
      { code: 'WELCOME20', description: '20% off for new users on first booking', discountType: 'percentage', discountValue: 20, minOrderAmount: 1000, maxDiscount: 500, usageLimit: 100, validFrom: '2024-01-01', validTo: '2026-12-31', isActive: true },
      { code: 'SPA500', description: '₹500 off on bookings above ₹3000', discountType: 'fixed', discountValue: 500, minOrderAmount: 3000, usageLimit: 50, validFrom: '2024-01-01', validTo: '2026-12-31', isActive: true },
      { code: 'BRIGHT25', description: '25% off minimum ₹2000 order value', discountType: 'percentage', discountValue: 25, minOrderAmount: 2000, maxDiscount: 1000, usageLimit: 30, validFrom: '2024-06-01', validTo: '2025-06-01', isActive: true }
    ], { ignoreDuplicates: true });

    await Offer.bulkCreate([
      { title: 'First Registration Offer', description: '60-minute Swedish Massage exclusive offer for first-time users. T&C apply.', discountType: 'fixed', discountValue: 999, originalPrice: 2499, offerPrice: 1500, validFrom: '2024-01-01', validTo: '2026-12-31', isActive: true, usageLimit: 100 },
      { title: 'Couples Retreat Package', description: 'Save big on couples massage sessions together', discountType: 'percentage', discountValue: 20, originalPrice: 4999, offerPrice: 3999, validFrom: '2024-01-01', validTo: '2026-12-31', isActive: true, usageLimit: 50 },
      { title: 'VIP Jacuzzi Deal', description: 'Special offer on VIP Jacuzzi treatment', discountType: 'fixed', discountValue: 1000, originalPrice: 7000, offerPrice: 6000, validFrom: '2024-06-01', validTo: '2025-12-31', isActive: true, usageLimit: 30 }
    ], { ignoreDuplicates: true });

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message, err.stack);
    process.exit(1);
  }
})();
