---
title: Jakarta Smart City
subtitle: Implementing and Maintaining Oracle Database Solutions
description: Designed and operated an Oracle RAC 2-node cluster and staging database for Jakarta's Master Data Management initiative.
client: Jakarta Smart City
role: Database Administrator
year: "2022–2024"
tech:
  - Oracle
  - Oracle RAC
  - MDM
  - VM
  - Linux
category: database
order: 1
featured: true
---

## Overview

Jakarta Smart City runs a centralized Master Data Management (MDM) platform that ingests and reconciles data from dozens of agencies across the city government. The system needed a database backbone that could survive a node failure without downtime and act as a reliable staging ground for the MDM data integration flow.

## Approach

- Implemented **Oracle Real Application Cluster (RAC) 2-node** on VM infrastructure for high availability.
- Stood up a **staging database** as the entry point for MDM integration — designed schemas, ingestion patterns, and reconciliation rules.
- Built and rehearsed **backup and recovery procedures** to guarantee data restoration within the agreed RTO/RPO.
- Conducted **regular tuning** (memory, I/O, SQL plans) to prevent ingest-time bottlenecks.
- Established **log-based anomaly monitoring** to surface issues before they became incidents.
- Scheduled regular **patching and security updates** without disrupting MDM consumers.

## Outcome

A production-grade Oracle RAC environment that kept Jakarta's MDM platform available throughout multi-year operation, with documented runbooks the operations team could execute independently.
