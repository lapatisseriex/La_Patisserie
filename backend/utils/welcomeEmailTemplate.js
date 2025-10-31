// Simple welcome email template for new users

export const getWelcomeEmailTemplate = (userDetails) => {
  const { name, email } = userDetails;

  return {
    subject: `Welcome to La Pâtisserie!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to La Pâtisserie</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 20px;">
          
          <h1 style="color: #333; margin-bottom: 20px;">Welcome to La Pâtisserie!</h1>
          
          <p style="margin-bottom: 15px;">Hi ${name || 'there'},</p>
          
          <p style="margin-bottom: 15px;">Thank you for creating an account with La Pâtisserie! We're excited to have you join our community.</p>
          
          <p style="margin-bottom: 15px;">You can now:</p>
          <ul style="margin-bottom: 15px; padding-left: 20px;">
            <li>Browse our delicious collection of pastries and baked goods</li>
            <li>Place orders and track them easily</li>
            <li>Save your favorite items</li>
            <li>Get updates on new products and special offers</li>
          </ul>
          
          <p style="margin-bottom: 15px;">

            Visit our website: <a href="https://www.lapatisserie.shop" style="color: #333; text-decoration: underline;">www.lapatisserie.shop</a>

            <a href="https://www.lapatisserie.shop" style="color: #333; text-decoration: underline; font-weight: bold;">Start Shopping</a>

          </p>
          
          <p style="margin-bottom: 15px;">If you have any questions, feel free to reach out to us anytime.</p>
          
          <p style="margin-bottom: 5px;">Best regards,</p>
          <p style="margin-bottom: 20px;"><strong>La Pâtisserie Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #666; margin: 0;">
            La Pâtisserie<br>
            Email: lapatisserielapatisserie@gmail.com<br>
            Website: <a href="https://www.lapatisserie.shop" style="color: #333;">www.lapatisserie.shop</a>
          </p>
          
        </div>
      </body>
      </html>
    `
  };
};
