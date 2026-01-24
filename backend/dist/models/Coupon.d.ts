import mongoose, { Document, Types } from 'mongoose';
export interface ICouponDocument extends Document {
    code: string;
    description: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    perUserLimit: number;
    globalLimit?: number;
    totalUsed: number;
    isActive: boolean;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const Coupon: mongoose.Model<ICouponDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICouponDocument, {}, {}> & ICouponDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Coupon;
//# sourceMappingURL=Coupon.d.ts.map