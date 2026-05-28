---
title: Bank Sahabat Sampoerna
subtitle: Upgrading Oracle from 11g to 19c without breaking the bank
description: End-to-end Oracle 11g → 19c upgrade for a production banking environment, with schema validation, tuning, and rollback safety.
client: Bank Sahabat Sampoerna
role: Database Administrator
year: "2023"
tech:
  - Oracle 11g
  - Oracle 19c
  - Data Pump
  - Performance Tuning
category: database
order: 4
featured: true
---

## Overview

Running production banking workloads on Oracle 11g had become a compliance and support risk. BSS needed to move to 19c while keeping the upgrade window narrow and the rollback path open.

## Approach

**Pre-upgrade**
- Captured a full backup of the 11g database and verified its integrity end-to-end.
- Prepared the target Oracle 19c environment — installation, configuration, parameter sizing.

**Migration**
- Used Data Pump (export/import) to move data from 11g to 19c.
- Validated schema and object compatibility between versions before and after import.
- Tested every dependent service against the 19c target before declaring success.

**Post-upgrade**
- Tuned the 19c instance: memory targets, optimizer parameters, redo sizing.
- Documented the upgrade procedure and tuning decisions for repeatability.

## Outcome

19c took over within the planned window. The post-upgrade tuning pass cut query latency on the heavy reporting workloads, and the documentation has since been reused for similar customer engagements.
