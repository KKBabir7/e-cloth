/**
 * CustomWear BD - Shared Utility Functions
 */

/**
 * Validates Bangladesh mobile phone numbers.
 * Supports: +88017..., 88017..., 017... (11 digits after standard prefixes)
 * @param {string} phone
 * @returns {boolean}
 */
const validateBdPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  const regex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
  return regex.test(cleaned);
};

/**
 * Normalizes phone numbers to standard 11 digit format (01XXXXXXXXX) for consistency
 * @param {string} phone
 * @returns {string}
 */
const normalizePhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s-]/g, '');
  const match = cleaned.match(/^(?:\+88|88)?(01[3-9]\d{8})$/);
  return match ? match[1] : cleaned;
};

/**
 * Calculates shipping charges based on division/district in Bangladesh
 * @param {string} district - The shipping district
 * @returns {number} - BDT Charge
 */
const calculateDeliveryCharge = (district) => {
  if (!district) return 80; // default
  const cleanDistrict = district.trim().toLowerCase();
  if (cleanDistrict === 'dhaka' || cleanDistrict === 'dhaka city') {
    return 80; // Inside Dhaka BDT 80
  }
  return 150; // Outside Dhaka BDT 150
};

/**
 * Validates generic email format
 * @param {string} email
 * @returns {boolean}
 */
const validateEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase());
};

module.exports = {
  validateBdPhone,
  normalizePhone,
  calculateDeliveryCharge,
  validateEmail
};
