import mongoose, { Document, Types } from 'mongoose';
import { IPayment } from '../types';
export interface IPaymentDocument extends Omit<IPayment, '_id' | 'userId' | 'interviewId'>, Document {
    userId: Types.ObjectId;
    interviewId?: Types.ObjectId;
}
declare const Payment: mongoose.Model<IPaymentDocument, {}, {}, {}, mongoose.Document<unknown, {}, IPaymentDocument, {}, {}> & IPaymentDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Payment;
//# sourceMappingURL=Payment.d.ts.map