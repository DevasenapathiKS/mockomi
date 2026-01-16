import mongoose, { Document, Types } from 'mongoose';
export interface ICouponUsageDocument extends Document {
    userId: Types.ObjectId;
    couponId: Types.ObjectId;
    usageCount: number;
    lastUsedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const CouponUsage: mongoose.Model<ICouponUsageDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICouponUsageDocument, {}, {}> & ICouponUsageDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default CouponUsage;
//# sourceMappingURL=CouponUsage.d.ts.map