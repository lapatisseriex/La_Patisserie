import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Serve logo specifically
router.get('/logo', (req, res) => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    
    if (fs.existsSync(logoPath)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.sendFile(logoPath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Logo not found'
      });
    }
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get logo as base64 for email attachments
router.get('/logo/base64', (req, res) => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      
      res.json({
        success: true,
        data: logoBase64,
        mimeType: 'image/png',
        filename: 'logo.png'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Logo not found'
      });
    }
  } catch (error) {
    console.error('Error serving logo as base64:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;