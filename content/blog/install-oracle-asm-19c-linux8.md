---
title: "Install Oracle ASM on Linux 8 Using UDEV (No ASMLib)"
description: "Langkah mudah instalasi Oracle ASM pada Linux 8 menggunakan UDEV tanpa ASMLib"
date: "2025-07-15"
cover: "/images/blog/install-oracle-asm-19c-linux8/coverImage.jpg"
tags:
  - oracle
  - 19c
  - asm
  - linux
  - rhel8
author: "Teguh Prasetyo"
draft: false
---

### OS Konfigurasi

#### PreInstall

```bash
# Download preinstall jika ada internet
curl -o oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm https://yum.oracle.com/repo/OracleLinux/OL8/appstream/x86_64/getPackage/oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm

# Install 
yum -y install oracle-database-preinstall-19c-1.0-2.el8.x86_64.rpm
```

#### Konfigurasi /etc/hosts, SELINUX dan Firewall

```bash
vi /etc/hosts
vi /etc/selinux/config

# Set Permissive
SELINUX=permissive

setenforce 0

# Disable Firewall

systemctl stop firewalld
systemctl disable firewalld
```

#### Ilustrasi Struktur

```bash
+DATA
 ├── SYSTEM.dbf
 ├── USERS.dbf
 ├── SYSAUX.dbf
 └── redo01.log, redo02.log

+FRA
 ├── ARCHIVELOG/
 ├── BACKUPSET/
 ├── AUTOBACKUP/
 └── FLASHBACK/
```

#### Persiapan Disk ASM

```bash
lsblk
```

```bash
NAME                   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda                      8:0    0  100G  0 disk
├─sda1                   8:1    0    1G  0 part /boot
└─sda2                   8:2    0   99G  0 part
  ├─ol_testserver-root 252:0    0 63.9G  0 lvm  /
  ├─ol_testserver-swap 252:1    0    4G  0 lvm  [SWAP]
  └─ol_testserver-home 252:2    0 31.2G  0 lvm  /home
sdb                      8:16   0   20G  0 disk
sdc                      8:32   0   20G  0 disk
sdd                      8:48   0   20G  0 disk
sde                      8:64   0   20G  0 disk
sr0                     11:0    1 1024M  0 rom
```

#### Kebutuhan

```bash
sda      100G (Untuk OS)
sdb       20G (Untuk +DATA)
sdc       20G (Untuk +DATA)
sdd       20G (Untuk +DATA)

sde       20G (Untuk +FRA)

# 60G Untuk DATA 20G untuk FRA
```

#### Cek WWID/ID_SERIAL Disk

Jalankan untuk sdb,sdc,sdd,sde:

```bash
udevadm info --query=all --name=/dev/sdb | grep ID_SERIAL
udevadm info --query=all --name=/dev/sdc | grep ID_SERIAL
udevadm info --query=all --name=/dev/sdd | grep ID_SERIAL
udevadm info --query=all --name=/dev/sde | grep ID_SERIAL
```

Contoh hasil:

```bash
E: ID_SERIAL=VBOX_HARDDISK_VB60b2ac00_xxxx
```

#### Buat UDEV Rules

Contoh: kita ingin set /dev/sdb dan /dev/sdc agar dimiliki oleh user oracle dan group dba

```bash
cat <<EOF > /etc/udev/rules.d/99-oracle-asm.rules
ENV{ID_SERIAL}=="VBOX_HARDDISK_VB60b2ac00-6daa3d26", SYMLINK+="oracleasm/asm-data1", OWNER="oracle", GROUP="dba", MODE="0660"
ENV{ID_SERIAL}=="VBOX_HARDDISK_VBe6fd7d34-6e2d417f", SYMLINK+="oracleasm/asm-data2", OWNER="oracle", GROUP="dba", MODE="0660"
ENV{ID_SERIAL}=="VBOX_HARDDISK_VB835d1ee2-b33935b1", SYMLINK+="oracleasm/asm-data3", OWNER="oracle", GROUP="dba", MODE="0660"
ENV{ID_SERIAL}=="VBOX_HARDDISK_VBb8bacc53-3ac18aea", SYMLINK+="oracleasm/asm-fra1", OWNER="oracle", GROUP="dba", MODE="0660"
EOF
```

