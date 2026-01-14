import mongoose, { Document, Types } from 'mongoose';
import { IJob } from '../types';
export interface IJobDocument extends Omit<IJob, '_id' | 'employerId' | 'companyId'>, Document {
    employerId: Types.ObjectId;
    companyId: Types.ObjectId;
}
declare const Job: mongoose.Model<IJobDocument, {}, {}, {}, mongoose.Document<unknown, {}, IJobDocument, {}, {}> & IJobDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Job;
//# sourceMappingURL=Job.d.ts.map