import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Generate an invoice PDF Buffer for an order
export async function generateInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('error', reject);
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const orderNumber = order?.orderNumber || `INV-${Date.now()}`;
        resolve({ filename: `Invoice-${orderNumber}.pdf`, buffer });
      });

      const brand = 'La Pâtisserie';
      const orderNumber = order?.orderNumber || '';
      const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();
      const user = order?.userDetails || order?.userId || {};
      const summary = order?.orderSummary || {};
      const items = Array.isArray(order?.cartItems) ? order.cartItems : [];
      const paymentMethod = (order?.paymentMethod || '').toUpperCase();

      const pageLeft = 50;
      const pageRight = doc.page.width - 50;
      const pageWidth = pageRight - pageLeft;
      let currentY = 50;

      // ========== HEADER: LOGO + BRAND ==========
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      const logoSize = 50;
      
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, pageLeft, currentY, { width: logoSize, height: logoSize });
        } catch (e) {
          console.error('Logo load error:', e);
        }
      }
      
      // Brand name vertically centered with logo
      doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#111827')
        .text(brand, pageLeft + logoSize + 12, currentY + (logoSize / 2) - 12, { align: 'left' });
      
      currentY += logoSize + 20;

      // Order number and date
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`Invoice #${orderNumber}`, pageLeft, currentY);
      doc.text(`Date: ${createdAt.toLocaleDateString('en-IN')} ${createdAt.toLocaleTimeString('en-IN')}`, pageLeft, currentY + 14);
      
      currentY += 40;

      // Horizontal divider
      doc.moveTo(pageLeft, currentY)
        .lineTo(pageRight, currentY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      
      currentY += 20;

      // ========== TWO-COLUMN SECTION: CUSTOMER & DELIVERY ==========
      const colWidth = (pageWidth - 20) / 2;
      const col1X = pageLeft;
      const col2X = pageLeft + colWidth + 20;
      const sectionStartY = currentY;

      // Helper function to draw key-value pairs
      const drawKeyValuePairs = (x, y, pairs, maxWidth) => {
        let localY = y;
        pairs.forEach(([key, value]) => {
          doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151');
          doc.text(`${key}:`, x, localY, { continued: false });
          
          doc.font('Helvetica').fontSize(10).fillColor('#111827');
          doc.text(`  ${value || '—'}`, x + 90, localY, { width: maxWidth - 90, align: 'left' });
          

          localY += 22; // Increased from 18 to 22 for better vertical spacing

          localY += 22;

        });
        return localY;
      };

      // Column 1: Customer Details
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
      doc.text('Customer Details', col1X, currentY);
      currentY += 20;
      
      const col1EndY = drawKeyValuePairs(col1X, currentY, [
        ['Name', user.name || 'Customer'],
        ['Email', user.email || ''],
        ['Phone', user.phone || '']
      ], colWidth);

      // Column 2: Delivery Details
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
      doc.text('Delivery Details', col2X, sectionStartY);
      
      const col2EndY = drawKeyValuePairs(col2X, sectionStartY + 20, [
        ['Location', order?.deliveryLocation || '—'],
        ['Hostel', order?.hostelName || '—'],
        ['Payment', paymentMethod || '—']
      ], colWidth);

      currentY = Math.max(col1EndY, col2EndY) + 15;

      // Horizontal divider
      doc.moveTo(pageLeft, currentY)
        .lineTo(pageRight, currentY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      
      currentY += 20;

      // ========== ORDER DETAILS SECTION ==========
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
      doc.text('Order Details', pageLeft, currentY);
      currentY += 20;

      currentY = drawKeyValuePairs(pageLeft, currentY, [
        ['Order Number', orderNumber || '—'],
        ['Placed At', createdAt.toLocaleString('en-IN')],
        ['Items Count', String(items.length || 0)]
      ], pageWidth);

      currentY += 15;

      // Horizontal divider
      doc.moveTo(pageLeft, currentY)
        .lineTo(pageRight, currentY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();
      
      currentY += 20;

      // ========== ITEMS TABLE ==========
      const tableWidths = {
        item: pageWidth * 0.45,
        qty: 60,
        price: 90,
        total: 90
      };

      // Table Header
      const drawTableHeader = (y) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
        
        doc.text('Item', pageLeft, y, { width: tableWidths.item, align: 'left' });
        doc.text('Qty', pageLeft + tableWidths.item, y, { width: tableWidths.qty, align: 'right' });
        doc.text('Price', pageLeft + tableWidths.item + tableWidths.qty, y, { width: tableWidths.price, align: 'right' });
        doc.text('Total', pageLeft + tableWidths.item + tableWidths.qty + tableWidths.price, y, { width: tableWidths.total, align: 'right' });
        
        const lineY = y + 16;
        doc.moveTo(pageLeft, lineY).lineTo(pageRight, lineY).strokeColor('#9ca3af').lineWidth(1).stroke();
        
        return lineY + 8;
      };

      currentY = drawTableHeader(currentY);

      // Table Rows
      const drawTableRow = (y, itemName, qty, price, total) => {
        doc.font('Helvetica').fontSize(10).fillColor('#111827');
        
        const itemHeight = doc.heightOfString(itemName, { width: tableWidths.item - 10 });
        doc.text(itemName, pageLeft, y, { width: tableWidths.item - 10, align: 'left' });
        
        const rowHeight = Math.max(itemHeight, 14);
        
        doc.text(String(qty), pageLeft + tableWidths.item, y, { width: tableWidths.qty, align: 'right' });
        doc.text(formatCurrency(price), pageLeft + tableWidths.item + tableWidths.qty, y, { width: tableWidths.price, align: 'right' });
        doc.text(formatCurrency(total), pageLeft + tableWidths.item + tableWidths.qty + tableWidths.price, y, { width: tableWidths.total, align: 'right' });
        
        return y + rowHeight + 8;
      };

      // Draw all items
      items.forEach((item) => {
        const itemName = item.productName || item.name || 'Item';
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const total = qty * price;

        if (currentY > doc.page.height - 150) {
          doc.addPage();
          currentY = 60;
          currentY = drawTableHeader(currentY);
        }

        currentY = drawTableRow(currentY, itemName, qty, price, total);
      });

      // Bottom line after items
      doc.moveTo(pageLeft, currentY).lineTo(pageRight, currentY).strokeColor('#e5e7eb').lineWidth(1).stroke();
      currentY += 20;

      // ========== TOTALS SECTION ==========
      const totalsLabelX = pageLeft;
      const totalsValueX = pageRight - 100;

      const drawTotalRow = (label, value, isBold = false) => {
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor('#374151');
        doc.text(label, totalsLabelX, currentY, { align: 'left' });
        
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor('#111827');
        doc.text(formatCurrency(value), totalsValueX, currentY, { width: 100, align: 'right' });
        
        currentY += 18;
      };

      const discount = Number(summary.couponDiscount ?? 0);
      const tax = Number(summary.taxAmount ?? 0);
      const delivery = Number(summary.deliveryCharge ?? 0);
      const grandTotal = Number(summary.grandTotal ?? 0);

      if (discount > 0) drawTotalRow('Discount', -discount);
      if (tax > 0) drawTotalRow('Tax', tax);
      if (delivery > 0) drawTotalRow('Delivery Charge', delivery);
      
      currentY += 5;
      doc.moveTo(totalsLabelX, currentY).lineTo(pageRight, currentY).strokeColor('#9ca3af').lineWidth(1).stroke();
      currentY += 10;
      
      drawTotalRow('Grand Total', grandTotal, true);

      // Footer
      currentY += 30;
      doc.font('Helvetica').fontSize(9).fillColor('#6b7280');
      doc.text('Thank you for your order!', pageLeft, currentY, { align: 'center', width: pageWidth });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

function formatCurrency(v) {
  let n = 0;
  if (typeof v === 'number') {
    n = v;
  } else if (typeof v === 'string') {
    const cleaned = v.replace(/[^0-9.\-]/g, '');
    const parsed = parseFloat(cleaned);
    n = Number.isFinite(parsed) ? parsed : 0;
  } else {
    const parsed = Number(v);
    n = Number.isFinite(parsed) ? parsed : 0;
  }
  return `INR ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