#### Reload UDEV dan Verifikasi

```bash
udevadm control --reload-rules
udevadm trigger
```

Cek kepemilikan:

```bash
ls -l /dev/oracleasm/
```

```bash
lrwxrwxrwx. 1 root root 6 Jul 10 11:33 asm-data1 -> ../sdb
lrwxrwxrwx. 1 root root 6 Jul 10 11:33 asm-data2 -> ../sdc
lrwxrwxrwx. 1 root root 6 Jul 10 11:33 asm-data3 -> ../sdd
lrwxrwxrwx. 1 root root 6 Jul 10 11:33 asm-fra1 -> ../sde
```

### Install Oracle Grid Infrastructure (Stand-alone)

Menggunakan user oracle

#### Buat env grid

```bash
vi grid.env
```

```bash
# Oracle Settings
export TMP=/tmp
export TMPDIR=$TMP
export ORACLE_SID=+ASM

export ORACLE_HOME=/oracle/product/grid_home
export ORACLE_BASE=/oracle/product/orabase
export ORA_INVENTORY=/oracle/product/oraInventory


export PATH=/usr/sbin:/usr/local/bin:$PATH
export PATH=$ORACLE_HOME/bin:$PATH

export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export CLASSPATH=$ORACLE_HOME/jlib:$ORACLE_HOME/rdbms/jlib

# Fake Oracle Linux 7.
export CV_ASSUME_DISTID=OEL7.6
```

#### Jalankan env grid

```bash
. grid.env
```

#### Buat Folder untuk Oracle Grid

```bash
mkdir -p $ORACLE_HOME
mkdir -p $ORACLE_BASE
mkdir -p $ORA_INVENTORY
```

#### Upload File dan copy ke Oracle home

```bash
unzip -qq LINUX.X64_193000_grid_home.zip -d $ORACLE_HOME
```

#### Install Grid

```bash
cd $ORACLE_HOME
./gridSetup.sh
```

![](/images/blog/install-oracle-asm-19c-linux8/image0.png)

#### Ubah Normal menjadi external, ASM yang digunakan tidak menjadi redudansi

![](/images/blog/install-oracle-asm-19c-linux8/image1.png)

![](/images/blog/install-oracle-asm-19c-linux8/image2.png)

![](/images/blog/install-oracle-asm-19c-linux8/image3.png)

![](/images/blog/install-oracle-asm-19c-linux8/image4.png)

![](/images/blog/install-oracle-asm-19c-linux8/image5.png)

![](/images/blog/install-oracle-asm-19c-linux8/image6.png)

![](/images/blog/install-oracle-asm-19c-linux8/image7.png)

![](/images/blog/install-oracle-asm-19c-linux8/image8.png)

![](/images/blog/install-oracle-asm-19c-linux8/image9.png)

#### Install CV disk

Menggunakan user root

```bash
cd /oracle/product/grid_home/cv/rpm/
yum install -y cvuqdisk-1.0.10-1.rpm
```

![](/images/blog/install-oracle-asm-19c-linux8/image10.png)

![](/images/blog/install-oracle-asm-19c-linux8/image11.png)

![](/images/blog/install-oracle-asm-19c-linux8/image12.png)

![](/images/blog/install-oracle-asm-19c-linux8/image13.png)

#### Jalankan di user root

```bash
/oracle/product/oraInventory/orainstRoot.sh
/oracle/product/grid_home/root.sh
```

![](/images/blog/install-oracle-asm-19c-linux8/image14.png)

#### Tambah Diskgroup FRA

```bash
asmca
```

![](/images/blog/install-oracle-asm-19c-linux8/image15.png)

![](/images/blog/install-oracle-asm-19c-linux8/image16.png)

![](/images/blog/install-oracle-asm-19c-linux8/image17.png)

