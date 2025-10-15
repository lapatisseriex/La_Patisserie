import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    email: { type: String, required: false }, // Removed index: true to avoid duplicate with compound index below
    orderId: { type: String, required: true, index: true }, // could be app order number or gateway order id
    movieName: { type: String, required: false },
    amount: { type: Number, required: true }, // store in rupees
    paymentMethod: { type: String, enum: ['razorpay','cod', 'upi', 'card', 'wallet', 'netbanking'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending', index: true },
    date: { type: Date, default: Date.now, index: true },
    parkingType: { type: String, required: false },
    seatCount: { type: Number, required: false },
    gatewayPaymentId: { type: String, required: false, unique: true, sparse: true }, // ✅ Unique constraint to prevent duplicates
    gatewayOrderId: { type: String, required: false },
    meta: { type: Object, required: false },
  },
  { timestamps: true }
);

// Compound index for email and date queries (this will create an index on email automatically)
PaymentSchema.index({ email: 1, date: -1 });
// ✅ Compound index for faster duplicate checks
PaymentSchema.index({ gatewayPaymentId: 1, paymentStatus: 1 });

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
