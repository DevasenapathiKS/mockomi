import mongoose, { Document, Types } from 'mongoose';
import { IWithdrawal } from '../types';
export interface IWithdrawalDocument extends Omit<IWithdrawal, '_id' | 'userId'>, Document {
    userId: Types.ObjectId;
}
declare const Withdrawal: mongoose.Model<IWithdrawalDocument, {}, {}, {}, mongoose.Document<unknown, {}, IWithdrawalDocument, {}, {}> & IWithdrawalDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Withdrawal;
//# sourceMappingURL=Withdrawal.d.ts.map