import fs from 'fs';
import path from 'path';

/**
 * Get logo data for email attachments
 * @returns {Buffer|null} Logo buffer data or null if not found
 */
export const getLogoData = () => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    
    if (fs.existsSync(logoPath)) {
      console.log('📎 Reading logo from public directory for email attachment');
      return fs.readFileSync(logoPath);
    } else {
      console.log('⚠️  Logo not found in public directory');
      return null;
    }
  } catch (error) {
    console.error('❌ Error reading logo data:', error);
    return null;
  }
};

/**
 * Get logo as base64 string
 * @returns {string|null} Logo base64 string or null if not found
 */
export const getLogoBase64 = () => {
  try {
    const logoData = getLogoData();
    return logoData ? logoData.toString('base64') : null;
  } catch (error) {
    console.error('❌ Error converting logo to base64:', error);
    return null;
  }
};

/**
 * Get logo URL for public access
 * @returns {string} Public logo URL
 */
export const getLogoUrl = () => {
  const baseUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
  return `${baseUrl}/api/public/logo`;
};