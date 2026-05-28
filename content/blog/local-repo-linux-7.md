---
title: "Konfigurasi Local Repository pada Linux 7 (RHEL7, Centos7, OL7)"
description: "Langkah mudah konfigurasi Local Repository pada Linux 7"
date: "2025-07-14"
cover: "/images/blog/local-repo-linux-7/coverImage-localrepo7.jpg"
tags:
  - linux
  - rhel7
  - yum
  - repository
author: "Teguh Prasetyo"
draft: false
---

#### Cek optical device

Jika optical drive terdeteksi, maka output yang ditampilkan adalah:

```bash
blkid
/dev/sr0: UUID="2021-05-28-10-00-48-00" LABEL="OL-7.9 Server.x86_64" TYPE="iso9660" PTTYPE="dos"
```

#### Mounting optical drive

Mounting optical drive diperlukan untuk menyalin paket instalasi dan menggunakannya sebagai local repository

```bash
mount /dev/sr0 /mnt
```

#### Buat direktory untuk local repository

```bash
mkdir -p /opt/localrepo7
```

#### Salin file package ke direktory localrepo7

```bash
cp -pr /mnt/Packages/* /opt/localrepo7/
```

#### Cek hasil salinan file

```bash
cd /opt/localrepo7/
ls | grep deltarpm && ls | grep createrepo
```

#### Install beberapa package yang dibutuhkan untuk create repo

```bash
rpm -ivh deltarpm-3.6-3.el7.x86_64.rpm
rpm -ivh python-deltarpm-3.6-3.el7.x86_64.rpm
rpm -ivh createrepo-0.9.9-28.el7.noarch.rpm
```

#### Backup repository bawaan yang sudah tidak support untuk linux 7

```bash
mv /etc/yum.repos.d/ /etc/yum.repos.d.ori
```

#### Buat direktory baru

```bash
mkdir /etc/yum.repos.d
```

#### Buat repository

```bash
createrepo '/opt/localrepo7/'
```

#### Ubah konfigurasi yum.conf

```bash
vi /etc/yum.conf

# Tambahkan
[base-local]
name=localrepo $releasever - $basearch
failovermethod=priority
baseurl=file:///opt/localrepo7
enabled=1
gpgcheck=0
```

#### Cek repository

```bash
yum clean all
yum repolist
```

