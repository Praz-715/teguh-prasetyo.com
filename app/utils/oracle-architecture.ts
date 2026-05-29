export type ArchComponentId =
  | 'shared-pool' | 'buffer-cache' | 'redo-buffer' | 'large-pool' | 'java-pool'
  | 'pga' | 'sga' | 'instance'
  | 'dbwr' | 'lgwr' | 'smon' | 'pmon' | 'ckpt' | 'arcn'
  | 'datafiles' | 'controlfiles' | 'redo-logs' | 'undo-ts' | 'temp-ts'
  | 'archive-logs'

export type ArchComponent = {
  id: ArchComponentId
  name: string
  short: string
  group: 'sga' | 'pga' | 'process' | 'storage' | 'container'
  simple: string
  advanced: string
  bestPractice: string
  commonIssue: string
  interview: string[]
}

export const ARCH_COMPONENTS: ArchComponent[] = [
  {
    id: 'shared-pool',
    name: 'Shared Pool',
    short: 'SHARED',
    group: 'sga',
    simple: 'Tempat Oracle menyimpan rencana eksekusi SQL & metadata kamus data agar query berikutnya tidak perlu di-parse ulang.',
    advanced: 'Berisi Library Cache (parsed SQL, PL/SQL units, execution plans) + Data Dictionary Cache (row cache) + Reserved Pool + Result Cache. Dikelola via least-recently-used. Aging out karena tekanan memori → hard parse + library cache misses.',
    bestPractice: 'Pakai bind variables untuk maksimalkan cursor sharing. Pantau V$SHARED_POOL_ADVICE & V$LIBRARYCACHE. Pertimbangkan SHARED_POOL_RESERVED_SIZE untuk alokasi besar.',
    commonIssue: 'ORA-04031 (gagal alokasi shared pool) — biasanya karena banyak literal SQL yang gak bisa di-share. Atau aplikasi yang gak close cursor → leak.',
    interview: [
      'Apa perbedaan soft parse vs hard parse?',
      'Kenapa bind variable penting untuk shared pool?',
      'Cara monitor library cache hit ratio?',
    ],
  },
  {
    id: 'buffer-cache',
    name: 'Database Buffer Cache',
    short: 'BUFFER',
    group: 'sga',
    simple: 'Cache untuk blok-blok data yang sering diakses. Dengan ini Oracle tidak perlu baca disk setiap query.',
    advanced: 'Default + KEEP + RECYCLE buffer pools. Algoritma touch-count modified LRU. Dirty buffers (berubah belum di-flush) ditulis DBWR ke datafiles secara periodik. Buffer states: free, pinned, dirty, clean.',
    bestPractice: 'Sizing via V$DB_CACHE_ADVICE. Untuk RAC, perhatikan global cache transfers (gc current block). Tabel kecil yang sering dipakai bisa di-CACHE.',
    commonIssue: '"db file sequential read" tinggi → index lookup banyak miss buffer cache. "buffer busy waits" → kontensi blok yang sama.',
    interview: [
      'Apa itu LRU & touch count?',
      'Kapan DBWR menulis buffer ke disk?',
      'Beda buffer cache hit ratio 99% vs 80% — masih bermasalah?',
    ],
  },
  {
    id: 'redo-buffer',
    name: 'Redo Log Buffer',
    short: 'REDO',
    group: 'sga',
    simple: 'Buffer kecil tempat Oracle mencatat semua perubahan sebelum di-flush LGWR ke redo log file di disk.',
    advanced: 'Circular buffer di SGA. LGWR flush ketika: COMMIT, buffer 1/3 full, setiap 3 detik, atau DBWR mau tulis dirty buffer (write-ahead logging).',
    bestPractice: 'Default size biasanya cukup. Untuk OLTP heavy, monitor "log buffer space" wait event. Pertimbangkan COMMIT_LOGGING/COMMIT_WAIT untuk tuning durability vs throughput.',
    commonIssue: '"log buffer space" wait → redo buffer terlalu kecil atau LGWR tidak mengejar.',
    interview: [
      'Kenapa redo log harus ditulis sebelum dirty buffer?',
      'Apa itu group commit?',
      'Apa beda redo buffer vs redo log file?',
    ],
  },
  {
    id: 'large-pool',
    name: 'Large Pool',
    short: 'LARGE',
    group: 'sga',
    simple: 'Pool memori opsional untuk alokasi besar seperti RMAN, Shared Server, Parallel Query — agar shared pool gak terbebani.',
    advanced: 'Mencegah fragmentation di shared pool. Dipakai oleh: RMAN backup buffers, Shared Server UGA, Parallel Query message buffers, XML DB.',
    bestPractice: 'Set LARGE_POOL_SIZE eksplisit kalau pakai RMAN atau Shared Server intensif. Default tidak terlalu besar.',
    commonIssue: 'ORA-04031 di large pool saat RMAN — sizing terlalu kecil untuk channel paralel.',
    interview: [
      'Kapan large pool perlu di-set manual?',
      'Apa hubungannya dengan RMAN channels?',
    ],
  },
  {
    id: 'java-pool',
    name: 'Java Pool',
    short: 'JAVA',
    group: 'sga',
    simple: 'Memori untuk Java Virtual Machine di dalam database. Diperlukan kalau pakai stored procedure Java.',
    advanced: 'Berisi state per session (Java) + shared class data. Jarang diutak-atik kecuali aplikasi memang berbasis Java in-database.',
    bestPractice: 'Set 100M+ kalau pakai Java intensif. Kalau tidak dipakai, default OK.',
    commonIssue: 'ORA-04031 di Java pool saat load Java code besar.',
    interview: [
      'Kapan Java pool relevan?',
    ],
  },
  {
    id: 'pga',
    name: 'PGA — Program Global Area',
    short: 'PGA',
    group: 'pga',
    simple: 'Memori privat untuk tiap session: tempat sort, hash join, dan variabel session. Tidak di-share antar user.',
    advanced: 'PGA = UGA (Sort Area, Hash Area, Bitmap Area, …) + Stack space + Private SQL Area (cursor state, bind variables). Dikontrol PGA_AGGREGATE_TARGET. Limit hard via PGA_AGGREGATE_LIMIT (12c+).',
    bestPractice: 'Pantau V$PGA_TARGET_ADVICE. OLTP ~20% RAM, DSS ~50% RAM. Aktifkan WORKAREA_SIZE_POLICY=AUTO.',
    commonIssue: 'ORA-04036 (PGA limit exceeded) — session boros sort/hash. Atau temp tablespace penuh karena workarea spill ke disk.',
    interview: [
      'Beda SGA vs PGA?',
      'Apa itu workarea sort/hash?',
      'Kenapa query bisa "spill to temp"?',
    ],
  },
  {
    id: 'sga',
    name: 'SGA — System Global Area',
    short: 'SGA',
    group: 'sga',
    simple: 'Memori shared yang dipakai semua session di instance ini. Berisi pool-pool seperti buffer cache, shared pool, redo buffer.',
    advanced: 'SGA dialokasikan saat instance startup. Modern: ASMM (SGA_TARGET) otomatis re-distribute antar pool. AMM (MEMORY_TARGET) menyatukan SGA+PGA tapi tidak compatible dgn HugePages di Linux.',
    bestPractice: 'Sizing 60-70% RAM dedicated server. Pakai HugePages di Linux. Disable AMM kalau pakai HugePages.',
    commonIssue: 'Instance crash di startup karena tidak cukup HugePages.',
    interview: [
      'Beda SGA_TARGET vs MEMORY_TARGET?',
      'Kenapa HugePages penting?',
    ],
  },
  {
    id: 'instance',
    name: 'Instance',
    short: 'INSTANCE',
    group: 'container',
    simple: 'Kombinasi SGA + background processes. Instance "membuka" database. Tanpa instance, file database hanya file mati di disk.',
    advanced: 'Multiple instances bisa mengakses 1 database (= RAC). Single instance = 1 SGA + 1 set background processes.',
    bestPractice: '—',
    commonIssue: '—',
    interview: [
      'Beda instance vs database?',
      'Bisa 1 instance buka 2 database?',
    ],
  },

  {
    id: 'dbwr',
    name: 'DBWR — Database Writer',
    short: 'DBWR',
    group: 'process',
    simple: 'Background process yang menulis dirty buffer dari Buffer Cache ke datafiles.',
    advanced: 'Dipicu saat: checkpoint, free buffer di bawah threshold, LRU end mendekati dirty list limit, tablespace begin backup. Bisa multiple (DBW0–DBW9) atau ASYNC IO untuk paralelisme.',
    bestPractice: 'Default DBWR count = CPU_COUNT/8. Tambah kalau "db file parallel write" tinggi. Pastikan ASYNC IO aktif.',
    commonIssue: '"free buffer waits" — DBWR tidak menulis cukup cepat.',
    interview: [
      'Kapan DBWR aktif?',
      'Beda DBWR vs LGWR?',
      'Kenapa DBWR ditunda?',
    ],
  },
  {
    id: 'lgwr',
    name: 'LGWR — Log Writer',
    short: 'LGWR',
    group: 'process',
    simple: 'Menulis redo log buffer ke online redo log file di disk. Setiap COMMIT memicu LGWR flush.',
    advanced: 'Kritis untuk durability. Single process (atau LGnn worker di 12c+). Sync IO ke redo log. LGWR sync = bottleneck COMMIT throughput.',
    bestPractice: 'Tempatkan redo log di disk tercepat (NVMe). Multiplex redo log groups ke 2+ disk berbeda. Monitor "log file sync" wait.',
    commonIssue: '"log file sync" tinggi → IO redo lambat. "log file switch (archiving needed)" → ARCn ketinggalan.',
    interview: [
      'Kapan LGWR menulis?',
      'Apa itu log file sync vs log file parallel write?',
    ],
  },
  {
    id: 'smon',
    name: 'SMON — System Monitor',
    short: 'SMON',
    group: 'process',
    simple: 'Membersihkan database: instance recovery saat startup, coalesce free space, drop temp segments yang tertinggal.',
    advanced: 'Auto-restart hanya berjalan kalau instance crash. Recover transaction yang belum commit dari redo. Bersihkan temporary segment yang tidak dipakai.',
    bestPractice: '—',
    commonIssue: 'Jarang masalah — SMON adalah cleaner.',
    interview: [
      'Apa peran SMON saat instance crash?',
      'Apa itu instance recovery?',
    ],
  },
  {
    id: 'pmon',
    name: 'PMON — Process Monitor',
    short: 'PMON',
    group: 'process',
    simple: 'Bersihkan session yang mati: rollback transaction, release lock, free resource session.',
    advanced: 'Juga register instance ke listener (service registration). Di 12c+ tugas dipecah ke CLMN (Cleanup Master) + cleanup slaves.',
    bestPractice: '—',
    commonIssue: 'Kalau session zombie tidak dibersihkan → cek PMON_CYCLE.',
    interview: [
      'Apa beda SMON vs PMON?',
      'Kenapa PMON penting untuk listener?',
    ],
  },
  {
    id: 'ckpt',
    name: 'CKPT — Checkpoint Process',
    short: 'CKPT',
    group: 'process',
    simple: 'Memberitahu DBWR untuk menulis dirty buffer & update header datafile setiap checkpoint.',
    advanced: 'Checkpoint = sinkronisasi memory ↔ disk untuk percepat recovery. Update SCN di control file & datafile headers. Tidak menulis blok data — itu DBWR.',
    bestPractice: 'FAST_START_MTTR_TARGET kontrol seberapa agresif checkpoint. Trade-off: recovery time vs IO overhead.',
    commonIssue: '"checkpoint not complete" — DBWR/IO tidak mengejar perubahan log → switch log gagal.',
    interview: [
      'Apa hubungan checkpoint dengan recovery time?',
      'Kapan checkpoint full vs incremental?',
    ],
  },
  {
    id: 'arcn',
    name: 'ARCn — Archiver',
    short: 'ARCn',
    group: 'process',
    simple: 'Menyalin online redo log ke archive log directory setelah log switch.',
    advanced: 'Aktif hanya saat ARCHIVELOG mode. Bisa multiple ARCn untuk parallel archival. Tujuan: LOG_ARCHIVE_DEST_n (lokal & remote/standby).',
    bestPractice: 'Setidaknya 2 destination archive (local + remote/FRA). Monitor FRA penuh — kalau penuh, ARCn hang → database hang.',
    commonIssue: 'FRA penuh → ARCn stuck → instance freeze. ORA-19815.',
    interview: [
      'Beda ARCHIVELOG vs NOARCHIVELOG?',
      'Kenapa archive log penting untuk PITR?',
    ],
  },

  {
    id: 'datafiles',
    name: 'Datafiles',
    short: 'DBF',
    group: 'storage',
    simple: 'File fisik tempat data tabel & index disimpan. Diorganisir dalam tablespace.',
    advanced: 'Header berisi SCN, checkpoint info. Tabel ↔ segment ↔ extent ↔ block. Block size default 8K, bisa 4K/16K/32K per tablespace.',
    bestPractice: 'BIGFILE tablespace untuk simpler management. AUTOEXTEND ON dengan MAXSIZE. Letakkan di disk performant.',
    commonIssue: 'ORA-01652 (temp/normal extent gak bisa diperluas), ORA-01654 (tablespace penuh).',
    interview: [
      'Beda smallfile vs bigfile tablespace?',
      'Apa itu high water mark?',
    ],
  },
  {
    id: 'controlfiles',
    name: 'Control Files',
    short: 'CTL',
    group: 'storage',
    simple: 'File metadata kritis: lokasi datafile, redo log, SCN, RMAN catalog. Tanpa control file, instance gak bisa mount.',
    advanced: 'Biner kecil tapi vital. Selalu multiplex ke 3+ lokasi. RMAN backup otomatis (controlfile autobackup).',
    bestPractice: 'Multiplex minimum 3 copy di disk/diskgroup berbeda. CONFIGURE CONTROLFILE AUTOBACKUP ON.',
    commonIssue: 'Hilang semua control file = restore dari backup atau RMAN catalog.',
    interview: [
      'Kenapa control file di-multiplex?',
      'Bisa di-rebuild?',
    ],
  },
  {
    id: 'redo-logs',
    name: 'Online Redo Logs',
    short: 'REDO',
    group: 'storage',
    simple: 'File berisi log perubahan database. Ditulis LGWR. Wajib untuk recovery.',
    advanced: 'Minimum 2 groups, bisa multiplex member tiap group ke beberapa disk. Log switch saat penuh → ARCn copy ke archive.',
    bestPractice: '3+ groups dengan 2+ members. Size cukup besar agar switch tidak terlalu sering (~15-20 menit).',
    commonIssue: '"log file switch (checkpoint incomplete)" — log terlalu kecil atau DBWR lambat.',
    interview: [
      'Beda online vs archive redo?',
      'Kenapa multiplex redo log?',
    ],
  },
  {
    id: 'undo-ts',
    name: 'UNDO Tablespace',
    short: 'UNDO',
    group: 'storage',
    simple: 'Tempat menyimpan data lama sebelum diubah, untuk ROLLBACK dan read consistency.',
    advanced: 'AUM (Automatic Undo Management). UNDO_RETENTION jadi target retention untuk flashback query.',
    bestPractice: 'AUTOEXTEND ON. Size cukup untuk transaksi terbesar + retention.',
    commonIssue: 'ORA-01555 "snapshot too old" — undo di-overwrite sebelum query selesai membacanya.',
    interview: [
      'Apa beda undo vs redo?',
      'Apa itu snapshot too old?',
    ],
  },
  {
    id: 'temp-ts',
    name: 'TEMP Tablespace',
    short: 'TEMP',
    group: 'storage',
    simple: 'Tempat penyimpanan sementara untuk sort/hash yang tidak muat di PGA.',
    advanced: 'TEMPFILE bukan datafile biasa — sparse, tidak dimasukkan ke backup. Per-session allocation via temp segment.',
    bestPractice: 'Multiple TEMP groups untuk RAC. Size cukup untuk worst-case sort.',
    commonIssue: 'ORA-01652 unable to extend temp segment.',
    interview: [
      'Kapan query menggunakan TEMP?',
      'Beda temp vs undo?',
    ],
  },
  {
    id: 'archive-logs',
    name: 'Archive Logs',
    short: 'ARCH',
    group: 'storage',
    simple: 'Salinan offline dari online redo log, dipakai untuk point-in-time recovery & Data Guard.',
    advanced: 'Format & destination dikontrol LOG_ARCHIVE_FORMAT & LOG_ARCHIVE_DEST_n. Bisa local, FRA, atau remote standby.',
    bestPractice: 'Backup archive log harian. Hapus setelah ter-applied di standby + ter-backup.',
    commonIssue: 'FRA penuh = ARCn hang = database hang.',
    interview: [
      'Apa itu PITR?',
      'Kenapa archive log penting untuk Data Guard?',
    ],
  },
]

