import mongoose from 'mongoose';

const MetalPricesSchema = new mongoose.Schema(
    {
        metalType: { type: String, enum: ['iron', 'aluminum', 'copper'], required: true },
        pricePerKg: { type: Number, required: true }
    },
    { timestamps: true }
);

const MetalPrice = mongoose.model('MetalPrice', MetalPricesSchema);
export default MetalPrice; 