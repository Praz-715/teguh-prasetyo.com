---
title: "Install Oracle Database 19c pada Linux 7 (RHEL7, Centos7, OL7)"
description: "Langkah mudah memahami cara menginstall Oracle Database 19 pada Linux 7 (RHEL7, Centos7, OL7) beserta konfigurasi dasar yang diperlukan."
date: "2025-06-29"
cover: "/images/blog/install-oracle-19c-linux-7/coverImage.jpg"
tags:
  - oracle
  - 19c
  - linux
  - rhel7
  - installation
author: "Teguh Prasetyo"
draft: false
---

Panduan lengkap langkah-langkah instalasi Oracle Database 19c pada sistem operasi Linux versi 7, mencakup Red Hat Enterprise Linux 7, CentOS 7, dan Oracle Linux 7. Artikel ini juga menyertakan praktik terbaik dalam konfigurasi sistem dan database untuk memastikan instalasi berjalan optimal dan siap digunakan di lingkungan produksi.

> Artikel ini tidak membahas proses instalasi sistem operasi. Jika Anda ingin mengetahui cara menginstal sistem operasi Linux, silakan lihat panduannya di sini.

> Download Oracle Database 19c di See: <https://www.oracle.com/id/database/technologies/oracle19c-linux-downloads.html>

#### Konfigurasi Local Repository

Membuat Local Repository bisa lihat di ....

## Konfigurasi Sistem Operasi

### Otomatis konfigurasi dengan preinstall oracle

```bash
# Download preinstall jika ada internet
curl -o  oracle-database-preinstall-19c-1.0-3.el7.x86_64.rpm https://yum.oracle.com/repo/OracleLinux/OL7/latest/x86_64/getPackage/oracle-database-preinstall-19c-1.0-3.el7.x86_64.rpm

# Install 
yum -y install oracle-database-preinstall-19c-1.0-3.el7.x86_64.rpm
```

### Manual konfigurasi

#### Konfigurasi Kernel

```bash
vi /etc/sysctl.conf

# Tambahkan konfigurasi berikut
fs.file-max = 6815744
kernel.sem = 250 32000 100 128
kernel.shmmni = 4096
kernel.shmall = 1073741824
kernel.shmmax = 4398046511104
kernel.panic_on_oops = 1
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576
net.ipv4.conf.all.rp_filter = 2
net.ipv4.conf.default.rp_filter = 2
fs.aio-max-nr = 1048576
net.ipv4.ip_local_port_range = 9000 65500
```

#### Jalankan ini saat ada perubahan pada sysctl.conf

```bash
/sbin/sysctl -p
```

#### Konfigurasi Security Limits

```bash
vi /etc/security/limits.conf

# Tambahkan konfigurasi berikut
oracle   soft   nofile    1024
oracle   hard   nofile    65536
oracle   soft   nproc    16384
oracle   hard   nproc    16384
oracle   soft   stack    10240
oracle   hard   stack    32768
oracle   hard   memlock    134217728
oracle   soft   memlock    134217728
```

#### Install package yang dibutuhkan

```bash
vi install_package.sh

# Tambahkan konfigurasi berikut
yum install -y bc
yum install -y binutils
yum install -y compat-libcap1
yum install -y compat-libstdc++-33
#yum install -y dtrace-modules
#yum install -y dtrace-modules-headers
#yum install -y dtrace-modules-provider-headers
yum install -y dtrace-utils
yum install -y elfutils-libelf
yum install -y elfutils-libelf-devel
yum install -y fontconfig-devel
yum install -y glibc
yum install -y glibc-devel
yum install -y ksh
yum install -y libaio
yum install -y libaio-devel
yum install -y libdtrace-ctf-devel
yum install -y libXrender
yum install -y libXrender-devel
yum install -y libX11
yum install -y libXau
yum install -y libXi
yum install -y libXtst
yum install -y libgcc
yum install -y librdmacm-devel
yum install -y libstdc++
yum install -y libstdc++-devel
yum install -y libxcb
yum install -y make
yum install -y net-tools # Clusterware
yum install -y nfs-utils # ACFS
yum install -y python # ACFS
yum install -y python-configshell # ACFS
yum install -y python-rtslib # ACFS
yum install -y python-six # ACFS
yum install -y targetcli # ACFS
yum install -y smartmontools
yum install -y sysstat

# Added by me.
dnf install -y gcc
yum install -y unixODBC
yum install -y unzip
yum install -y xorg-x11-xauth
yum install -y xterm
yum install -y xorg-x11-utils
```

#### Jalankan Install Package

```bash
# Modifikasi executable script agar bisa dieksekusi
chmod +x install_package.sh
# Jalankan script untuk menginstall package yang dibutuhkan
./install_package.sh
```

