import { body, validationResult, query, param } from 'express-validator';

export const validateSurveyData = [
  body('farmerName').trim().notEmpty().withMessage('Farmer name is required'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('educationLevel').notEmpty().withMessage('Education level is required'),
  body('wardNumber').isInt({ min: 1 }).withMessage('Ward number must be positive'),
  body('tole').trim().notEmpty().withMessage('Tole is required'),
  body('householdMembers').isInt({ min: 1 }).withMessage('Household members must be at least 1'),
  body('orchardAreaKatha').isFloat({ min: 0.1 }).withMessage('Orchard area must be greater than 0'),
  body('totalMangoTrees').isInt({ min: 1 }).withMessage('Total trees must be at least 1'),
  body('totalProductionKg').optional().isFloat({ min: 0 }).withMessage('Production must be non-negative'),
  body('totalEarnings2082').optional().isFloat({ min: 0 }).withMessage('Earnings must be non-negative'),
  body('satisfactionLevel').isInt({ min: 0, max: 10 }).withMessage('Satisfaction must be 0-10'),
];

export const validateLoginData = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const validateRegistration = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase')
    .matches(/[0-9]/)
    .withMessage('Password must contain numbers'),
  body('role').isIn(['farmer', 'trader', 'surveyor']).withMessage('Invalid role'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const validateMarketPrice = [
  body('market').isIn(['Kalimati', 'Balkhu', 'Lahan', 'Janakpur', 'Hetauda', 'Bhaktapur', 'Kathmandu']),
  body('variety').notEmpty().withMessage('Variety is required'),
  body('wholesalePricePerKg').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('retailPricePerKg').isFloat({ min: 0 }).withMessage('Price must be positive'),
];

export const validateBuyingRequirement = [
  body('variety').notEmpty().withMessage('Variety is required'),
  body('quantityMT').isFloat({ min: 0.1 }).withMessage('Quantity must be at least 0.1 MT'),
  body('budget.minPricePerKg').isFloat({ min: 0 }),
  body('budget.maxPricePerKg').isFloat({ min: 0 }),
  body('requiredByDate').isISO8601().withMessage('Valid date required'),
  body('location.district').notEmpty().withMessage('District is required'),
];

export default {
  validateSurveyData,
  validateLoginData,
  validateRegistration,
  handleValidationErrors,
  validatePagination,
  validateMarketPrice,
  validateBuyingRequirement,
};