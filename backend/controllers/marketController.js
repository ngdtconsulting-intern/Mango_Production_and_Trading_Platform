import MarketPrice from '../models/MarketPrice.js';
import logger from '../utils/logger.js';

// Officers set prices for their own assigned coverage area only, one entry
// per variety per day (re-submitting the same day updates it in place).
export const createOrUpdatePrice = async (req, res) => {
  try {
    if (req.user.role !== 'surveyor') {
      return res.status(403).json({
        success: false,
        message: 'Only officers can update prices',
      });
    }

    if (!req.user.coverageArea?.district) {
      return res.status(400).json({
        success: false,
        message: 'Your account has no coverage area assigned, contact an admin',
      });
    }

    const { variety, wholesalePricePerKg, retailPricePerKg, quality, supply } = req.body;
    const { province, district, municipality } = req.user.coverageArea;

    const today = new Date().setHours(0, 0, 0, 0);

    let price = await MarketPrice.findOne({
      district,
      variety,
      date: { $gte: new Date(today) },
    });

    if (price) {
      price.wholesalePricePerKg = wholesalePricePerKg;
      price.retailPricePerKg = retailPricePerKg;
      price.quality = quality;
      price.supply = supply;
      price.setBy = req.user.id;
    } else {
      price = new MarketPrice({
        province,
        district,
        municipality,
        variety,
        wholesalePricePerKg,
        retailPricePerKg,
        quality,
        supply,
        setBy: req.user.id,
      });
    }

    await price.save();

    logger.info(`Price updated: ${district} - ${variety} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Price updated successfully',
      price,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Prices this officer has set for their own coverage area (for the
// officer's own Market Prices management page).
export const getMyPrices = async (req, res) => {
  try {
    if (!req.user.coverageArea?.district) {
      return res.json({ success: true, prices: [] });
    }

    const today = new Date().setHours(0, 0, 0, 0);

    const prices = await MarketPrice.find({
      district: req.user.coverageArea.district,
      date: { $gte: new Date(today) },
    }).sort({ variety: 1 });

    res.json({ success: true, prices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrices = async (req, res) => {
  try {
    const { province, district, variety, days = 7, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (province) filter.province = province;
    if (district) filter.district = district;
    if (variety) filter.variety = variety;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    filter.date = { $gte: startDate };

    const prices = await MarketPrice.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await MarketPrice.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      prices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLatestPrices = async (req, res) => {
  try {
    const { province, district, variety } = req.query;

    const match = {};
    if (province) match.province = province;
    if (district) match.district = district;
    if (variety) match.variety = variety;

    const latestPrices = await MarketPrice.aggregate([
      { $match: match },
      { $sort: { district: 1, variety: 1, date: -1 } },
      {
        $group: {
          _id: { district: '$district', variety: '$variety' },
          latest: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$latest' } },
    ]);

    const data = latestPrices.map((p) => ({
      ...p,
      avgPrice: (p.wholesalePricePerKg + p.retailPricePerKg) / 2,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPriceTrends = async (req, res) => {
  try {
    const { district, variety, days = 30 } = req.query;

    const filter = {};
    if (district) filter.district = district;
    if (variety) filter.variety = variety;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    filter.date = { $gte: startDate };

    const prices = await MarketPrice.find(filter).sort({ date: 1 });

    const priceData = prices.map((p) => ({
      date: p.date,
      wholesale: p.wholesalePricePerKg,
      retail: p.retailPricePerKg,
    }));

    res.json({ success: true, data: { priceData } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createOrUpdatePrice,
  getMyPrices,
  getPrices,
  getLatestPrices,
  getPriceTrends,
};
