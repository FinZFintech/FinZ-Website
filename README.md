# FinZ Fintech &mdash; Website

Static marketing and compliance website for **FinZ Fintech Private Limited**, built with mandatory disclosures for an RBI-regulated NBFC / digital-lending entity.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Homepage with hero, features, and regulatory snapshot |
| `about.html` | Company overview, mission, governance |
| `products.html` | Product catalogue with regulatory attribution |
| `compliance.html` | Consolidated regulatory disclosures |
| `fair-practices.html` | Board-approved Fair Practices Code (RBI NBFC FPC) |
| `interest-rate-policy.html` | Board-approved Interest Rate Policy |
| `kfs.html` | Sample Key Fact Statement per the RBI Digital Lending Guidelines |
| `grievance.html` | Three-tier Grievance Redressal mechanism |
| `ombudsman.html` | RBI Integrated Ombudsman Scheme, 2021 information |
| `privacy.html` | Privacy Policy aligned with DPDP Act, 2023 and RBI data-localisation rules |
| `terms.html` | Terms of Use |
| `cookie-policy.html` | Cookie Policy |
| `assets/css/style.css` | Styling |
| `assets/js/main.js` | Navigation toggle and active-link highlighting |
| `robots.txt` | Crawler rules |

## RBI and allied regulations referenced

- RBI Master Direction &mdash; NBFC Scale Based Regulation, 2023
- RBI Master Direction on Digital Lending, 2025
- RBI Master Direction on KYC, 2016 (as amended)
- RBI Fair Practices Code for NBFCs
- RBI Integrated Ombudsman Scheme, 2021
- RBI Cyber Security Framework and IT Governance Directions, 2023
- Circular on Storage of Payment System Data (data localisation)
- Circular on Penal Charges in Loan Accounts, 2023
- Payment &amp; Settlement Systems Act, 2007
- Digital Personal Data Protection Act, 2023
- CERT-In Directions, 2022
- SEBI (Mutual Funds) Regulations, 1996 (for the Invest product)

## Running locally

This is a plain static site. Open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Before going live

Replace illustrative values (CIN, NBFC CoR, GSTIN, officer names and addresses) with the entity's actual particulars approved by the Compliance function, and obtain sign-off from the Nodal Officer, DPO, and Company Secretary.
