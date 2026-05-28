---
title: BRI — Anti Money Laundry
subtitle: Hive + Spark ETL pipelines for AML data integration
description: Built automated ETL pipelines that move raw data through Hive staging into AML-ready target tables, with monitoring and documentation.
client: Bank Rakyat Indonesia
role: Data Engineer
year: "2023–2024"
tech:
  - Hive
  - Apache Spark
  - Python
  - ETL
  - AML
category: data
order: 6
featured: false
---

## Overview

BRI's Anti Money Laundry program required reliable data pipelines that could pull from many source systems, stage and reconcile, then deliver clean data to AML detection workloads. The pipelines needed to be repeatable, observable, and aligned with the regulatory data model.

## Approach

**Data modeling**
- Designed staging tables in Hive to hold raw source data prior to processing.

**Pipelines**
- Wrote Python scripts using Spark to integrate and transform data inside Hive.
- Built automated ETL pipelines moving data from staging into AML target tables.
- Tested and debugged each pipeline path end-to-end.

**Performance & observability**
- Tuned Spark configurations and ETL stages for production throughput.
- Implemented logging and monitoring around ETL activity so issues surfaced fast.

**Collaboration**
- Worked alongside the AML team and stakeholders to make sure data semantics matched regulatory requirements.
- Produced technical documentation covering processes, architecture, and configuration.

## Outcome

Repeatable, monitored pipelines that AML analysts could trust — and that operations could troubleshoot without paging the original author.
