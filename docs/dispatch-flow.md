# Tsela Assist dispatch flow

The agreed flow from a breakdown to a paid invoice. Roles: driver, fleet manager, mechanic, owner.

1. **Driver reports.** The driver describes the problem, adds photos and pins the location.
2. **Manager sees it.** Only the fleet manager sees the report. The driver does not see any mechanic yet.
3. **Manager picks the closest mechanic.** Mechanics are ranked by distance from the driver's pin. The manager chooses; the driver never does.
4. **Mechanic is notified** and accepts or declines the call-out.
5. **Everyone sees the mechanic.** After acceptance the manager and the driver see the mechanic. The driver also sees the progress checklist (accepted, on the way, arrived, done).
6. **Mechanic does the job.** On arrival they take before photos, repair the tyre, take after photos and mark the job done.
7. **Invoice and payment.** The mechanic sends the invoice to the fleet manager, who approves and pays it. Payment is a demo payment for now; no payment provider is connected.
8. **Owner dashboard records everything:** jobs, photos, invoices, payouts and documents.

## Closest mechanic
Each mechanic saves a base location in the app (Profile, Base location). When the manager opens the mechanic list, the app measures the straight-line distance from the driver's pin to each mechanic's base, estimates the drive time (road distance is taken as 1.3 times the straight line at 55 km/h), and lists the nearest first, labelled "Closest". Mechanics who have not set a location are listed last.
