import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/lib/auth-middleware";
import { assertAdmin, requireProfile, resolveAdminForLocation, svc } from "./shared";

export const farmerDashboard = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const database = context.getDatabase();
    const entities = svc(context).entities;
    const profile = await requireProfile(context);

    const [diagnoses, reports, conversations, articles, assignment] = await Promise.all([
      entities.DiagnosisRecord.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 3 }),
      entities.DiseaseReport.filter({ farmerUid: profile.uid }, { sort: "-created_date", limit: 3 }),
      entities.Conversation.filter({ farmerUid: profile.uid }),
      entities.ContentArticle.filter({ status: "published" }, { sort: "-lastReviewedAt", limit: 4 }),
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
    const entities = svc(context).entities;

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
      entities.FarmerProfile.count({ role: "farmer" }),
      entities.DiseaseReport.count({ status: "new" }),
      entities.Conversation.filter({}, { sort: "-lastMessageAt", limit: 100 }),
      entities.ContentArticle.count({ status: "pending_review" }),
      entities.Disease.count({ contentStatus: "pending_review" }),
      entities.TreatmentRecommendation.count({ approvalStatus: "pending_review" }),
      entities.FarmerProfile.filter({ role: "farmer" }, { sort: "-created_date", limit: 5 }),
      entities.DiseaseReport.filter({}, { sort: "-created_date", limit: 5 }),
      entities.DiseaseReport.aggregate({ query: {}, groupBy: "diseaseName" }),
      entities.AuditLog.filter({}, { sort: "-created_date", limit: 6 }),
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
    const page = await svc(context).entities.Notification.filter(
      { recipientUid: context.user.id },
      { sort: "-created_date", limit: 50 },
    );
    return page.items ?? page;
  });