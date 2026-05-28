---
title: "Install Oracle Database 19c pada Linux 8 (RHEL8, Centos8, OL8)"
description: "Langkah mudah memahami cara menginstall Oracle Database 19 pada Linux 8 (RHEL8, Centos8, OL8) beserta konfigurasi dasar yang diperlukan."
date: "2025-07-03"
cover: "/images/blog/install-oracle-19c-linux-8/coverImage.jpg"
tags:
  - oracle
  - 19c
  - linux
  - rhel8
  - installation
author: "Teguh Prasetyo"
draft: false
---

Panduan lengkap langkah-langkah instalasi Oracle Database 19c pada sistem operasi Linux versi 8, mencakup Red Hat Enterprise Linux 7, CentOS 7, dan Oracle Linux 7. Artikel ini juga menyertakan praktik terbaik dalam konfigurasi sistem dan database untuk memastikan instalasi berjalan optimal dan siap digunakan di lingkungan produksi.

> Artikel ini tidak membahas proses instalasi sistem operasi. Jika Anda ingin mengetahui cara menginstal sistem operasi Linux, silakan lihat panduannya di sini.

> Download Oracle Database 19c di See: <https://www.oracle.com/id/database/technologies/oracle19c-linux-downloads.html>

#### Konfigurasi Local Repository

Membuat Local Repository bisa lihat di ....

## Konfigurasi Sistem Operasi

### Otomatis konfigurasi dengan preinstall oracle

```bash
# Download preinstall jika ada internet
curl -o oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm https://yum.oracle.com/repo/OracleLinux/OL8/appstream/x86_64/getPackage/oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm

# Install 
yum -y install oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm
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
dnf install -y bc    
dnf install -y binutils
#dnf install -y compat-libcap1
dnf install -y compat-libstdc++-33
#dnf install -y dtrace-modules
#dnf install -y dtrace-modules-headers
#dnf install -y dtrace-modules-provider-headers
#dnf install -y dtrace-utils
dnf install -y elfutils-libelf
dnf install -y elfutils-libelf-devel
dnf install -y fontconfig-devel
dnf install -y glibc
dnf install -y glibc-devel
dnf install -y ksh
dnf install -y libaio
dnf install -y libaio-devel
#dnf install -y libdtrace-ctf-devel
dnf install -y libXrender
dnf install -y libXrender-devel
dnf install -y libX11
dnf install -y libXau
dnf install -y libXi
dnf install -y libXtst
dnf install -y libgcc
dnf install -y librdmacm-devel
dnf install -y libstdc++
dnf install -y libstdc++-devel
dnf install -y libxcb
dnf install -y make
dnf install -y net-tools # Clusterware
dnf install -y nfs-utils # ACFS
dnf install -y python3 # ACFS
dnf install -y python3-configshell # ACFS
dnf install -y python3-rtslib # ACFS
dnf install -y python3-six # ACFS
dnf install -y targetcli # ACFS
dnf install -y smartmontools
dnf install -y sysstat

# Added by me.
dnf install -y gcc
dnf install -y unixODBC

# New for OL8
dnf install -y libnsl
dnf install -y libnsl.i686
dnf install -y libnsl2
dnf install -y libnsl2.i686
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
192.168.56.70   ol8-db.localdomain      ol8-db
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

export ORACLE_HOSTNAME=ol8-db
export ORACLE_UNQNAME=cdb1
export ORACLE_SID=cdb1

export ORACLE_BASE=/oracle/product/orabase
export ORACLE_HOME=/oracle/product/19c
export ORA_INVENTORY=/oracle/product/oraInventory

export PATH=/usr/sbin:/usr/local/bin:$PATH
export PATH=$ORACLE_HOME/bin:$PATH

export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export CLASSPATH=$ORACLE_HOME/jlib:$ORACLE_HOME/rdbms/jlib

# Fake Oracle Linux 7.
export CV_ASSUME_DISTID=OEL7.6

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
ORACLE_HOSTNAME=ol8-db
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

![](/images/blog/install-oracle-19c-linux-8/image0.png)

![](/images/blog/install-oracle-19c-linux-8/image1.png)

![](/images/blog/install-oracle-19c-linux-8/image2.png)

![](/images/blog/install-oracle-19c-linux-8/image3.png)

![](/images/blog/install-oracle-19c-linux-8/image4.png)

![](/images/blog/install-oracle-19c-linux-8/image5.png)

![](/images/blog/install-oracle-19c-linux-8/image6.png)

![](/images/blog/install-oracle-19c-linux-8/image7.png)

![](/images/blog/install-oracle-19c-linux-8/image8.png)

```bash
# Jalankan dengan user root
/oracle/product/oraInventory/orainstRoot.sh
/oracle/product/19c/root.sh
```

```bash
# Output
[root@ol8-db ~]# /oracle/product/oraInventory/orainstRoot.sh
Changing permissions of /oracle/product/oraInventory.
Adding read,write permissions for group.
Removing read,write,execute permissions for world.

