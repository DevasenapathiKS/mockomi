import mongoose, { Document, Types } from 'mongoose';
import { ICompanyProfile } from '../types';
export interface ICompanyProfileDocument extends Omit<ICompanyProfile, 'userId'>, Document {
    userId: Types.ObjectId;
}
declare const CompanyProfile: mongoose.Model<ICompanyProfileDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICompanyProfileDocument, {}, {}> & ICompanyProfileDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default CompanyProfile;
//# sourceMappingURL=CompanyProfile.d.ts.map