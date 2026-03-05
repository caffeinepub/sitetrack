import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Site {
    id: string;
    totalContractValue: bigint;
    clientName: string;
    name: string;
    user: Principal;
    location: string;
    startDate: string;
}
export interface UserSummary {
    principal: Principal;
    siteCount: bigint;
    profile: UserProfile;
}
export interface PaymentEntry {
    id: string;
    date: string;
    notes: string;
    siteId: string;
    amountReceived: bigint;
}
export interface Document {
    id: string;
    uploadedDate: string;
    name: string;
    blobId: string;
    siteId: string;
}
export interface PlatformStats {
    totalContractValue: bigint;
    totalReceived: bigint;
    totalSites: bigint;
    totalUsers: bigint;
}
export interface DailyLog {
    id: string;
    labourCount: bigint;
    date: string;
    siteId: string;
    photoBlobIds: Array<string>;
    workDone: string;
    materialExpense: bigint;
}
export interface UserProfile {
    name: string;
    companyName?: string;
}
export interface SiteAggregate {
    totalReceived: bigint;
    profitLoss: bigint;
    totalExpense: bigint;
    pendingAmount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDailyLog(id: string, log: DailyLog): Promise<void>;
    addDocument(id: string, doc: Document): Promise<void>;
    addPaymentEntry(id: string, entry: PaymentEntry): Promise<void>;
    adminDeleteSite(siteId: string): Promise<void>;
    adminDeleteUser(user: Principal): Promise<void>;
    adminGetAllUsers(): Promise<Array<UserSummary>>;
    adminGetPlatformStats(): Promise<PlatformStats>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    becomeFirstAdmin(): Promise<boolean>;
    createSite(id: string, site: Site): Promise<void>;
    deleteDailyLog(id: string): Promise<void>;
    deleteDocument(id: string): Promise<void>;
    deletePaymentEntry(id: string): Promise<void>;
    deleteSite(id: string): Promise<void>;
    getAllSites(): Promise<Array<Site>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyLog(id: string): Promise<DailyLog>;
    getDailyLogsForSite(siteId: string): Promise<Array<DailyLog>>;
    getDocument(id: string): Promise<Document>;
    getDocumentsForSite(siteId: string): Promise<Array<Document>>;
    getPaymentEntriesForSite(siteId: string): Promise<Array<PaymentEntry>>;
    getPaymentEntry(id: string): Promise<PaymentEntry>;
    getSite(id: string): Promise<Site>;
    getSiteAggregates(siteId: string): Promise<SiteAggregate>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveUserProfile(profile: UserProfile): Promise<void>;
    updateDailyLog(id: string, log: DailyLog): Promise<void>;
    updatePaymentEntry(id: string, entry: PaymentEntry): Promise<void>;
    updateSite(id: string, site: Site): Promise<void>;
}
