import mongoose, { Document, Types } from 'mongoose';
import { IJobApplication } from '../types';
export interface IJobApplicationDocument extends Omit<IJobApplication, '_id' | 'jobId' | 'jobSeekerId' | 'reviewedBy'>, Document {
    jobId: Types.ObjectId;
    jobSeekerId: Types.ObjectId;
    reviewedBy?: Types.ObjectId;
}
declare const JobApplication: mongoose.Model<IJobApplicationDocument, {}, {}, {}, mongoose.Document<unknown, {}, IJobApplicationDocument, {}, {}> & IJobApplicationDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default JobApplication;
//# sourceMappingURL=JobApplication.d.ts.map