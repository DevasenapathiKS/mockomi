import mongoose, { Document, Types } from 'mongoose';
import { IJobSeekerProfile } from '../types';
export interface IJobSeekerProfileDocument extends Omit<IJobSeekerProfile, 'userId'>, Document {
    userId: Types.ObjectId;
}
declare const JobSeekerProfile: mongoose.Model<IJobSeekerProfileDocument, {}, {}, {}, mongoose.Document<unknown, {}, IJobSeekerProfileDocument, {}, {}> & IJobSeekerProfileDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default JobSeekerProfile;
//# sourceMappingURL=JobSeekerProfile.d.ts.map