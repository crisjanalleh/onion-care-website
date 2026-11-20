const db = globalThis.__APP_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth-middleware";
import { assertAdmin, requireProfile, resolveAdminForLocation } from "./shared";

export const farmerDashboard = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const database = context.getDatabase();
    const profile = await requireProfile(context);

    const [diagnoses, reports, conversations, articles, assignment] = await Promise.all([
      db.asServiceRole.entities.DiagnosisRecord.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 3 }),
      db.asServiceRole.entities.DiseaseReport.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 3 }),
      db.asServiceRole.entities.Conversation.filter({ farmerUid: profile.uid }),
      db.asServiceRole.entities.ContentArticle.filter({ status: "published" }, { sort: "-lastReviewedAt", limit: 4 }),
      resolveAdminForLocation(database, profile.location),
    ]);

    const reportList = reports.items ?? reports;
    const openReports = reportList.filter((r) => ["new", "viewed", "in_progress", "reopened"].includes(r.status)).length;
    const conversation = conversations[0] ?? null;

    return {
      profile,
      recentDiagnoses: diagnoses.items ?? diagnoses,
      recentReports: reportList,
      openReports,
      conversation,
      unreadMessages: conversation?.unreadCountForFarmer ?? 0,
      recentArticles: articles.items ?? articles,
      assignment,
    };
  });

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertAdmin(context.user);
    const database = context.getDatabase();

    const [
      farmerCount,
      newReports,
      conversations,
      pendingArticles,
      pendingDiseases,
      pendingRecommendations,
      recentFarmers,
      recentReports,
      byDisease,
      recentAudit,
    ] = await Promise.all([
      db.entities.FarmerProfile.count({ role: "farmer" }),
      db.entities.DiseaseReport.count({ status: "new" }),
      db.entities.Conversation.filter({}, { sort: "-lastMessageAt", limit: 100 }),
      db.entities.ContentArticle.count({ status: "pending_review" }),
      db.entities.Disease.count({ contentStatus: "pending_review" }),
      db.entities.TreatmentRecommendation.count({ approvalStatus: "pending_review" }),
      db.asServiceRole.entities.FarmerProfile.filter({ role: "farmer" }, { sort: "-created_date", limit: 5 }),
      db.entities.DiseaseReport.filter({}, { sort: "-created_date", limit: 5 }),
      db.entities.DiseaseReport.aggregate({ query: {}, groupBy: "diseaseName" }),
      db.entities.AuditLog.filter({}, { sort: "-created_date", limit: 6 }),
    ]);

    const threadList = conversations.items ?? conversations;
    const unreadForMe = threadList
      .filter((c) => c.adminUid === context.user.id)
      .reduce((sum, c) => sum + (c.unreadCountForAdmin ?? 0), 0);

    return {
      farmerCount,
      newReports,
      openConversations: threadList.filter((c) => c.status === "open").length,
      unreadForMe,
      pendingContent: pendingArticles + pendingDiseases + pendingRecommendations,
      pendingBreakdown: {
        articles: pendingArticles,
        diseases: pendingDiseases,
        recommendations: pendingRecommendations,
      },
      recentFarmers: recentFarmers.items ?? recentFarmers,
      recentReports: recentReports.items ?? recentReports,
      reportsByDisease: (byDisease.rows ?? []).sort((a, b) => b.count - a.count),
      recentAudit: recentAudit.items ?? recentAudit,
    };
  });

export const myNotifications = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const database = context.getDatabase();
    const page = await db.entities.Notification.filter(
      { recipientUid: context.user.id },
      { sort: "-created_date", limit: 50 },
    );
    return page.items ?? page;
  });