export function archComponent(id: ArchComponentId): ArchComponent | undefined {
  return ARCH_COMPONENTS.find(c => c.id === id)
}

export type FlowStep = {
  id: string
  title: string
  description: string
  highlight: ArchComponentId[]
  arrow?: { from: ArchComponentId, to: ArchComponentId }
}

export const QUERY_FLOW: FlowStep[] = [
  {
    id: 'parse',
    title: '1. SQL masuk ke Shared Pool',
    description: 'Oracle parse SQL, cari di Library Cache (soft parse) atau buat plan baru (hard parse). Bind variable membantu cursor sharing.',
    highlight: ['shared-pool'],
  },
  {
    id: 'fetch-buffer',
    title: '2. Blok data dimuat ke Buffer Cache',
    description: 'Plan dieksekusi. Block ID dicari di Buffer Cache. Kalau miss → physical IO dari datafiles ke buffer.',
    highlight: ['buffer-cache'],
    arrow: { from: 'datafiles', to: 'buffer-cache' },
  },
  {
    id: 'modify',
    title: '3. Perubahan ditulis ke Redo Buffer',
    description: 'Untuk DML, sebelum dirty buffer mutated, redo record (before+after image) ditulis ke Redo Log Buffer. Ini hukum WAL (Write-Ahead Logging).',
    highlight: ['redo-buffer', 'buffer-cache'],
    arrow: { from: 'buffer-cache', to: 'redo-buffer' },
  },
  {
    id: 'commit',
    title: '4. COMMIT → LGWR flush',
    description: 'Saat COMMIT, LGWR menulis redo buffer ke Online Redo Log file. Server process menunggu sampai write selesai (log file sync). Setelah ini transaksi durable.',
    highlight: ['redo-buffer', 'lgwr', 'redo-logs'],
    arrow: { from: 'redo-buffer', to: 'redo-logs' },
  },
  {
    id: 'dbwr',
    title: '5. DBWR flush dirty buffer ke datafiles',
    description: 'Async — DBWR menulis dirty buffer ke datafiles saat checkpoint, free buffer rendah, atau idle. Catatan: DBWR menulis SETELAH LGWR (WAL).',
    highlight: ['buffer-cache', 'dbwr', 'datafiles'],
    arrow: { from: 'buffer-cache', to: 'datafiles' },
  },
  {
    id: 'archive',
    title: '6. Log switch → ARCn archive',
    description: 'Saat online redo log penuh, terjadi log switch. ARCn menyalin redo log lama ke archive destination. Wajib di ARCHIVELOG mode untuk recovery & Data Guard.',
    highlight: ['redo-logs', 'arcn', 'archive-logs'],
    arrow: { from: 'redo-logs', to: 'archive-logs' },
  },
]

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export const ARCH_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Background process mana yang menulis dirty buffer dari Buffer Cache ke datafiles?',
    options: ['LGWR', 'DBWR', 'SMON', 'CKPT'],
    correctIndex: 1,
    explanation: 'DBWR (Database Writer) menulis dirty buffer ke datafiles. LGWR menulis redo. SMON cleanup. CKPT memicu sinkronisasi tapi tidak menulis data.',
  },
  {
    id: 'q2',
    question: 'Apa hukum WAL (Write-Ahead Logging)?',
    options: [
      'Datafile harus ditulis dulu sebelum redo log',
      'Redo log harus ditulis ke disk sebelum dirty buffer ditulis ke datafile',
      'Buffer cache lebih dulu di-flush dari redo buffer',
      'COMMIT langsung menulis datafile',
    ],
    correctIndex: 1,
    explanation: 'WAL: perubahan harus dicatat di redo log file sebelum dirty buffer di-flush ke datafile. Ini menjamin recovery bisa replay perubahan yang belum sempat di-DBWR.',
  },
  {
    id: 'q3',
    question: 'Kapan LGWR menulis ke Online Redo Log?',
    options: [
      'Hanya saat COMMIT',
      'Setiap dirty buffer dibuat',
      'Saat COMMIT, redo buffer 1/3 penuh, setiap 3 detik, atau sebelum DBWR menulis',
      'Hanya saat checkpoint',
    ],
    correctIndex: 2,
    explanation: 'LGWR aktif pada beberapa kondisi: COMMIT, buffer 1/3 full, timer 3 detik, atau sebelum DBWR mau flush dirty buffer (write-ahead).',
  },
  {
    id: 'q4',
    question: 'Apa beda SGA dan PGA?',
    options: [
      'SGA per-session, PGA shared',
      'SGA shared antar session di instance, PGA private per server process',
      'Keduanya shared',
      'Keduanya per-session',
    ],
    correctIndex: 1,
    explanation: 'SGA = System Global Area, shared di-instance. PGA = Program Global Area, private per server process (per session pada dedicated server).',
  },
  {
    id: 'q5',
    question: 'Error "ORA-04031 unable to allocate X bytes of shared memory" paling sering disebabkan oleh?',
    options: [
      'Datafile penuh',
      'CPU 100%',
      'Fragmentasi shared pool karena banyak hard parse',
      'Network lambat',
    ],
    correctIndex: 2,
    explanation: 'ORA-04031 biasanya karena shared pool fragmented akibat banyak literal SQL (tanpa bind variable) → banyak hard parse → unique chunks di shared pool gak bisa di-share.',
  },
  {
    id: 'q6',
    question: 'Untuk apa UNDO tablespace?',
    options: [
      'Backup database',
      'Sort & hash operations',
      'ROLLBACK + read consistency (multi-version concurrency)',
      'Archive redo logs',
    ],
    correctIndex: 2,
    explanation: 'UNDO menyimpan data lama sebelum perubahan. Dipakai untuk ROLLBACK dan read consistency — query Anda lihat data konsisten saat query dimulai meski ada transaksi lain.',
  },
  {
    id: 'q7',
    question: 'Apa konsekuensi FRA (Fast Recovery Area) penuh?',
    options: [
      'Tidak ada — Oracle auto-bersihkan',
      'Hanya warning di alert log',
      'ARCn tidak bisa archive → log switch gagal → database hang',
      'Performance degraded sedikit',
    ],
    correctIndex: 2,
    explanation: 'FRA penuh = ARCn gak bisa salin redo → log switch gagal → semua transaksi yang butuh redo space terhenti → instance freeze. Selalu monitor V$RECOVERY_FILE_DEST.',
  },
  {
    id: 'q8',
    question: 'Berapa minimum jumlah Online Redo Log groups yang direkomendasikan?',
    options: ['1', '2', '3 atau lebih', '10+'],
    correctIndex: 2,
    explanation: '3+ groups direkomendasikan: saat 1 group sedang current (ditulis LGWR), 1 group sedang di-archive ARCn, 1 group standby/idle untuk switch berikutnya.',
  },
]
