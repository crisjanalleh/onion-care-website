mediaAssets/
  {assetId}
    storagePath: string
    downloadURL: string | optional
    fileName: string
    contentType: string
    category: string
    altText: string
    caption: string | optional
    source: string | optional
    license: string | optional
    origin: "legacy" | "illustrative" | "external_source" | "admin_upload"
    diseaseKey: string | optional
    verificationStatus: "verified" | "needs_review" | "not_applicable"
    verifiedByUid: string | optional
    verifiedAt: timestamp | optional
    width: number | optional
    height: number | optional
    fileSizeBytes: number | optional
    checksum: string | optional
    isActive: boolean
    createdAt: timestamp
    updatedAt: timestamp