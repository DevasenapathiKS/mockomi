import mongoose, { Document, Types } from 'mongoose';
import { IInterview } from '../types';
export interface IInterviewDocument extends Omit<IInterview, '_id' | 'jobSeekerId' | 'interviewerId' | 'payment'>, Document {
    jobSeekerId: Types.ObjectId;
    interviewerId: Types.ObjectId;
    payment?: Types.ObjectId;
}
declare const Interview: mongoose.Model<IInterviewDocument, {}, {}, {}, mongoose.Document<unknown, {}, IInterviewDocument, {}, {}> & IInterviewDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Interview;
//# sourceMappingURL=Interview.d.ts.map