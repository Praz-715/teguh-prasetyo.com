---
title: JNE — Data Center Relocation
subtitle: End-to-end database migration across data centers with mixed endian formats
description: Migrated production Oracle databases from an old data center to a new one using Data Guard for same-endian servers and Data Pump for cross-endian migrations.
client: JNE Express
role: Database Administrator
year: "2024"
tech:
  - Oracle
  - Oracle Data Guard
  - Data Pump
  - Cross-endian
category: database
order: 2
featured: true
---

## Overview

JNE Express needed to relocate production database workloads from a legacy data center to a new facility. Some servers shared the same endian format as the target hardware; others required a cross-endian migration. Either way, downtime had to be kept to a tight cut-off window during low-traffic hours.

## Approach

**Same-endian path — Oracle Data Guard switchover**
- Created Oracle Data Guard (ODG) with the old DC as primary and the new DC as standby.
- Verified that ODG was fully synchronized and gap-free before initiating the switchover.

**Cross-endian path — Data Pump migration**
- For databases moving from big-endian to little-endian platforms, executed migration via Data Pump export/import.
- Handled data lag during the export-import window with scheduled jobs and procedural catch-up.

**Cut-off and validation**
- After confirming zero lag, performed the production cut-off and DB switchover to the new data center.
- Verified connectivity and access from every dependent service.
- Ran stress tests and load tests against the new environment.
- Delivered post-migration documentation and evaluation reports.

## Outcome

Both migration paths completed within their cut-off windows. The new data center took over production traffic without data loss, and performance benchmarks met or exceeded the baseline.
