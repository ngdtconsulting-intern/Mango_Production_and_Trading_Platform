import MarketPrice from '../models/MarketPrice.js';
import logger from '../utils/logger.js';

export const createOrUpdatePrice = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update prices',
      });
    }

    const { market, variety, wholesalePricePerKg, retailPricePerKg, quality, supply } = req.body;

    const today = new Date().setHours(0, 0, 0, 0);

    let price = await MarketPrice.findOne({
      market,
      variety,
      date: { $gte: new Date(today) },
    });

    if (price) {
      price.wholesalePricePerKg = wholesalePricePerKg;
      price.retailPricePerKg = retailPricePerKg;
      price.quality = quality;
      price.supply = supply;
      price.verifiedBy = req.user.id;
    } else {
      price = new MarketPrice({
        market,
        variety,
        wholesalePricePerKg,
        retailPricePerKg,
        quality,
        supply,
        verifiedBy: req.user.id,
      });
    }

    await price.save();

    logger.info(`Price updated: ${market} - ${variety}`);

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

export const getPrices = async (req, res) => {
  try {
    const { market, variety, days = 7, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (market) filter.market = market;
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
    const { market, variety } = req.query;

    const match = {};
    if (market) match.market = market;
    if (variety) match.variety = variety;

    const latestPrices = await MarketPrice.aggregate([
      { $match: match },
      { $sort: { market: 1, variety: 1, date: -1 } },
      {
        $group: {
          _id: { market: '$market', variety: '$variety' },
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
    const { market, variety, days = 30 } = req.query;

    const filter = {};
    if (market) filter.market = market;
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

export const getPriceComparison = async (req, res) => {
  try {
    const { market1, market2, variety } = req.query;

    if (!market1 || !market2 || !variety) {
      return res.status(400).json({
        success: false,
        message: 'market1, market2, and variety are required',
      });
    }

    const prices = await MarketPrice.find({
      market: { $in: [market1, market2] },
      variety,
    }).sort({ date: -1 });

    res.json({
      success: true,
      prices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  createOrUpdatePrice,
  getPrices,
  getLatestPrices,
  getPriceComparison,
  getPriceTrends,
};