import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Survey from './models/Survey.js';
import Farm from './models/Farm.js';
import BuyingRequirement from './models/BuyingRequirement.js';
import ChatMessage from './models/ChatMessage.js';
import Report from './models/Report.js';
import MarketPrice from './models/MarketPrice.js';

dotenv.config();

// One representative district/municipality per province, taken straight from
// the app's own nepal-locations.json so seeded addresses match what the
// location dropdowns actually offer.
const PROVINCES = [
  { province: 'Koshi', district: 'Bhojpur', municipality: 'Aamchowk' },
  { province: 'Madhesh', district: 'Bara', municipality: 'Adarshkotwal' },
  { province: 'Bagmati', district: 'Bhaktapur', municipality: 'Bhaktapur' },
  { province: 'Gandaki', district: 'Baglung', municipality: 'Badigad' },
  { province: 'Lumbini', district: 'Arghakhanchi', municipality: 'Bhumekasthan' },
  { province: 'Karnali', district: 'Dailekh', municipality: 'Aathabis' },
  { province: 'Sudurpashchim', district: 'Achham', municipality: 'Bannigadhi Jayagadh' },
];

const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];

const slug = (province) => province.toLowerCase();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    console.log('Connected to MongoDB');

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Survey.deleteMany({}),
      Farm.deleteMany({}),
      BuyingRequirement.deleteMany({}),
      ChatMessage.deleteMany({}),
      Report.deleteMany({}),
      MarketPrice.deleteMany({}),
    ]);
    console.log('Existing users, farms, surveys, buying requirements, chat messages, reports, and market prices cleared.');

    let phoneCounter = 9800000100;
    const nextPhone = () => String(phoneCounter++);

    console.log('Creating admin...');
    // NOTE: passwords are passed in PLAIN here, not pre-hashed. User.js's
    // pre('save') hook hashes on every new document, so hashing here too
    // would double-hash and make the account unable to log in.
    const admin = await User.create({
      name: 'Platform Admin',
      email: 'admin@test.com',
      phone: nextPhone(),
      password: 'Admin@123',
      role: 'admin',
      verified: true,
      active: true,
      address: { province: 'Bagmati', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', ward: 1, tole: 'Board Office' },
    });

    console.log('Creating farmers, traders, and officers for each province...');

    for (let i = 0; i < PROVINCES.length; i++) {
      const { province, district, municipality } = PROVINCES[i];
      const key = slug(province);
      const variety = VARIETIES[i % VARIETIES.length];

      const farmer = await User.create({
        name: `Farmer ${province}`,
        email: `farmer.${key}@test.com`,
        phone: nextPhone(),
        password: 'Farmer@123',
        role: 'farmer',
        verified: true,
        active: true,
        address: { province, district, municipality, ward: 2, tole: 'Main Tole' },
      });

      const trader = await User.create({
        name: `Trader ${province}`,
        email: `trader.${key}@test.com`,
        phone: nextPhone(),
        password: 'Trader@123',
        role: 'trader',
        verified: true,
        active: true,
        businessName: `${province} Mango Traders`,
        businessType: 'wholesaler',
        address: { province, district, municipality, ward: 1, tole: 'Bazaar Area' },
      });

      const officer = await User.create({
        name: `Officer ${province}`,
        email: `officer.${key}@test.com`,
        phone: nextPhone(),
        password: 'Officer@123',
        role: 'surveyor',
        verified: true,
        active: true,
        address: { province, district, municipality, ward: 1, tole: 'District Office' },
        coverageArea: { province, district, municipality },
      });

      // Officer publishes today's reference price for their district before
      // the trader posts a requirement, so the trader's price can actually
      // be validated against it (same as the real create-requirement flow).
      const marketPrice = await MarketPrice.create({
        province,
        district,
        municipality,
        variety,
        wholesalePricePerKg: 90,
        retailPricePerKg: 110,
        quality: 'good',
        supply: 'normal',
        setBy: officer._id,
      });

      await Farm.create({
        userId: farmer._id,
        farmName: `${municipality} Orchard`,
        description: `Family mango orchard in ${municipality}, ${district}.`,
        location: { province, district, municipality, ward: 2, tole: 'Main Tole' },
        orchardAreaKatha: 12,
        totalTreeCount: 40,
        bearingTreeCount: 28,
        varieties: [{ name: variety, percentage: 100 }],
        soilType: 'loamy',
        terrain: 'flat',
        irrigationSystem: 'drip',
        lastHarvestDate: new Date(new Date().getFullYear() - 1, 5, 15),
        lastHarvestQuantityKg: 3200,
        lastHarvestRevenuNPR: 224000,
      });

      // Alternate submitted (pending review) and verified so admin/officer
      // dashboards have both queue items and already-cleared history.
      const isVerified = i % 2 === 1;
      await Survey.create({
        farmerId: farmer._id,
        age: 34 + i,
        educationLevel: 'Secondary',
        province,
        district,
        municipality,
        householdMembers: 5,
        orchardAreaKatha: 12,
        totalMangoTrees: 40,
        selfManaged: true,
        totalProductionKg: 3200,
        totalEarnings2082: 224000,
        totalEarnings2081: 198000,
        satisfactionLevel: 7,
        receivedGovernmentAssistance: false,
        receivedNonGovernmentAssistance: false,
        status: isVerified ? 'verified' : 'submitted',
        verifiedBy: isVerified ? officer._id : undefined,
        verifiedAt: isVerified ? new Date() : undefined,
      });

      // Priced within the "good" quality band (officer wholesale price ± 5)
      // enforced by createBuyingRequirement, so this doubles as a working
      // example of the price-band feature rather than arbitrary numbers.
      await BuyingRequirement.create({
        traderId: trader._id,
        variety,
        quantityMT: 2,
        quality: 'good',
        location: { province, district, municipality, ward: 1 },
        budget: { minPricePerKg: marketPrice.wholesalePricePerKg - 3, maxPricePerKg: marketPrice.wholesalePricePerKg + 3 },
        requiredByDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        contact: { phone: trader.phone, email: trader.email },
      });

      await Report.create({
        reporterId: farmer._id,
        reporterName: farmer.name,
        reporterRole: 'farmer',
        province,
        district,
        message: `Sample issue reported from ${district} to test officer review.`,
      });
    }

    const totalUsers = await User.countDocuments();
    console.log(`Created: 1 admin, ${PROVINCES.length} farmers, ${PROVINCES.length} traders, ${PROVINCES.length} officers (${totalUsers} users total)`);
    console.log('Each farmer has a farm + survey, each officer has published a market price, each trader has an open buying requirement priced within that officer\'s band, each province has one report.');
    console.log('Login pattern: farmer.<province>@test.com / Farmer@123, trader.<province>@test.com / Trader@123, officer.<province>@test.com / Officer@123, admin@test.com / Admin@123');
    console.log('Provinces used: ' + PROVINCES.map((p) => slug(p.province)).join(', '));
    console.log('DATABASE SEEDED SUCCESSFULLY');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();
