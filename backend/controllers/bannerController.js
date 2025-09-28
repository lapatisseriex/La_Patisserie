// Banner backend is disabled. All endpoints return 410 Gone.
export const getBanners = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const getAllBannersAdmin = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const getBanner = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const createBanner = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const updateBanner = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const deleteBanner = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const toggleBannerStatus = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });
export const reorderBanners = (req, res) => res.status(410).json({ success: false, message: 'Banners API removed. Use frontend static assets.' });