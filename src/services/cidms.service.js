const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.CIDMS_API_KEY;
const BASE_URL = 'https://pidkey.com/ajax';

/**
 * Check a Microsoft product key using PIDMS API
 * @param {string} key - the license key to check
 */
async function checkKey(key) {
  try {
    const url = `${BASE_URL}/pidms_api?keys=${encodeURIComponent(key)}&justgetdescription=0&apikey=${API_KEY}`;
    const res = await axios.get(url, { timeout: 120000 }); // pidkey.com supports >100s timeout
    return res.data;
  } catch (err) {
    console.error('PIDMS API error:', err.message);
    return null;
  }
}

/**
 * Get Confirmation ID from Installation ID using CIDMS API
 * @param {string} iid - Installation ID
 */
async function getCID(iid) {
  try {
    const url = `${BASE_URL}/cidms_api?iids=${encodeURIComponent(iid)}&justforcheck=0&apikey=${API_KEY}`;
    const res = await axios.get(url, { timeout: 120000 });
    return res.data;
  } catch (err) {
    console.error('CIDMS API error:', err.message);
    return null;
  }
}

/**
 * Redeem a Microsoft key
 * @param {string} key
 */
async function redeemKey(key) {
  try {
    const url = `${BASE_URL}/redeemms_api?keys=${encodeURIComponent(key)}&apikey=${API_KEY}`;
    const res = await axios.get(url, { timeout: 120000 });
    return res.data;
  } catch (err) {
    console.error('RedeemMS API error:', err.message);
    return null;
  }
}

module.exports = { checkKey, getCID, redeemKey };
