import mongoose, { Document, Types } from 'mongoose';
import { IInterviewerProfile } from '../types';
export interface IInterviewerProfileDocument extends Omit<IInterviewerProfile, 'userId' | 'approvedBy'>, Document {
    userId: Types.ObjectId;
    approvedBy?: Types.ObjectId;
}
declare const InterviewerProfile: mongoose.Model<IInterviewerProfileDocument, {}, {}, {}, mongoose.Document<unknown, {}, IInterviewerProfileDocument, {}, {}> & IInterviewerProfileDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default InterviewerProfile;
//# sourceMappingURL=InterviewerProfile.d.ts.map