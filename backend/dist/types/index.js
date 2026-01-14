"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceLevel = exports.EmploymentType = exports.EducationLevel = exports.WithdrawalMethod = exports.WithdrawalStatus = exports.PaymentStatus = exports.ApplicationStatus = exports.JobStatus = exports.InterviewType = exports.InterviewStatus = exports.UserStatus = exports.UserRole = void 0;
// User Roles
var UserRole;
(function (UserRole) {
    UserRole["JOB_SEEKER"] = "job_seeker";
    UserRole["EMPLOYER"] = "employer";
    UserRole["INTERVIEWER"] = "interviewer";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
// User Status
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["PENDING"] = "pending";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
// Interview Status
var InterviewStatus;
(function (InterviewStatus) {
    InterviewStatus["REQUESTED"] = "requested";
    InterviewStatus["SCHEDULED"] = "scheduled";
    InterviewStatus["IN_PROGRESS"] = "in_progress";
    InterviewStatus["COMPLETED"] = "completed";
    InterviewStatus["CANCELLED"] = "cancelled";
    InterviewStatus["NO_SHOW"] = "no_show";
    InterviewStatus["EXPIRED"] = "expired";
})(InterviewStatus || (exports.InterviewStatus = InterviewStatus = {}));
// Interview Type
var InterviewType;
(function (InterviewType) {
    InterviewType["TECHNICAL"] = "technical";
    InterviewType["BEHAVIORAL"] = "behavioral";
    InterviewType["SYSTEM_DESIGN"] = "system_design";
    InterviewType["HR"] = "hr";
    InterviewType["CODING"] = "coding";
    InterviewType["GENERAL"] = "general";
})(InterviewType || (exports.InterviewType = InterviewType = {}));
// Job Status
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "draft";
    JobStatus["ACTIVE"] = "active";
    JobStatus["PAUSED"] = "paused";
    JobStatus["CLOSED"] = "closed";
    JobStatus["EXPIRED"] = "expired";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
// Application Status
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "applied";
    ApplicationStatus["REVIEWING"] = "reviewing";
    ApplicationStatus["SHORTLISTED"] = "shortlisted";
    ApplicationStatus["INTERVIEW"] = "interview";
    ApplicationStatus["OFFERED"] = "offered";
    ApplicationStatus["REJECTED"] = "rejected";
    ApplicationStatus["WITHDRAWN"] = "withdrawn";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
// Payment Status
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
// Withdrawal Status
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "pending";
    WithdrawalStatus["PROCESSING"] = "processing";
    WithdrawalStatus["COMPLETED"] = "completed";
    WithdrawalStatus["FAILED"] = "failed";
    WithdrawalStatus["REVERSED"] = "reversed";
})(WithdrawalStatus || (exports.WithdrawalStatus = WithdrawalStatus = {}));
// Withdrawal Method
var WithdrawalMethod;
(function (WithdrawalMethod) {
    WithdrawalMethod["BANK_TRANSFER"] = "bank_transfer";
    WithdrawalMethod["UPI"] = "upi";
})(WithdrawalMethod || (exports.WithdrawalMethod = WithdrawalMethod = {}));
// Education Level
var EducationLevel;
(function (EducationLevel) {
    EducationLevel["HIGH_SCHOOL"] = "high_school";
    EducationLevel["DIPLOMA"] = "diploma";
    EducationLevel["BACHELORS"] = "bachelors";
    EducationLevel["MASTERS"] = "masters";
    EducationLevel["PHD"] = "phd";
    EducationLevel["OTHER"] = "other";
})(EducationLevel || (exports.EducationLevel = EducationLevel = {}));
// Employment Type
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "full_time";
    EmploymentType["PART_TIME"] = "part_time";
    EmploymentType["CONTRACT"] = "contract";
    EmploymentType["FREELANCE"] = "freelance";
    EmploymentType["INTERNSHIP"] = "internship";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
// Experience Level
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["FRESHER"] = "fresher";
    ExperienceLevel["JUNIOR"] = "junior";
    ExperienceLevel["MID"] = "mid";
    ExperienceLevel["SENIOR"] = "senior";
    ExperienceLevel["LEAD"] = "lead";
    ExperienceLevel["MANAGER"] = "manager";
    ExperienceLevel["DIRECTOR"] = "director";
    ExperienceLevel["EXECUTIVE"] = "executive";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
//# sourceMappingURL=index.js.map