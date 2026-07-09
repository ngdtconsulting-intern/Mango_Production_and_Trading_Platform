import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Survey from './models/Survey.js';
import MarketPrice from './models/MarketPrice.js';
import BuyingRequirement from './models/BuyingRequirement.js';
import Farm from './models/Farm.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });

    console.log('Connected to MongoDB');
    console.log('Clearing old data...');

    // Clear all existing data
    await User.deleteMany({});
    await Survey.deleteMany({});
    await MarketPrice.deleteMany({});
    await BuyingRequirement.deleteMany({});
    await Farm.deleteMany({});

    console.log('Old data cleared');

    // ============================================
    // 1. CREATE USERS
    // ============================================
    console.log('Creating users...');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@mangofarm.com',
      phone: '9800000001',
      password: 'Admin@123',
      role: 'admin',
      verified: true,
      active: true,
      address: {
        ward: 1,
        tole: 'Municipality Office',
        district: 'Siraha',
        municipality: 'Lahan Municipality',
      },
    });

    const farmers = await User.create([
      {
        name: 'राम प्रसाद यादव',
        email: 'ram@farmer.com',
        phone: '9800000010',
        password: 'Farmer@123',
        role: 'farmer',
        verified: true,
        active: true,
        address: {
          ward: 3,
          tole: 'Paschim Tole',
          district: 'Siraha',
          municipality: 'Lahan Municipality',
        },
      },
      {
        name: 'सीता देवी महतो',
        email: 'sita@farmer.com',
        phone: '9800000011',
        password: 'Farmer@123',
        role: 'farmer',
        verified: true,
        active: true,
        address: {
          ward: 5,
          tole: 'Purba Tole',
          district: 'Siraha',
          municipality: 'Lahan Municipality',
        },
      },
      {
        name: 'हरि बहादुर थापा',
        email: 'hari@farmer.com',
        phone: '9800000012',
        password: 'Farmer@123',
        role: 'farmer',
        verified: true,
        active: true,
        address: {
          ward: 7,
          tole: 'Uttar Tole',
          district: 'Siraha',
          municipality: 'Lahan Municipality',
        },
      },
      {
        name: 'गीता कुमारी साह',
        email: 'geeta@farmer.com',
        phone: '9800000013',
        password: 'Farmer@123',
        role: 'farmer',
        verified: true,
        active: true,
        address: {
          ward: 2,
          tole: 'Dakshin Tole',
          district: 'Siraha',
          municipality: 'Lahan Municipality',
        },
      },
      {
        name: 'कृष्ण प्रसाद मिश्रा',
        email: 'krishna@farmer.com',
        phone: '9800000014',
        password: 'Farmer@123',
        role: 'farmer',
        verified: true,
        active: true,
        address: {
          ward: 9,
          tole: 'Madhya Tole',
          district: 'Saptari',
          municipality: 'Rajbiraj Municipality',
        },
      },
    ]);

    const traders = await User.create([
      {
        name: 'राजेश शर्मा',
        email: 'rajesh@trader.com',
        phone: '9800000020',
        password: 'Trader@123',
        role: 'trader',
        verified: true,
        active: true,
        businessName: 'Sharma Fruits Trading',
        businessType: 'wholesaler',
        address: {
          ward: 1,
          tole: 'Bazaar Area',
          district: 'Kathmandu',
          municipality: 'Kathmandu Metropolitan',
        },
      },
      {
        name: 'सुनीता गुप्ता',
        email: 'sunita@trader.com',
        phone: '9800000021',
        password: 'Trader@123',
        role: 'trader',
        verified: true,
        active: true,
        businessName: 'Gupta Mango Exports',
        businessType: 'exporter',
        address: {
          ward: 5,
          tole: 'Industrial Area',
          district: 'Bhaktapur',
          municipality: 'Bhaktapur Municipality',
        },
      },
    ]);

    console.log(`Created: 1 admin, ${farmers.length} farmers, ${traders.length} traders`);

    // ============================================
    // 2. CREATE SURVEYS (Matching Lahan 2083 Form)
    // ============================================
    console.log('Creating surveys...');

    const surveys = await Survey.create([
      {
        farmerId: farmers[0]._id,
        farmerName: 'राम प्रसाद यादव',
        phone: '9800000010',
        age: 45,
        educationLevel: 'Below SLC/SEE',
        wardNumber: 3,
        tole: 'Paschim Tole',
        householdMembers: 6,
        orchardAreaKatha: 15,
        totalMangoTrees: 120,
        treeAgeDistribution: [
          { ageRange: '1-3 years', numberOfTrees: 10 },
          { ageRange: '4-5 years', numberOfTrees: 15 },
          { ageRange: '6-10 years', numberOfTrees: 25 },
          { ageRange: '11-15 years', numberOfTrees: 30 },
          { ageRange: '16-25 years', numberOfTrees: 25 },
          { ageRange: '26-40 years', numberOfTrees: 10 },
          { ageRange: '40+ years', numberOfTrees: 5 },
        ],
        selfManaged: true,
        productionCostNPR: 45000,
        totalProductionKg: 3500,
        totalEarnings2082: 175000,
        totalEarnings2081: 140000,
        satisfactionLevel: 7,
        receivedGovernmentAssistance: true,
        governmentOfficeSource: 'Municipality',
        receivedNonGovernmentAssistance: false,
        productionChallenges: 'Mango hopper pest and fruit fly damage during fruiting season',
        marketingChallenges: 'Low prices due to Indian imports during peak season',
        suggestions: 'Government should provide pesticide at subsidized rate and control imports during local harvest',
        status: 'verified',
      },
      {
        farmerId: farmers[1]._id,
        farmerName: 'सीता देवी महतो',
        phone: '9800000011',
        age: 38,
        educationLevel: 'SLC/SEE pass',
        wardNumber: 5,
        tole: 'Purba Tole',
        householdMembers: 5,
        orchardAreaKatha: 8,
        totalMangoTrees: 65,
        treeAgeDistribution: [
          { ageRange: '1-3 years', numberOfTrees: 5 },
          { ageRange: '4-5 years', numberOfTrees: 8 },
          { ageRange: '6-10 years', numberOfTrees: 15 },
          { ageRange: '11-15 years', numberOfTrees: 20 },
          { ageRange: '16-25 years', numberOfTrees: 12 },
          { ageRange: '26-40 years', numberOfTrees: 5 },
          { ageRange: '40+ years', numberOfTrees: 0 },
        ],
        selfManaged: false,
        managementType: 'Sold the orchard to a trader under an annual contract',
        totalProductionKg: 1800,
        totalEarnings2082: 90000,
        totalEarnings2081: 75000,
        satisfactionLevel: 5,
        receivedGovernmentAssistance: false,
        receivedNonGovernmentAssistance: true,
        nonGovernmentSource: 'Local NGO - Mango Development Project',
        productionChallenges: 'No irrigation facility and lack of knowledge about pruning',
        marketingChallenges: 'Traders offer very low price for annual contract',
        suggestions: 'Provide drip irrigation subsidy and training on scientific mango management',
        status: 'verified',
      },
      {
        farmerId: farmers[2]._id,
        farmerName: 'हरि बहादुर थापा',
        phone: '9800000012',
        age: 52,
        educationLevel: 'Illiterate/No education',
        wardNumber: 7,
        tole: 'Uttar Tole',
        householdMembers: 8,
        orchardAreaKatha: 25,
        totalMangoTrees: 200,
        treeAgeDistribution: [
          { ageRange: '1-3 years', numberOfTrees: 20 },
          { ageRange: '4-5 years', numberOfTrees: 25 },
          { ageRange: '6-10 years', numberOfTrees: 40 },
          { ageRange: '11-15 years', numberOfTrees: 35 },
          { ageRange: '16-25 years', numberOfTrees: 45 },
          { ageRange: '26-40 years', numberOfTrees: 25 },
          { ageRange: '40+ years', numberOfTrees: 10 },
        ],
        selfManaged: true,
        productionCostNPR: 80000,
        totalProductionKg: 6000,
        totalEarnings2082: 300000,
        totalEarnings2081: 250000,
        satisfactionLevel: 8,
        receivedGovernmentAssistance: true,
        governmentOfficeSource: 'District Office',
        receivedNonGovernmentAssistance: false,
        productionChallenges: 'Hailstorm damaged fruits in April, labor shortage during harvest',
        marketingChallenges: 'No cold storage facility nearby, fruits get damaged during transport',
        suggestions: 'Build cold storage in Lahan and improve road to orchard areas',
        status: 'verified',
      },
      {
        farmerId: farmers[3]._id,
        farmerName: 'गीता कुमारी साह',
        phone: '9800000013',
        age: 35,
        educationLevel: 'Intermediate/+2 pass',
        wardNumber: 2,
        tole: 'Dakshin Tole',
        householdMembers: 4,
        orchardAreaKatha: 10,
        totalMangoTrees: 80,
        treeAgeDistribution: [
          { ageRange: '1-3 years', numberOfTrees: 15 },
          { ageRange: '4-5 years', numberOfTrees: 10 },
          { ageRange: '6-10 years', numberOfTrees: 20 },
          { ageRange: '11-15 years', numberOfTrees: 15 },
          { ageRange: '16-25 years', numberOfTrees: 12 },
          { ageRange: '26-40 years', numberOfTrees: 8 },
          { ageRange: '40+ years', numberOfTrees: 0 },
        ],
        selfManaged: true,
        productionCostNPR: 35000,
        totalProductionKg: 2200,
        totalEarnings2082: 110000,
        totalEarnings2081: 95000,
        satisfactionLevel: 6,
        receivedGovernmentAssistance: false,
        receivedNonGovernmentAssistance: false,
        productionChallenges: 'Fruit fly infestation and no proper pest management knowledge',
        marketingChallenges: 'Cannot sell directly to consumers, forced to sell to middlemen',
        suggestions: 'Create farmer cooperative for collective bargaining and direct market access',
        status: 'submitted',
      },
      {
        farmerId: farmers[4]._id,
        farmerName: 'कृष्ण प्रसाद मिश्रा',
        phone: '9800000014',
        age: 60,
        educationLevel: 'Below SLC/SEE',
        wardNumber: 9,
        tole: 'Madhya Tole',
        householdMembers: 7,
        orchardAreaKatha: 20,
        totalMangoTrees: 150,
        treeAgeDistribution: [
          { ageRange: '1-3 years', numberOfTrees: 5 },
          { ageRange: '4-5 years', numberOfTrees: 10 },
          { ageRange: '6-10 years', numberOfTrees: 20 },
          { ageRange: '11-15 years', numberOfTrees: 25 },
          { ageRange: '16-25 years', numberOfTrees: 40 },
          { ageRange: '26-40 years', numberOfTrees: 35 },
          { ageRange: '40+ years', numberOfTrees: 15 },
        ],
        selfManaged: false,
        managementType: 'Sold the orchard to a trader during or towards the maturity of fruits',
        totalProductionKg: 4500,
        totalEarnings2082: 200000,
        totalEarnings2081: 180000,
        satisfactionLevel: 4,
        receivedGovernmentAssistance: true,
        governmentOfficeSource: 'Provincial Office',
        receivedNonGovernmentAssistance: false,
        productionChallenges: 'Old trees declining in production, no knowledge of grafting new varieties',
        marketingChallenges: 'Traders cheat on weighing and delay payments',
        suggestions: 'Government should provide training on rejuvenation of old trees and regulate traders',
        status: 'submitted',
      },
    ]);

    console.log(`Created ${surveys.length} surveys`);

    // ============================================
    // 3. CREATE MARKET PRICES
    // ============================================
    console.log('Creating market prices...');

    const markets = ['Kalimati', 'Balkhu', 'Lahan', 'Janakpur', 'Hetauda'];
    const varieties = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra'];
    const marketPrices = [];

    // Create 30 days of price data
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);

      for (const market of markets) {
        for (const variety of varieties) {
          const baseWholesale = 30 + Math.random() * 30;
          const baseRetail = baseWholesale + 10 + Math.random() * 15;

          marketPrices.push({
            market,
            variety,
            date,
            wholesalePricePerKg: Math.round(baseWholesale * 100) / 100,
            retailPricePerKg: Math.round(baseRetail * 100) / 100,
            quality: ['premium', 'good', 'fair'][Math.floor(Math.random() * 3)],
            supply: ['abundant', 'normal', 'scarce'][Math.floor(Math.random() * 3)],
            source: 'manual',
            verifiedBy: adminUser._id,
          });
        }
      }
    }

    await MarketPrice.insertMany(marketPrices);
    console.log(`Created ${marketPrices.length} market price entries`);

    // ============================================
    // 4. CREATE BUYING REQUIREMENTS
    // ============================================
    console.log('Creating buying requirements...');

    const buyingRequirements = await BuyingRequirement.create([
      {
        traderId: traders[0]._id,
        variety: 'Maldaha',
        quantityMT: 5,
        quality: 'good',
        location: {
          district: 'Siraha',
          municipality: 'Lahan Municipality',
          ward: 3,
        },
        budget: {
          minPricePerKg: 40,
          maxPricePerKg: 55,
          negotiable: true,
        },
        requiredByDate: new Date('2026-08-15'),
        contact: {
          phone: '9800000020',
          email: 'rajesh@trader.com',
        },
        status: 'open',
        responses: [
          {
            farmerId: farmers[0]._id,
            farmerName: 'राम प्रसाद यादव',
            availableQuantityKg: 2000,
            proposedPricePerKg: 48,
            message: 'I have high quality Maldaha mangoes ready for harvest in 2 weeks',
            status: 'pending',
          },
        ],
        responseCount: 1,
      },
      {
        traderId: traders[1]._id,
        variety: 'Amrapali',
        quantityMT: 10,
        quality: 'premium',
        location: {
          district: 'Saptari',
          municipality: 'Rajbiraj Municipality',
        },
        budget: {
          minPricePerKg: 50,
          maxPricePerKg: 65,
          negotiable: true,
        },
        requiredByDate: new Date('2026-08-30'),
        contact: {
          phone: '9800000021',
          email: 'sunita@trader.com',
        },
        status: 'open',
        responseCount: 0,
      },
      {
        traderId: traders[0]._id,
        variety: 'Sindhure',
        quantityMT: 3,
        quality: 'good',
        location: {
          district: 'Siraha',
          municipality: 'Lahan Municipality',
        },
        budget: {
          minPricePerKg: 35,
          maxPricePerKg: 45,
          negotiable: false,
        },
        requiredByDate: new Date('2026-07-30'),
        contact: {
          phone: '9800000020',
          email: 'rajesh@trader.com',
        },
        status: 'open',
        responseCount: 0,
      },
    ]);

    console.log(`Created ${buyingRequirements.length} buying requirements`);

    // ============================================
    // 5. CREATE FARMS
    // ============================================
    console.log('Creating farms...');

    const farms = await Farm.create([
      {
        userId: farmers[0]._id,
        farmName: 'राम आँप बगान',
        description: 'Family owned mango orchard since 3 generations',
        location: {
          ward: 3,
          tole: 'Paschim Tole',
          district: 'Siraha',
          municipality: 'Lahan Municipality',
          latitude: 26.7274,
          longitude: 86.4838,
        },
        orchardAreaKatha: 15,
        totalTreeCount: 120,
        bearingTreeCount: 95,
        varieties: [
          { name: 'Maldaha', percentage: 50 },
          { name: 'Amrapali', percentage: 30 },
          { name: 'Sindhure', percentage: 20 },
        ],
        treeAgeDistribution: {
          '1-3': 10,
          '4-5': 15,
          '6-10': 25,
          '11-15': 30,
          '16-25': 25,
          '26-40': 10,
          '40+': 5,
        },
        soilType: 'loamy',
        terrain: 'flat',
        irrigationSystem: 'rainfed',
        lastHarvestDate: new Date('2026-06-20'),
        lastHarvestQuantityKg: 3500,
        lastHarvestRevenuNPR: 175000,
        active: true,
        verified: true,
      },
      {
        userId: farmers[2]._id,
        farmName: 'थापा आँप उद्यान',
        description: 'Large commercial mango farm',
        location: {
          ward: 7,
          tole: 'Uttar Tole',
          district: 'Siraha',
          municipality: 'Lahan Municipality',
          latitude: 26.7350,
          longitude: 86.4900,
        },
        orchardAreaKatha: 25,
        totalTreeCount: 200,
        bearingTreeCount: 155,
        varieties: [
          { name: 'Maldaha', percentage: 40 },
          { name: 'Langra', percentage: 35 },
          { name: 'Amrapali', percentage: 25 },
        ],
        treeAgeDistribution: {
          '1-3': 20,
          '4-5': 25,
          '6-10': 40,
          '11-15': 35,
          '16-25': 45,
          '26-40': 25,
          '40+': 10,
        },
        soilType: 'loamy',
        terrain: 'flat',
        irrigationSystem: 'flood',
        lastHarvestDate: new Date('2026-06-25'),
        lastHarvestQuantityKg: 6000,
        lastHarvestRevenuNPR: 300000,
        active: true,
        verified: true,
      },
    ]);

    console.log(`Created ${farms.length} farms`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('');
    console.log('============================================');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('============================================');
    console.log('');
    console.log('Login Credentials:');
    console.log('------------------------------------------');
    console.log('ADMIN:');
    console.log('  Email: admin@mangofarm.com');
    console.log('  Password: Admin@123');
    console.log('');
    console.log('FARMERS:');
    console.log('  Email: ram@farmer.com      Password: Farmer@123');
    console.log('  Email: sita@farmer.com     Password: Farmer@123');
    console.log('  Email: hari@farmer.com     Password: Farmer@123');
    console.log('  Email: geeta@farmer.com    Password: Farmer@123');
    console.log('  Email: krishna@farmer.com  Password: Farmer@123');
    console.log('');
    console.log('TRADERS:');
    console.log('  Email: rajesh@trader.com   Password: Trader@123');
    console.log('  Email: sunita@trader.com   Password: Trader@123');
    console.log('------------------------------------------');
    console.log('');
    console.log('Data Created:');
    console.log(`  Users: ${1 + farmers.length + traders.length}`);
    console.log(`  Surveys: ${surveys.length}`);
    console.log(`  Market Prices: ${marketPrices.length}`);
    console.log(`  Buying Requirements: ${buyingRequirements.length}`);
    console.log(`  Farms: ${farms.length}`);
    console.log('============================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedData();