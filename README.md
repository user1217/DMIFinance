# DMI Finance Loan Dashboard

The Angular app includes a loan application dashboard at [http://localhost:4200/](http://localhost:4200/).

## Start the frontend and mock API

In separate terminals, run:

```bash
npm run mock:api
```

This starts JSON Server on port 3000 and serves the 15 sample applications in `db.json` at `http://localhost:3000/applications`.

```bash
npm start
```

The Angular dashboard uses the same endpoint through `LoanApplicationService`.

## Dashboard behavior

- Status and loan-type filters and amount/date sorting run in the browser against the loaded applications.
- Summary values always use the full loaded dataset, regardless of active filters:
  - **Total applications:** number of loaded application records.
  - **Pipeline amount:** sum of amounts with `Pending` or `Under Review` status.
  - **Approval rate:** approved records divided by all loaded records, expressed as a percentage; zero when there are no records.
- Selecting an application opens a side panel with all record fields and a visual credit score gauge.
- Status changes require confirmation and update only the in-memory UI; they are not sent to JSON Server.

The existing lead dashboard remains available separately at `/loan-dashboard-2`.

## Validate

```bash
npm run build
npm test
```
