# Asset inventory - OnionCare

## Status

The original Android resource project is available locally at
`C:\Users\Crisjan\Documents\repositories\onion-care`. It contains 316 PNG files, 10 WebP files and
5 MP4 tutorial/loading assets. This manifest inventories the Android resources; it does not claim
that every resource was originally licensed for web reuse or that every disease image has a
verified plant-disease association.

## Disease resources found in Android drawables

| Legacy disease key | Existing resource names | Intended use | Verification |
|---|---|---|---|
| Anthracnose caused by bacteria | `anthracnose_bacteria_res_img.png`, `checkup_bacteria.png` | Disease reference / checkup card | Needs review |
| Anthracnose caused by fungi | `anthracnose_fungi_res_img.png`, `checkup_fungi.png` | Disease reference / checkup card | Needs review |
| Bacterial Soft Rot | `bacterial_soft_rot_res_img.png`, `bacterial_soft_rot.png`, `checkup_soft.png` | Disease reference / checkup card | Needs review |
| Basal Plate Rot | `basal_res_img.png`, `basal_soft_rot_res_img.png`, `checkup_plate.png` | Disease reference / checkup card | Needs review |
| Black Mold | `black_mold_res_img.png`, `checkup_black.png` | Disease reference / checkup card | Needs review |
| Neck Rot | `neck_rot_res_img.png`, `checkup_neck.png` | Disease reference / checkup card | Needs review |
| Pink Root | `pink_rot_res_img.png`, `checkup_pink.png` | Disease reference / checkup card | Needs review |
| Purple Blotch | `purple_blotch_res_img.png`, `checkup_purple.png` | Disease reference / checkup card | Needs review |
| Root Knot | `root_knot_res_img.png`, `checkup_root.png` | Disease reference / checkup card | Needs review |
| Seedling Damping Off | `seedling_damping_off_res_img.png`, `checkup_seedling.png` | Disease reference / checkup card | Needs review |
| White Rot | `white_rot_res_img.png`, `checkup_white.png` | Disease reference / checkup card | Needs review |

Before any of these resources is displayed as disease evidence, the image must be previewed,
identified, linked to the exact legacy disease key, checked for source/licence metadata and set to
`verificationStatus = verified`. Until then, the website must display the neutral disease
placeholder.

## General and interface resources

The original app contains onion-farming, crop-care, logo, navigation, tutorial and decorative
assets, including:

- Landing/branding: `logo.png`, `new_logo.png`, `new_logo1.png`, `mini_logo.png`
- General farm guidance: cropping, irrigation, land preparation, hardening, harvesting and
  stewardship background resources
- Navigation/interface: `home.png`, `history.png`, `message_icon.png`, `notification.png`,
  `menu_icon.png`, `logout.png`, `help.png`
- Tutorial media: `tutorial_video.mp4`, `tutorial_video2.mp4`, `sample.mp4`, loading videos

These resources are not automatically safe for web reuse. Usage/licence records must be recovered
or approved before publication.

## Existing website assets

No live Firebase Storage inventory is available. The former external `media.db.com` URLs were
removed from the website runtime; missing or blocked assets use neutral fallbacks until approved
images are available.

## Required next actions

1. Inventory file dimensions, file types, sizes and checksums for the Android resources.
2. Preview and classify each disease, general, logo, tutorial and decorative resource.
3. Confirm source/licence and safe web redistribution terms.
4. Upload approved files to stable Firebase Storage paths.
5. Write matching `mediaAssets` metadata and set verification status explicitly.
6. Do not mark any Android image as a verified disease photograph without human review.
