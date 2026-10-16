# Loan Dashboard

The Angular app opens the screenshot-inspired DMI Finance lead dashboard at [http://localhost:4200](http://localhost:4200).

## Start

```bash
npm start
```

Lead records are loaded from `public/lead-data.json` through `src/app/service/lead.service.ts`; Angular serves that file as `/lead-data.json`. The original loan application data and service files are kept separately and unchanged.

The lead list includes the screenshot fields (Lead Name, Lead ID, Lead Creation Date, Status), screenshot-matched workflow cards, search, status filtering, date sorting, CSV export, pagination, and explicit loading, empty, error, and retry states. Workflow card counts are static sample dashboard metrics from the reference; the table rows are loaded independently from the nine records in `public/lead-data.json`.

## Validate

```bash
npm run build
npm test
```
