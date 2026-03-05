import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    companyName : ?Text;
  };

  public type Site = {
    id : Text;
    name : Text;
    clientName : Text;
    location : Text;
    totalContractValue : Nat;
    startDate : Text;
    user : Principal;
  };

  public type DailyLog = {
    id : Text;
    siteId : Text;
    date : Text;
    labourCount : Nat;
    workDone : Text;
    materialExpense : Nat;
    photoBlobIds : [Text];
  };

  public type PaymentEntry = {
    id : Text;
    siteId : Text;
    amountReceived : Nat;
    date : Text;
    notes : Text;
  };

  public type Document = {
    id : Text;
    siteId : Text;
    name : Text;
    blobId : Text;
    uploadedDate : Text;
  };

  public type SiteAggregate = {
    totalReceived : Nat;
    totalExpense : Nat;
    profitLoss : Int;
    pendingAmount : Nat;
  };

  module Site {
    public func compare(site1 : Site, site2 : Site) : Order.Order {
      Text.compare(site1.id, site2.id);
    };
  };

  module DailyLog {
    public func compare(log1 : DailyLog, log2 : DailyLog) : Order.Order {
      Text.compare(log1.id, log2.id);
    };
  };

  module PaymentEntry {
    public func compare(entry1 : PaymentEntry, entry2 : PaymentEntry) : Order.Order {
      Text.compare(entry1.id, entry2.id);
    };
  };

  module Document {
    public func compare(doc1 : Document, doc2 : Document) : Order.Order {
      Text.compare(doc1.id, doc2.id);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let sites = Map.empty<Text, Site>();
  let dailyLogs = Map.empty<Text, DailyLog>();
  let paymentEntries = Map.empty<Text, PaymentEntry>();
  let documents = Map.empty<Text, Document>();

  func verifySiteOwnership(caller : Principal, siteId : Text) : Site {
    switch (sites.get(siteId)) {
      case (null) { Runtime.trap("Site does not exist") };
      case (?site) {
        if (site.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only access your own sites");
        };
        site;
      };
    };
  };

  // Profile management
  public shared ({ caller }) func saveUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profile info");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Site management
  public shared ({ caller }) func createSite(id : Text, site : Site) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sites");
    };
    if (site.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You can only create sites for yourself");
    };
    sites.add(id, site);
  };

  public shared ({ caller }) func updateSite(id : Text, site : Site) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sites");
    };
    let _ = verifySiteOwnership(caller, id);
    if (site.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: You cannot change site ownership");
    };
    sites.add(id, site);
  };

  public shared ({ caller }) func deleteSite(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sites");
    };
    let _ = verifySiteOwnership(caller, id);
    sites.remove(id);
  };

  public query ({ caller }) func getSite(id : Text) : async Site {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sites");
    };
    verifySiteOwnership(caller, id);
  };

  public query ({ caller }) func getAllSites() : async [Site] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sites");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      sites.values().toArray().sort();
    } else {
      sites.values().toArray().filter(
        func(site) { site.user == caller }
      ).sort();
    };
  };

  // Daily Log management
  public shared ({ caller }) func addDailyLog(id : Text, log : DailyLog) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add daily logs");
    };
    let _ = verifySiteOwnership(caller, log.siteId);
    dailyLogs.add(id, log);
  };

  public shared ({ caller }) func updateDailyLog(id : Text, log : DailyLog) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update daily logs");
    };
    switch (dailyLogs.get(id)) {
      case (null) { Runtime.trap("Daily log does not exist") };
      case (?existingLog) {
        let _ = verifySiteOwnership(caller, existingLog.siteId);
        if (log.siteId != existingLog.siteId) {
          Runtime.trap("Unauthorized: Cannot change daily log site association");
        };
        dailyLogs.add(id, log);
      };
    };
  };

  public shared ({ caller }) func deleteDailyLog(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete daily logs");
    };
    switch (dailyLogs.get(id)) {
      case (null) { Runtime.trap("Daily log does not exist") };
      case (?log) {
        let _ = verifySiteOwnership(caller, log.siteId);
        dailyLogs.remove(id);
      };
    };
  };

  public query ({ caller }) func getDailyLog(id : Text) : async DailyLog {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily logs");
    };
    switch (dailyLogs.get(id)) {
      case (null) { Runtime.trap("Daily log does not exist") };
      case (?log) {
        let _ = verifySiteOwnership(caller, log.siteId);
        log;
      };
    };
  };

  public query ({ caller }) func getDailyLogsForSite(siteId : Text) : async [DailyLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily logs");
    };
    let _ = verifySiteOwnership(caller, siteId);
    let logs = List.empty<DailyLog>();
    dailyLogs.values().forEach(
      func(log) {
        if (log.siteId == siteId) {
          logs.add(log);
        };
      }
    );
    logs.toArray().sort();
  };

  // Payment Entries management
  public shared ({ caller }) func addPaymentEntry(id : Text, entry : PaymentEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payment entries");
    };
    let _ = verifySiteOwnership(caller, entry.siteId);
    paymentEntries.add(id, entry);
  };

  public shared ({ caller }) func updatePaymentEntry(id : Text, entry : PaymentEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update payment entries");
    };
    switch (paymentEntries.get(id)) {
      case (null) { Runtime.trap("Payment entry does not exist") };
      case (?existingEntry) {
        let _ = verifySiteOwnership(caller, existingEntry.siteId);
        if (entry.siteId != existingEntry.siteId) {
          Runtime.trap("Unauthorized: Cannot change payment entry site association");
        };
        paymentEntries.add(id, entry);
      };
    };
  };

  public shared ({ caller }) func deletePaymentEntry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete payment entries");
    };
    switch (paymentEntries.get(id)) {
      case (null) { Runtime.trap("Payment entry does not exist") };
      case (?entry) {
        let _ = verifySiteOwnership(caller, entry.siteId);
        paymentEntries.remove(id);
      };
    };
  };

  public query ({ caller }) func getPaymentEntry(id : Text) : async PaymentEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access payment entries");
    };
    switch (paymentEntries.get(id)) {
      case (null) { Runtime.trap("Payment entry does not exist") };
      case (?entry) {
        let _ = verifySiteOwnership(caller, entry.siteId);
        entry;
      };
    };
  };

  public query ({ caller }) func getPaymentEntriesForSite(siteId : Text) : async [PaymentEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access payment entries");
    };
    let _ = verifySiteOwnership(caller, siteId);
    let entries = List.empty<PaymentEntry>();
    paymentEntries.values().forEach(
      func(entry) {
        if (entry.siteId == siteId) {
          entries.add(entry);
        };
      }
    );
    entries.toArray().sort();
  };

  // Document management
  public shared ({ caller }) func addDocument(id : Text, doc : Document) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add documents");
    };
    let _ = verifySiteOwnership(caller, doc.siteId);
    documents.add(id, doc);
  };

  public shared ({ caller }) func deleteDocument(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete documents");
    };
    switch (documents.get(id)) {
      case (null) { Runtime.trap("Document does not exist") };
      case (?doc) {
        let _ = verifySiteOwnership(caller, doc.siteId);
        documents.remove(id);
      };
    };
  };

  public query ({ caller }) func getDocument(id : Text) : async Document {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access documents");
    };
    switch (documents.get(id)) {
      case (null) { Runtime.trap("Document does not exist") };
      case (?doc) {
        let _ = verifySiteOwnership(caller, doc.siteId);
        doc;
      };
    };
  };

  public query ({ caller }) func getDocumentsForSite(siteId : Text) : async [Document] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access documents");
    };
    let _ = verifySiteOwnership(caller, siteId);
    let docs = List.empty<Document>();
    documents.values().forEach(
      func(doc) {
        if (doc.siteId == siteId) {
          docs.add(doc);
        };
      }
    );
    docs.toArray().sort();
  };

  // Aggregates
  func computeAggregates(siteId : Text) : SiteAggregate {
    let site = switch (sites.get(siteId)) {
      case (null) { Runtime.trap("Site does not exist") };
      case (?s) { s };
    };

    let totalReceived = paymentEntries.values().toArray().filter(
      func(entry) { entry.siteId == siteId }
    ).foldLeft(
      0,
      func(acc, entry) { acc + entry.amountReceived },
    );

    let totalExpense = dailyLogs.values().toArray().filter(
      func(log) { log.siteId == siteId }
    ).foldLeft(
      0,
      func(acc, log) { acc + log.materialExpense },
    );

    let profitLoss = site.totalContractValue.toInt() - totalExpense.toInt();
    let pendingAmount = site.totalContractValue - totalReceived;

    {
      totalReceived;
      totalExpense;
      profitLoss;
      pendingAmount;
    };
  };

  public query ({ caller }) func getSiteAggregates(siteId : Text) : async SiteAggregate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access site aggregates");
    };
    let _ = verifySiteOwnership(caller, siteId);
    computeAggregates(siteId);
  };
};
