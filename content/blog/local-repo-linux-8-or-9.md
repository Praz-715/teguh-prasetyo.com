---
title: "Konfigurasi Local Repository pada Linux 8 atau 9 (RHEL8/9, Centos8/9, OL8/9)"
description: "Langkah mudah konfigurasi Local Repository pada Linux 8 atau 9"
date: "2025-07-14"
cover: "/images/blog/local-repo-linux-8-or-9/coverImage-localrepo8-9.jpg"
tags:
  - linux
  - rhel8
  - rhel9
  - dnf
  - repository
author: "Teguh Prasetyo"
draft: false
---

#### Cek optical device

Jika optical drive terdeteksi, maka output yang ditampilkan adalah:

```bash
blkid
/dev/sr0: BLOCK_SIZE="2048" UUID="2024-05-25-09-39-40-00" LABEL="OL-8-10-0-BaseOS-x86_64" TYPE="iso9660" PTUUID="394bad69" PTTYPE="dos"
/dev/sr0: UUID="2025-05-23-17-19-53-00" LABEL="OL-9-6-0-BaseOS-x86_64" TYPE="iso9660" PTUUID="39ff639e" PTTYPE="dos"
```

#### Mounting optical drive

Mounting optical drive diperlukan untuk menyalin paket instalasi dan menggunakannya sebagai local repository

```bash
mount /dev/sr0 /mnt
```

#### Buat direktory untuk local repository

```bash
mkdir -p /opt/localrepo
```

#### Salin file package ke direktory localrepo

```bash
cp -r /mnt/AppStream /opt/localrepo/
cp -r /mnt/BaseOS /opt/localrepo/
```

#### Nonaktifkan subscription-manager (Khusus RHEL)

```bash
vi /etc/yum/pluginconf.d/subscription-manager.conf
cat /etc/yum/pluginconf.d/subscription-manager.conf

[main]enabled=0
# When following option is set to 1, then all repositories defined outside redhat.repo will be disabled# every time subscription-manager plugin is triggered by dnf or yumdisable_system_repos=0
```

#### Ubah konfigurasi yum.conf

```bash
vi /etc/yum.repos.d/local.repo
cat /etc/yum.repos.d/local.repo

[LocalRepository-BaseOS]
name=Local Repository Linux - BaseOS
baseurl=file:///opt/localrepo8/BaseOS
gpgcheck=0
enabled=1
[LocalRepository-AppStream]
name=Local Repository Linux - AppStream
baseurl=file:///opt/localrepo8/AppStream
gpgcheck=0
enabled=1
```

#### Cek repository

```bash
yum clean all
yum repolist
```

#### Tambahkan EPEL Repository

```bash
# EPEL 8
yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm

# EPEL 9
yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm
```

