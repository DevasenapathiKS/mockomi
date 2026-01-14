import mongoose, { Document, Types } from 'mongoose';
import { INotification } from '../types';
export interface INotificationDocument extends Omit<INotification, '_id' | 'userId'>, Document {
    userId: Types.ObjectId;
}
declare const Notification: mongoose.Model<INotificationDocument, {}, {}, {}, mongoose.Document<unknown, {}, INotificationDocument, {}, {}> & INotificationDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map