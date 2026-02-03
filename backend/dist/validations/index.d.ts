import { z } from 'zod';
import { UserRole, EducationLevel, EmploymentType, ExperienceLevel } from '../types';
export declare const objectIdSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    order: "asc" | "desc";
    sort?: string | undefined;
}, {
    limit?: string | undefined;
    sort?: string | undefined;
    page?: string | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodEnum<[UserRole.JOB_SEEKER, UserRole.EMPLOYER, UserRole.INTERVIEWER]>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    role: UserRole.JOB_SEEKER | UserRole.EMPLOYER | UserRole.INTERVIEWER;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    role: UserRole.JOB_SEEKER | UserRole.EMPLOYER | UserRole.INTERVIEWER;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const educationSchema: z.ZodObject<{
    institution: z.ZodString;
    degree: z.ZodString;
    field: z.ZodString;
    level: z.ZodNativeEnum<typeof EducationLevel>;
    startDate: z.ZodEffects<z.ZodString, Date, string>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    isCurrent: z.ZodDefault<z.ZodBoolean>;
    grade: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    level: EducationLevel;
    institution: string;
    degree: string;
    field: string;
    startDate: Date;
    isCurrent: boolean;
    description?: string | undefined;
    endDate?: Date | undefined;
    grade?: string | undefined;
}, {
    level: EducationLevel;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    description?: string | undefined;
    endDate?: string | undefined;
    isCurrent?: boolean | undefined;
    grade?: string | undefined;
}>;
export declare const workExperienceSchema: z.ZodObject<{
    company: z.ZodString;
    title: z.ZodString;
    employmentType: z.ZodNativeEnum<typeof EmploymentType>;
    location: z.ZodOptional<z.ZodString>;
    startDate: z.ZodEffects<z.ZodString, Date, string>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    isCurrent: z.ZodDefault<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    startDate: Date;
    isCurrent: boolean;
    company: string;
    title: string;
    employmentType: EmploymentType;
    description?: string | undefined;
    location?: string | undefined;
    skills?: string[] | undefined;
    endDate?: Date | undefined;
}, {
    startDate: string;
    company: string;
    title: string;
    employmentType: EmploymentType;
    description?: string | undefined;
    location?: string | undefined;
    skills?: string[] | undefined;
    endDate?: string | undefined;
    isCurrent?: boolean | undefined;
}>;
export declare const skillSchema: z.ZodObject<{
    name: z.ZodString;
    level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
    yearsOfExperience: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    level: "beginner" | "intermediate" | "advanced" | "expert";
    name: string;
    yearsOfExperience?: number | undefined;
}, {
    level: "beginner" | "intermediate" | "advanced" | "expert";
    name: string;
    yearsOfExperience?: number | undefined;
}>;
export declare const projectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    technologies: z.ZodArray<z.ZodString, "many">;
    url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    githubUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    startDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    endDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    isCurrent: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    isCurrent: boolean;
    title: string;
    technologies: string[];
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    url?: string | undefined;
    githubUrl?: string | undefined;
}, {
    description: string;
    title: string;
    technologies: string[];
    startDate?: string | undefined;
    endDate?: string | undefined;
    isCurrent?: boolean | undefined;
    url?: string | undefined;
    githubUrl?: string | undefined;
}>;
export declare const certificationSchema: z.ZodObject<{
    name: z.ZodString;
    issuer: z.ZodString;
    issueDate: z.ZodEffects<z.ZodString, Date, string>;
    expiryDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    credentialId: z.ZodOptional<z.ZodString>;
    credentialUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date | undefined;
    credentialId?: string | undefined;
    credentialUrl?: string | undefined;
}, {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string | undefined;
    credentialId?: string | undefined;
    credentialUrl?: string | undefined;
}>;
export declare const socialLinksSchema: z.ZodObject<{
    linkedin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    github: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    portfolio: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    twitter: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    other: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    other?: string[] | undefined;
    github?: string | undefined;
    linkedin?: string | undefined;
    portfolio?: string | undefined;
    twitter?: string | undefined;
}, {
    other?: string[] | undefined;
    github?: string | undefined;
    linkedin?: string | undefined;
    portfolio?: string | undefined;
    twitter?: string | undefined;
}>;
export declare const jobPreferencesSchema: z.ZodObject<{
    expectedSalary: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        max: number;
        min: number;
        currency: string;
    }, {
        max: number;
        min: number;
        currency?: string | undefined;
    }>>;
    preferredLocations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    employmentTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof EmploymentType>, "many">>;
    noticePeriod: z.ZodOptional<z.ZodNumber>;
    isOpenToRemote: z.ZodOptional<z.ZodBoolean>;
    isActivelyLooking: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    expectedSalary?: {
        max: number;
        min: number;
        currency: string;
    } | undefined;
    preferredLocations?: string[] | undefined;
    employmentTypes?: EmploymentType[] | undefined;
    noticePeriod?: number | undefined;
    isOpenToRemote?: boolean | undefined;
    isActivelyLooking?: boolean | undefined;
}, {
    expectedSalary?: {
        max: number;
        min: number;
        currency?: string | undefined;
    } | undefined;
    preferredLocations?: string[] | undefined;
    employmentTypes?: EmploymentType[] | undefined;
    noticePeriod?: number | undefined;
    isOpenToRemote?: boolean | undefined;
    isActivelyLooking?: boolean | undefined;
}>;
export declare const jobSeekerProfileSchema: z.ZodObject<{
    headline: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
    gender: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
    }, {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
    }>>;
    education: z.ZodOptional<z.ZodArray<z.ZodObject<{
        institution: z.ZodString;
        degree: z.ZodString;
        field: z.ZodString;
        level: z.ZodNativeEnum<typeof EducationLevel>;
        startDate: z.ZodEffects<z.ZodString, Date, string>;
        endDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
        isCurrent: z.ZodDefault<z.ZodBoolean>;
        grade: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        level: EducationLevel;
        institution: string;
        degree: string;
        field: string;
        startDate: Date;
        isCurrent: boolean;
        description?: string | undefined;
        endDate?: Date | undefined;
        grade?: string | undefined;
    }, {
        level: EducationLevel;
        institution: string;
        degree: string;
        field: string;
        startDate: string;
        description?: string | undefined;
        endDate?: string | undefined;
        isCurrent?: boolean | undefined;
        grade?: string | undefined;
    }>, "many">>;
    experience: z.ZodOptional<z.ZodArray<z.ZodObject<{
        company: z.ZodString;
        title: z.ZodString;
        employmentType: z.ZodNativeEnum<typeof EmploymentType>;
        location: z.ZodOptional<z.ZodString>;
        startDate: z.ZodEffects<z.ZodString, Date, string>;
        endDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
        isCurrent: z.ZodDefault<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        startDate: Date;
        isCurrent: boolean;
        company: string;
        title: string;
        employmentType: EmploymentType;
        description?: string | undefined;
        location?: string | undefined;
        skills?: string[] | undefined;
        endDate?: Date | undefined;
    }, {
        startDate: string;
        company: string;
        title: string;
        employmentType: EmploymentType;
        description?: string | undefined;
        location?: string | undefined;
        skills?: string[] | undefined;
        endDate?: string | undefined;
        isCurrent?: boolean | undefined;
    }>, "many">>;
    skills: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodObject<{
        name: z.ZodString;
        level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
        yearsOfExperience: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        level: "beginner" | "intermediate" | "advanced" | "expert";
        name: string;
        yearsOfExperience?: number | undefined;
    }, {
        level: "beginner" | "intermediate" | "advanced" | "expert";
        name: string;
        yearsOfExperience?: number | undefined;
    }>, z.ZodEffects<z.ZodString, {
        name: string;
        level: "intermediate";
        yearsOfExperience: number;
    }, string>]>, "many">>;
    projects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        technologies: z.ZodArray<z.ZodString, "many">;
        url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        githubUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        startDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
        endDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
        isCurrent: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        isCurrent: boolean;
        title: string;
        technologies: string[];
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        url?: string | undefined;
        githubUrl?: string | undefined;
    }, {
        description: string;
        title: string;
        technologies: string[];
        startDate?: string | undefined;
        endDate?: string | undefined;
        isCurrent?: boolean | undefined;
        url?: string | undefined;
        githubUrl?: string | undefined;
    }>, "many">>;
    certifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        issuer: z.ZodString;
        issueDate: z.ZodEffects<z.ZodString, Date, string>;
        expiryDate: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
        credentialId: z.ZodOptional<z.ZodString>;
        credentialUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        issuer: string;
        issueDate: Date;
        expiryDate?: Date | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }, {
        name: string;
        issuer: string;
        issueDate: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }>, "many">>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        linkedin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        github: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        portfolio: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        twitter: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        other: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    }, {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        expectedSalary: z.ZodOptional<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            max: number;
            min: number;
            currency: string;
        }, {
            max: number;
            min: number;
            currency?: string | undefined;
        }>>;
        preferredLocations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        employmentTypes: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof EmploymentType>, "many">>;
        noticePeriod: z.ZodOptional<z.ZodNumber>;
        isOpenToRemote: z.ZodOptional<z.ZodBoolean>;
        isActivelyLooking: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        expectedSalary?: {
            max: number;
            min: number;
            currency: string;
        } | undefined;
        preferredLocations?: string[] | undefined;
        employmentTypes?: EmploymentType[] | undefined;
        noticePeriod?: number | undefined;
        isOpenToRemote?: boolean | undefined;
        isActivelyLooking?: boolean | undefined;
    }, {
        expectedSalary?: {
            max: number;
            min: number;
            currency?: string | undefined;
        } | undefined;
        preferredLocations?: string[] | undefined;
        employmentTypes?: EmploymentType[] | undefined;
        noticePeriod?: number | undefined;
        isOpenToRemote?: boolean | undefined;
        isActivelyLooking?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    headline?: string | undefined;
    summary?: string | undefined;
    dateOfBirth?: Date | undefined;
    gender?: string | undefined;
    location?: {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
    } | undefined;
    education?: {
        level: EducationLevel;
        institution: string;
        degree: string;
        field: string;
        startDate: Date;
        isCurrent: boolean;
        description?: string | undefined;
        endDate?: Date | undefined;
        grade?: string | undefined;
    }[] | undefined;
    experience?: {
        startDate: Date;
        isCurrent: boolean;
        company: string;
        title: string;
        employmentType: EmploymentType;
        description?: string | undefined;
        location?: string | undefined;
        skills?: string[] | undefined;
        endDate?: Date | undefined;
    }[] | undefined;
    skills?: ({
        level: "beginner" | "intermediate" | "advanced" | "expert";
        name: string;
        yearsOfExperience?: number | undefined;
    } | {
        name: string;
        level: "intermediate";
        yearsOfExperience: number;
    })[] | undefined;
    projects?: {
        description: string;
        isCurrent: boolean;
        title: string;
        technologies: string[];
        startDate?: Date | undefined;
        endDate?: Date | undefined;
        url?: string | undefined;
        githubUrl?: string | undefined;
    }[] | undefined;
    certifications?: {
        name: string;
        issuer: string;
        issueDate: Date;
        expiryDate?: Date | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }[] | undefined;
    socialLinks?: {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    } | undefined;
    preferences?: {
        expectedSalary?: {
            max: number;
            min: number;
            currency: string;
        } | undefined;
        preferredLocations?: string[] | undefined;
        employmentTypes?: EmploymentType[] | undefined;
        noticePeriod?: number | undefined;
        isOpenToRemote?: boolean | undefined;
        isActivelyLooking?: boolean | undefined;
    } | undefined;
}, {
    headline?: string | undefined;
    summary?: string | undefined;
    dateOfBirth?: string | undefined;
    gender?: string | undefined;
    location?: {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
    } | undefined;
    education?: {
        level: EducationLevel;
        institution: string;
        degree: string;
        field: string;
        startDate: string;
        description?: string | undefined;
        endDate?: string | undefined;
        isCurrent?: boolean | undefined;
        grade?: string | undefined;
    }[] | undefined;
    experience?: {
        startDate: string;
        company: string;
        title: string;
        employmentType: EmploymentType;
        description?: string | undefined;
        location?: string | undefined;
        skills?: string[] | undefined;
        endDate?: string | undefined;
        isCurrent?: boolean | undefined;
    }[] | undefined;
    skills?: (string | {
        level: "beginner" | "intermediate" | "advanced" | "expert";
        name: string;
        yearsOfExperience?: number | undefined;
    })[] | undefined;
    projects?: {
        description: string;
        title: string;
        technologies: string[];
        startDate?: string | undefined;
        endDate?: string | undefined;
        isCurrent?: boolean | undefined;
        url?: string | undefined;
        githubUrl?: string | undefined;
    }[] | undefined;
    certifications?: {
        name: string;
        issuer: string;
        issueDate: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }[] | undefined;
    socialLinks?: {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    } | undefined;
    preferences?: {
        expectedSalary?: {
            max: number;
            min: number;
            currency?: string | undefined;
        } | undefined;
        preferredLocations?: string[] | undefined;
        employmentTypes?: EmploymentType[] | undefined;
        noticePeriod?: number | undefined;
        isOpenToRemote?: boolean | undefined;
        isActivelyLooking?: boolean | undefined;
    } | undefined;
}>;
export declare const companyProfileSchema: z.ZodObject<{
    companyName: z.ZodString;
    companyEmail: z.ZodString;
    companyPhone: z.ZodOptional<z.ZodString>;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    description: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    companySize: z.ZodOptional<z.ZodEnum<["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"]>>;
    founded: z.ZodOptional<z.ZodNumber>;
    headquarters: z.ZodOptional<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        pincode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
        address?: string | undefined;
    }, {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
        address?: string | undefined;
    }>>;
    socialLinks: z.ZodOptional<z.ZodObject<{
        linkedin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        github: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        portfolio: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        twitter: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        other: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    }, {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    companyName: string;
    companyEmail: string;
    description?: string | undefined;
    socialLinks?: {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    } | undefined;
    companyPhone?: string | undefined;
    website?: string | undefined;
    industry?: string | undefined;
    companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1001-5000" | "5000+" | undefined;
    founded?: number | undefined;
    headquarters?: {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
        address?: string | undefined;
    } | undefined;
}, {
    companyName: string;
    companyEmail: string;
    description?: string | undefined;
    socialLinks?: {
        other?: string[] | undefined;
        github?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        twitter?: string | undefined;
    } | undefined;
    companyPhone?: string | undefined;
    website?: string | undefined;
    industry?: string | undefined;
    companySize?: "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1001-5000" | "5000+" | undefined;
    founded?: number | undefined;
    headquarters?: {
        city?: string | undefined;
        state?: string | undefined;
        country?: string | undefined;
        pincode?: string | undefined;
        address?: string | undefined;
    } | undefined;
}>;
export declare const bankDetailsSchema: z.ZodObject<{
    accountHolderName: z.ZodString;
    accountNumber: z.ZodString;
    ifscCode: z.ZodString;
    bankName: z.ZodString;
    branchName: z.ZodOptional<z.ZodString>;
    upiId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string | undefined;
    upiId?: string | undefined;
}, {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string | undefined;
    upiId?: string | undefined;
}>;
export declare const interviewerProfileSchema: z.ZodObject<{
    expertise: z.ZodArray<z.ZodString, "many">;
    experience: z.ZodNumber;
    bio: z.ZodOptional<z.ZodString>;
    linkedinUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    currentCompany: z.ZodOptional<z.ZodString>;
    currentPosition: z.ZodOptional<z.ZodString>;
    interviewTypes: z.ZodOptional<z.ZodArray<z.ZodEnum<["technical", "behavioral", "system_design", "hr", "coding", "general"]>, "many">>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    hourlyRate: z.ZodOptional<z.ZodNumber>;
    availability: z.ZodOptional<z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNumber;
        slots: z.ZodArray<z.ZodObject<{
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            startTime: string;
            endTime: string;
        }, {
            startTime: string;
            endTime: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }, {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }>, "many">>;
    bankDetails: z.ZodOptional<z.ZodObject<{
        accountHolderName: z.ZodString;
        accountNumber: z.ZodString;
        ifscCode: z.ZodString;
        bankName: z.ZodString;
        branchName: z.ZodOptional<z.ZodString>;
        upiId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    }, {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    experience: number;
    expertise: string[];
    bio?: string | undefined;
    linkedinUrl?: string | undefined;
    currentCompany?: string | undefined;
    currentPosition?: string | undefined;
    availability?: {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }[] | undefined;
    interviewTypes?: ("technical" | "behavioral" | "system_design" | "hr" | "coding" | "general")[] | undefined;
    languages?: string[] | undefined;
    hourlyRate?: number | undefined;
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    } | undefined;
}, {
    experience: number;
    expertise: string[];
    bio?: string | undefined;
    linkedinUrl?: string | undefined;
    currentCompany?: string | undefined;
    currentPosition?: string | undefined;
    availability?: {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }[] | undefined;
    interviewTypes?: ("technical" | "behavioral" | "system_design" | "hr" | "coding" | "general")[] | undefined;
    languages?: string[] | undefined;
    hourlyRate?: number | undefined;
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    } | undefined;
}>;
export declare const updateInterviewerProfileSchema: z.ZodObject<{
    expertise: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    experience: z.ZodOptional<z.ZodNumber>;
    bio: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    linkedinUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    currentCompany: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    currentPosition: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    interviewTypes: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodEnum<["technical", "behavioral", "system_design", "hr", "coding", "general"]>, "many">>>;
    languages: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    hourlyRate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    availability: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNumber;
        slots: z.ZodArray<z.ZodObject<{
            startTime: z.ZodString;
            endTime: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            startTime: string;
            endTime: string;
        }, {
            startTime: string;
            endTime: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }, {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }>, "many">>>;
    bankDetails: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        accountHolderName: z.ZodString;
        accountNumber: z.ZodString;
        ifscCode: z.ZodString;
        bankName: z.ZodString;
        branchName: z.ZodOptional<z.ZodString>;
        upiId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    }, {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    experience?: number | undefined;
    expertise?: string[] | undefined;
    bio?: string | undefined;
    linkedinUrl?: string | undefined;
    currentCompany?: string | undefined;
    currentPosition?: string | undefined;
    availability?: {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }[] | undefined;
    interviewTypes?: ("technical" | "behavioral" | "system_design" | "hr" | "coding" | "general")[] | undefined;
    languages?: string[] | undefined;
    hourlyRate?: number | undefined;
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    } | undefined;
}, {
    experience?: number | undefined;
    expertise?: string[] | undefined;
    bio?: string | undefined;
    linkedinUrl?: string | undefined;
    currentCompany?: string | undefined;
    currentPosition?: string | undefined;
    availability?: {
        dayOfWeek: number;
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }[] | undefined;
    interviewTypes?: ("technical" | "behavioral" | "system_design" | "hr" | "coding" | "general")[] | undefined;
    languages?: string[] | undefined;
    hourlyRate?: number | undefined;
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
        branchName?: string | undefined;
        upiId?: string | undefined;
    } | undefined;
}>;
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    responsibilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skills: z.ZodArray<z.ZodString, "many">;
    experienceLevel: z.ZodNativeEnum<typeof ExperienceLevel>;
    employmentType: z.ZodNativeEnum<typeof EmploymentType>;
    salary: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
        isNegotiable: z.ZodDefault<z.ZodBoolean>;
        showOnListing: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        isNegotiable: boolean;
        showOnListing: boolean;
        max?: number | undefined;
        min?: number | undefined;
    }, {
        max?: number | undefined;
        min?: number | undefined;
        currency?: string | undefined;
        isNegotiable?: boolean | undefined;
        showOnListing?: boolean | undefined;
    }>>;
    location: z.ZodObject<{
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodString;
        isRemote: z.ZodDefault<z.ZodBoolean>;
        isHybrid: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        city: string;
        country: string;
        isRemote: boolean;
        isHybrid: boolean;
        state?: string | undefined;
    }, {
        city: string;
        country: string;
        state?: string | undefined;
        isRemote?: boolean | undefined;
        isHybrid?: boolean | undefined;
    }>;
    benefits: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    applicationDeadline: z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    location: {
        city: string;
        country: string;
        isRemote: boolean;
        isHybrid: boolean;
        state?: string | undefined;
    };
    skills: string[];
    title: string;
    employmentType: EmploymentType;
    experienceLevel: ExperienceLevel;
    requirements?: string[] | undefined;
    responsibilities?: string[] | undefined;
    salary?: {
        currency: string;
        isNegotiable: boolean;
        showOnListing: boolean;
        max?: number | undefined;
        min?: number | undefined;
    } | undefined;
    benefits?: string[] | undefined;
    applicationDeadline?: Date | undefined;
}, {
    description: string;
    location: {
        city: string;
        country: string;
        state?: string | undefined;
        isRemote?: boolean | undefined;
        isHybrid?: boolean | undefined;
    };
    skills: string[];
    title: string;
    employmentType: EmploymentType;
    experienceLevel: ExperienceLevel;
    requirements?: string[] | undefined;
    responsibilities?: string[] | undefined;
    salary?: {
        max?: number | undefined;
        min?: number | undefined;
        currency?: string | undefined;
        isNegotiable?: boolean | undefined;
        showOnListing?: boolean | undefined;
    } | undefined;
    benefits?: string[] | undefined;
    applicationDeadline?: string | undefined;
}>;
export declare const updateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    responsibilities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
    employmentType: z.ZodOptional<z.ZodNativeEnum<typeof EmploymentType>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
        isNegotiable: z.ZodDefault<z.ZodBoolean>;
        showOnListing: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        isNegotiable: boolean;
        showOnListing: boolean;
        max?: number | undefined;
        min?: number | undefined;
    }, {
        max?: number | undefined;
        min?: number | undefined;
        currency?: string | undefined;
        isNegotiable?: boolean | undefined;
        showOnListing?: boolean | undefined;
    }>>>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        country: z.ZodString;
        isRemote: z.ZodDefault<z.ZodBoolean>;
        isHybrid: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        city: string;
        country: string;
        isRemote: boolean;
        isHybrid: boolean;
        state?: string | undefined;
    }, {
        city: string;
        country: string;
        state?: string | undefined;
        isRemote?: boolean | undefined;
        isHybrid?: boolean | undefined;
    }>>;
    benefits: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    applicationDeadline: z.ZodOptional<z.ZodOptional<z.ZodEffects<z.ZodString, Date, string>>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    location?: {
        city: string;
        country: string;
        isRemote: boolean;
        isHybrid: boolean;
        state?: string | undefined;
    } | undefined;
    skills?: string[] | undefined;
    title?: string | undefined;
    employmentType?: EmploymentType | undefined;
    requirements?: string[] | undefined;
    responsibilities?: string[] | undefined;
    experienceLevel?: ExperienceLevel | undefined;
    salary?: {
        currency: string;
        isNegotiable: boolean;
        showOnListing: boolean;
        max?: number | undefined;
        min?: number | undefined;
    } | undefined;
    benefits?: string[] | undefined;
    applicationDeadline?: Date | undefined;
}, {
    description?: string | undefined;
    location?: {
        city: string;
        country: string;
        state?: string | undefined;
        isRemote?: boolean | undefined;
        isHybrid?: boolean | undefined;
    } | undefined;
    skills?: string[] | undefined;
    title?: string | undefined;
    employmentType?: EmploymentType | undefined;
    requirements?: string[] | undefined;
    responsibilities?: string[] | undefined;
    experienceLevel?: ExperienceLevel | undefined;
    salary?: {
        max?: number | undefined;
        min?: number | undefined;
        currency?: string | undefined;
        isNegotiable?: boolean | undefined;
        showOnListing?: boolean | undefined;
    } | undefined;
    benefits?: string[] | undefined;
    applicationDeadline?: string | undefined;
}>;
export declare const createApplicationSchema: z.ZodObject<{
    coverLetter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    coverLetter?: string | undefined;
}, {
    coverLetter?: string | undefined;
}>;
export declare const updateApplicationStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["reviewing", "shortlisted", "interview", "offered", "rejected"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "reviewing" | "shortlisted" | "interview" | "offered" | "rejected";
    notes?: string | undefined;
}, {
    status: "reviewing" | "shortlisted" | "interview" | "offered" | "rejected";
    notes?: string | undefined;
}>;
export declare const scheduleInterviewSchema: z.ZodObject<{
    interviewerId: z.ZodString;
    scheduledAt: z.ZodEffects<z.ZodString, Date, string>;
    duration: z.ZodDefault<z.ZodNumber>;
    topic: z.ZodOptional<z.ZodString>;
    paymentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    interviewerId: string;
    scheduledAt: Date;
    duration: number;
    topic?: string | undefined;
    paymentId?: string | undefined;
}, {
    interviewerId: string;
    scheduledAt: string;
    duration?: number | undefined;
    topic?: string | undefined;
    paymentId?: string | undefined;
}>;
export declare const interviewFeedbackSchema: z.ZodObject<{
    rating: z.ZodNumber;
    technicalSkills: z.ZodNumber;
    communication: z.ZodNumber;
    problemSolving: z.ZodNumber;
    overallPerformance: z.ZodNumber;
    strengths: z.ZodArray<z.ZodString, "many">;
    areasOfImprovement: z.ZodArray<z.ZodString, "many">;
    detailedFeedback: z.ZodString;
    isPublic: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    technicalSkills: number;
    communication: number;
    problemSolving: number;
    overallPerformance: number;
    strengths: string[];
    areasOfImprovement: string[];
    detailedFeedback: string;
    isPublic: boolean;
}, {
    rating: number;
    technicalSkills: number;
    communication: number;
    problemSolving: number;
    overallPerformance: number;
    strengths: string[];
    areasOfImprovement: string[];
    detailedFeedback: string;
    isPublic?: boolean | undefined;
}>;
export declare const createPaymentOrderSchema: z.ZodObject<{
    interviewId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
    interviewId?: string | undefined;
}, {
    amount: number;
    interviewId?: string | undefined;
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    razorpay_order_id: z.ZodString;
    razorpay_payment_id: z.ZodString;
    razorpay_signature: z.ZodString;
}, "strip", z.ZodTypeAny, {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}, {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}>;
export declare const jobSearchSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
    skills: z.ZodOptional<z.ZodEffects<z.ZodString, string[], string>>;
    experienceLevel: z.ZodOptional<z.ZodString>;
    employmentType: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    isRemote: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    salaryMin: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    salaryMax: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    order: "asc" | "desc";
    sort?: string | undefined;
    search?: string | undefined;
    location?: string | undefined;
    skills?: string[] | undefined;
    employmentType?: string | undefined;
    experienceLevel?: string | undefined;
    isRemote?: boolean | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
}, {
    limit?: string | undefined;
    sort?: string | undefined;
    search?: string | undefined;
    location?: string | undefined;
    skills?: string | undefined;
    employmentType?: string | undefined;
    experienceLevel?: string | undefined;
    isRemote?: string | undefined;
    page?: string | undefined;
    order?: "asc" | "desc" | undefined;
    salaryMin?: string | undefined;
    salaryMax?: string | undefined;
}>;
export declare const candidateSearchSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    sort: z.ZodOptional<z.ZodString>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    search: z.ZodOptional<z.ZodString>;
    skills: z.ZodOptional<z.ZodEffects<z.ZodString, string[], string>>;
    experienceMin: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    experienceMax: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    location: z.ZodOptional<z.ZodString>;
    interviewRating: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    hasCertifications: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
    isActivelyLooking: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    order: "asc" | "desc";
    sort?: string | undefined;
    search?: string | undefined;
    location?: string | undefined;
    skills?: string[] | undefined;
    isActivelyLooking?: boolean | undefined;
    experienceMin?: number | undefined;
    experienceMax?: number | undefined;
    interviewRating?: number | undefined;
    hasCertifications?: boolean | undefined;
}, {
    limit?: string | undefined;
    sort?: string | undefined;
    search?: string | undefined;
    location?: string | undefined;
    skills?: string | undefined;
    isActivelyLooking?: string | undefined;
    page?: string | undefined;
    order?: "asc" | "desc" | undefined;
    experienceMin?: string | undefined;
    experienceMax?: string | undefined;
    interviewRating?: string | undefined;
    hasCertifications?: string | undefined;
}>;
export declare const approveInterviewerSchema: z.ZodObject<{
    isApproved: z.ZodBoolean;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    isApproved: boolean;
    rejectionReason?: string | undefined;
}, {
    isApproved: boolean;
    rejectionReason?: string | undefined;
}>;
export declare const updateUserStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["active", "inactive", "suspended"]>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "inactive" | "suspended";
}, {
    status: "active" | "inactive" | "suspended";
}>;
export declare const createWithdrawalSchema: z.ZodObject<{
    amount: z.ZodNumber;
    method: z.ZodEnum<["bank_transfer", "upi"]>;
    bankDetails: z.ZodOptional<z.ZodObject<{
        accountHolderName: z.ZodString;
        accountNumber: z.ZodString;
        ifscCode: z.ZodString;
        bankName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    }, {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    }>>;
    upiId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    method: "bank_transfer" | "upi";
    amount: number;
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    } | undefined;
    upiId?: string | undefined;
}, {
    method: "bank_transfer" | "upi";
    amount: number;
    bankDetails?: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    } | undefined;
    upiId?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map