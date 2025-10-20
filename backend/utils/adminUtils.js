import User from '../models/userModel.js';

export const getActiveAdminEmails = async () => {
  const admins = await User.find({ role: 'admin', isActive: true }).select('email name');
  return admins.filter(admin => Boolean(admin?.email)).map(admin => admin.email.toLowerCase());
};