#### Buat grup dan user baru

```bash
groupadd -g 54321 oinstall
groupadd -g 54322 dba
groupadd -g 54323 oper
useradd -u 54321 -g oinstall -G dba,oper oracle
passwd oracle
```

#### Konfigurasi SELINUX

```bash
vi /etc/selinux/config

# Ubah konfigurasi berikut
SELINUX=permissive

# Dan Jalankan perintah berikut
setenforce Permissive
```

#### Nonaktifkan Firewall

```bash
systemctl stop firewalld
systemctl disable firewalld
```

#### Tambahkan IP Address dan Hostname pada /etc/hosts

```bash
vi /etc/hosts


<IP Address>    <hostname>.localdomain   <hostname>
192.168.56.100   ol7-base.localdomain      ol7-base
```

#### Buat direktori untuk software oracle

```bash
mkdir /oracle
chown -R oracle:oinstall /oracle
```

## Instalasi Oracle Database Software

dengan user oracle

#### Buat Environment Oracle Database

```bash
vi db.env

# Oracle Settings
export TMP=/tmp
export TMPDIR=$TMP

export ORACLE_HOSTNAME=ol7-19.localdomain
export ORACLE_UNQNAME=cdb1
export ORACLE_SID=cdb1

export ORACLE_BASE=/oracle/product/orabase
export ORACLE_HOME=/oracle/product/19c
export ORA_INVENTORY=/oracle/product/oraInventory

export PATH=/usr/sbin:/usr/local/bin:$PATH
export PATH=$ORACLE_HOME/bin:$PATH

export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export CLASSPATH=$ORACLE_HOME/jlib:$ORACLE_HOME/rdbms/jlib

alias sq="sqlplus / as sysdba"
```

#### Automatis jalankan env

```bash
vi .bash_profile

# path lengkap db.env
. /home/oracle/db.env
```

#### Buat direktori untuk Oracle base, home, dan inventory

```bash
mkdir -p /oracle/product/orabase
mkdir -p /oracle/product/19c
mkdir -p /oracle/product/oraInventory
```

#### Pastikan environment oracle sudah tersedia

```bash
env | grep ORA

ORACLE_UNQNAME=cdb1
ORACLE_SID=cdb1
ORACLE_BASE=/oracle/product/orabase
ORACLE_HOSTNAME=ol7-base
ORA_INVENTORY=/oracle/product/oraInventory
ORACLE_HOME=/oracle/product/19c
```

#### Jika belum ada environment oracle jalanakan

```bash
. .bash_profile
```

#### Upload File dan copy ke Oracle home

```bash
unzip -qq LINUX.X64_193000_db_home.zip -d $ORACLE_HOME
```

#### Install Seoftware Oracle database 19c

```bash
cd $ORACLE_HOME
./runInstaller
```

![](/images/blog/install-oracle-19c-linux-7/image0.png)

![](/images/blog/install-oracle-19c-linux-7/image1.png)

![](/images/blog/install-oracle-19c-linux-7/image2.png)

![](/images/blog/install-oracle-19c-linux-7/image3.png)

![](/images/blog/install-oracle-19c-linux-7/image4.png)

![](/images/blog/install-oracle-19c-linux-7/image5.png)

![](/images/blog/install-oracle-19c-linux-7/image6.png)

![](/images/blog/install-oracle-19c-linux-7/image7.png)

![](/images/blog/install-oracle-19c-linux-7/image8.png)

![](/images/blog/install-oracle-19c-linux-7/image9.png)

```bash
# Jalankan dengan user root
/oracle/product/oraInventory/orainstRoot.sh
/oracle/product/19c/root.sh
```

```bash
# Output
[root@ol7-base ~]# /oracle/product/oraInventory/orainstRoot.sh
Changing permissions of /oracle/product/oraInventory.
Adding read,write permissions for group.
Removing read,write,execute permissions for world.

Changing groupname of /oracle/product/oraInventory to oinstall.
The execution of the script is complete.
[root@ol7-base ~]# /oracle/product/19c/root.sh
Performing root user operation.

The following environment variables are set as:
    ORACLE_OWNER= oracle
    ORACLE_HOME=  /oracle/product/19c

Enter the full pathname of the local bin directory: [/usr/local/bin]:
   Copying dbhome to /usr/local/bin ...
   Copying oraenv to /usr/local/bin ...
   Copying coraenv to /usr/local/bin ...


Creating /etc/oratab file...
Entries will be added to the /etc/oratab file as needed by
Database Configuration Assistant when a database is created
Finished running generic part of root script.
Now product-specific root actions will be performed.
Oracle Trace File Analyzer (TFA - Standalone Mode) is available at :
    /oracle/product/19c/bin/tfactl

Note :
1. tfactl will use TFA Service if that service is running and user has been granted access
2. tfactl will configure TFA Standalone Mode only if user has no access to TFA Service or TFA is not installed
```