Changing groupname of /oracle/product/oraInventory to oinstall.
The execution of the script is complete.
[root@ol8-db ~]# /oracle/product/19c/root.sh
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

![](/images/blog/install-oracle-19c-linux-8/image9.png)

#### Create new Listener

```bash
netca
```

![](/images/blog/install-oracle-19c-linux-8/image10.png)

![](/images/blog/install-oracle-19c-linux-8/image11.png)

![](/images/blog/install-oracle-19c-linux-8/image12.png)

![](/images/blog/install-oracle-19c-linux-8/image13.png)

![](/images/blog/install-oracle-19c-linux-8/image14.png)

![](/images/blog/install-oracle-19c-linux-8/image15.png)

![](/images/blog/install-oracle-19c-linux-8/image16.png)

![](/images/blog/install-oracle-19c-linux-8/image17.png)

#### Buat Database Baru

```bash
dbca
            
```

![](/images/blog/install-oracle-19c-linux-8/image18.png)

![](/images/blog/install-oracle-19c-linux-8/image19.png)

![](/images/blog/install-oracle-19c-linux-8/image20.png)

![](/images/blog/install-oracle-19c-linux-8/image21.png)

![](/images/blog/install-oracle-19c-linux-8/image22.png)

![](/images/blog/install-oracle-19c-linux-8/image23.png)

![](/images/blog/install-oracle-19c-linux-8/image24.png)

![](/images/blog/install-oracle-19c-linux-8/image25.png)

![](/images/blog/install-oracle-19c-linux-8/image26.png)

![](/images/blog/install-oracle-19c-linux-8/image27.png)

![](/images/blog/install-oracle-19c-linux-8/image28.png)

![](/images/blog/install-oracle-19c-linux-8/image29.png)

![](/images/blog/install-oracle-19c-linux-8/image30.png)

![](/images/blog/install-oracle-19c-linux-8/image31.png)

![](/images/blog/install-oracle-19c-linux-8/image31.png)

#### Test Koneksi Database

```bash
[oracle@ol8-db ~]$ sq

SQL*Plus: Release 19.0.0.0.0 - Production on Sat Jun 28 17:04:51 2025
Version 19.3.0.0.0

Copyright (c) 1982, 2019, Oracle.  All rights reserved.


Connected to:
Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production
Version 19.3.0.0.0

SQL> select name, open_mode, database_role from v$database;

NAME      OPEN_MODE            DATABASE_ROLE
--------- -------------------- ----------------
CDB1      READ WRITE           PRIMARY

SQL> exit
Disconnected from Oracle Database 19c Enterprise Edition Release 19.0.0.0.0 - Production
Version 19.3.0.0.0
[oracle@ol8-db ~]$ lsnrctl status

LSNRCTL for Linux: Version 19.0.0.0.0 - Production on 28-JUN-2025 17:05:07

Copyright (c) 1991, 2019, Oracle.  All rights reserved.

Connecting to (DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=ol8-db)(PORT=1521)))
STATUS of the LISTENER
------------------------
Alias                     LISTENER
Version                   TNSLSNR for Linux: Version 19.0.0.0.0 - Production
Start Date                28-JUN-2025 16:22:52
Uptime                    0 days 0 hr. 42 min. 15 sec
Trace Level               off
Security                  ON: Local OS Authentication
SNMP                      OFF
Listener Parameter File   /oracle/product/19c/network/admin/listener.ora
Listener Log File         /oracle/product/orabase/diag/tnslsnr/ol8-db/listener/alert/log.xml
Listening Endpoints Summary...
  (DESCRIPTION=(ADDRESS=(PROTOCOL=tcp)(HOST=ol8-db.localdomain)(PORT=1521)))
  (DESCRIPTION=(ADDRESS=(PROTOCOL=ipc)(KEY=EXTPROC1521)))
Services Summary...
Service "389fe42a03eae97fe0634638a8c0926f" has 1 instance(s).
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