![](/images/blog/install-oracle-19c-linux-7/image10.png)

#### Create new Listener

```bash
netca
```

![](/images/blog/install-oracle-19c-linux-7/image11.png)

![](/images/blog/install-oracle-19c-linux-7/image12.png)

![](/images/blog/install-oracle-19c-linux-7/image13.png)

![](/images/blog/install-oracle-19c-linux-7/image14.png)

![](/images/blog/install-oracle-19c-linux-7/image15.png)

![](/images/blog/install-oracle-19c-linux-7/image16.png)

![](/images/blog/install-oracle-19c-linux-7/image17.png)

#### Buat Database Baru

```bash
dbca
            
```

![](/images/blog/install-oracle-19c-linux-7/image18.png)

![](/images/blog/install-oracle-19c-linux-7/image19.png)

![](/images/blog/install-oracle-19c-linux-7/image20.png)

![](/images/blog/install-oracle-19c-linux-7/image21.png)

![](/images/blog/install-oracle-19c-linux-7/image22.png)

![](/images/blog/install-oracle-19c-linux-7/image23.png)

![](/images/blog/install-oracle-19c-linux-7/image24.png)

![](/images/blog/install-oracle-19c-linux-7/image25.png)

![](/images/blog/install-oracle-19c-linux-7/image26.png)

![](/images/blog/install-oracle-19c-linux-7/image27.png)

![](/images/blog/install-oracle-19c-linux-7/image28.png)

![](/images/blog/install-oracle-19c-linux-7/image29.png)

![](/images/blog/install-oracle-19c-linux-7/image30.png)

![](/images/blog/install-oracle-19c-linux-7/image31.png)

![](/images/blog/install-oracle-19c-linux-7/image32.png)

#### Test Koneksi Database

```bash
[oracle@ol7-base 19c]$ sq

SQL*Plus: Release 19.0.0.0.0 - Production on Mon Jun 23 15:53:14 2025
Version 19.3.0.0.0

Copyright (c) 1982, 2019, Oracle.  All rights reserved.


Connected to:
Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production
Version 19.3.0.0.0

SQL> select name, open_mode, database_role from v$database;

NAME      OPEN_MODE            DATABASE_ROLE
--------- -------------------- ----------------
CDB1      READ WRITE           PRIMARY

SQL> show pdbs

    CON_ID CON_NAME                       OPEN MODE  RESTRICTED
---------- ------------------------------ ---------- ----------
         2 PDB$SEED                       READ ONLY  NO
         3 PDB1                           READ WRITE NO
SQL> exit
Disconnected from Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production
Version 19.3.0.0.0
[oracle@ol7-base 19c]$ lsnrctl status

LSNRCTL for Linux: Version 19.0.0.0.0 - Production on 23-JUN-2025 15:53:35

Copyright (c) 1991, 2019, Oracle.  All rights reserved.

Connecting to (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ol7-base)(PORT=1521)))
STATUS of the LISTENER
------------------------
Alias                     LISTENER
Version                   TNSLSNR for Linux: Version 19.0.0.0.0 - Production
Start Date                23-JUN-2025 14:52:12
Uptime                    0 days 1 hr. 1 min. 24 sec
Trace Level               off
Security                  ON: Local OS Authentication
SNMP                      OFF
Listener Parameter File   /oracle/product/19c/network/admin/listener.ora
Listener Log File         /oracle/product/orabase/diag/tnslsnr/ol7-base/listener/alert/log.xml
Listening Endpoints Summary...
  (DESCRIPTION=(ADDRESS=(PROTOCOL=tcp)(HOST=ol7-base)(PORT=1521)))
  (DESCRIPTION=(ADDRESS=(PROTOCOL=ipc)(KEY=EXTPROC1521)))
Services Summary...
Service "383a5269f55e55eae06511c723e961ff" has 1 instance(s).
  Instance "cdb1", status READY, has 1 handler(s) for this service...
Service "86b637b62fdf7a65e053f706e80a27ca" has 1 instance(s).
  Instance "cdb1", status READY, has 1 handler(s) for this service...
Service "cdb1" has 1 instance(s).
  Instance "cdb1", status READY, has 1 handler(s) for this service...
Service "cdb1XDB" has 1 instance(s).
  Instance "cdb1", status READY, has 1 handler(s) for this service...
Service "pdb1" has 1 instance(s).
  Instance "cdb1", status READY, has 1 handler(s) for this service...
The command completed successfully

            
```

