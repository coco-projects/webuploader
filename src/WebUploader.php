<?php

    declare(strict_types = 1);

    namespace Coco\webuploader;

    use Coco\webuploader\events\FileMergedSuccessfulEvent;
    use Coco\webuploader\traits\Statization;
    use Coco\webuploader\Validator\Validator;
    use Psr\Log\LoggerInterface;
    use Symfony\Component\EventDispatcher\EventDispatcher;
    use Symfony\Component\EventDispatcher\EventDispatcherInterface;
    use Symfony\Component\Filesystem\Filesystem;
    use Symfony\Component\Filesystem\Path;
    use Symfony\Component\Finder\Finder;

class WebUploader
{
    use Statization;

    protected ?string $hashField = null;
    protected ?string $saveNameField = null;

    protected $pathGenerator          = null;
    protected $insertCallback         = null;
    protected $mergeProcessorCallback = null;


    protected ?int $byteStart     = null;
    protected ?int $byteEnd       = null;
    protected ?int $fileTotalSize = null;
    protected ?int $uploadedSize  = null;
    protected int  $chunk         = 1;
    protected int  $chunks        = 1;
    protected int  $tmpCacheTime  = 1 * 60 * 60 * 24;


    protected bool $hasError           = false;
    protected bool $isInited           = false;
    protected bool $isAllChunkUploaded = false;
    protected bool $enableDb           = false;


    protected ?string $hash       = null;
    protected string  $errorMsg   = '';
    protected string  $originName = '';
    protected string  $fileExt    = '';
    protected string  $tempDir    = './temp';
    protected string  $targetDir  = './uploads';
    protected string  $type       = 'application/octet-stream';

    protected ?TempFile        $uploadedFile    = null;
    protected ?Filesystem      $filesystem      = null;
    protected ?Finder          $finder          = null;
    protected ?LoggerInterface $logger          = null;
    protected ?EventDispatcher $eventDispatcher = null;
    protected ?Db              $db              = null;

    /**
     * @var Validator[]
     */
    protected array $validators       = [];
    protected array $uploadedFileInfo = [];
    protected array $configData       = [];
    protected array $tempData         = [];
    protected array $SERVER_;
    protected array $POST_;

    protected array $errors = [
        UPLOAD_ERR_INI_SIZE   => '上传的文档超过了 php.ini 中 upload_max_filesize 指令设定的最大值。',
        UPLOAD_ERR_FORM_SIZE  => '上传文档的大小超过了 HTML 表单中 MAX_FILE_SIZE 选项指定的最大值。',
        UPLOAD_ERR_PARTIAL    => '文档只有部分被上传。',
        UPLOAD_ERR_NO_FILE    => '没有文档被上传。',
        UPLOAD_ERR_NO_TMP_DIR => '找不到临时文档夹。',
        UPLOAD_ERR_CANT_WRITE => '文档写入失败。',
        UPLOAD_ERR_EXTENSION  => 'PHP 扩展停止了文档上传。',
    ];

    protected function __construct()
    {
        $this->finder          = new Finder();
        $this->filesystem      = new Filesystem();
        $this->eventDispatcher = new EventDispatcher();
    }

    /**
     * ---------------------------------------------------------
     * ---------------------------------------------------------
     */

    /**
     * @throws \Exception
     */
    public static function getInsForUploader($fileInfo, $targetDir, $tempDir, $logger = null): static
    {
        $ins = new static();
        $ins->setUploadedFileInfo($fileInfo);
        $ins->setTargetDir($targetDir);
        $ins->setTempDir($tempDir);
        $ins->init();
        $ins->setHash($ins->createFileIdentifier());
        $logger and $ins->setLogger($logger);

        return $ins;
    }

    public static function getInsForMerge($hash, $targetDir, $tempDir, $logger = null): static
    {
        $ins = new static();
        $ins->setHash($hash);
        $ins->setTargetDir($targetDir);
        $ins->setTempDir($tempDir);
        $logger and $ins->setLogger($logger);

        $ins->initConfigData();

        return $ins;
    }

    public static function getInsForGetChunkStatus($hash, $targetDir, $tempDir, $logger = null): static
    {
        $ins = new static();
        $ins->setHash($hash);
        $ins->setTargetDir($targetDir);
        $ins->setTempDir($tempDir);
        $logger and $ins->setLogger($logger);

        $ins->initConfigData();

        return $ins;
    }

    public static function getInsForClearTmp($tempDir, $cacheTime = 60 * 60 * 24, $logger = null): static
    {
        $ins = new static();
        $ins->setTempDir($tempDir);
        $ins->setTmpCacheTime($cacheTime);
        $logger and $ins->setLogger($logger);

        return $ins;
    }


    /**
     * ---------------------------------------------------------
     * ---------------------------------------------------------
     */

    public function makeHashTempPath(): string
    {
        return static::makeHashTempPath_($this->hash, $this->tempDir);
    }

    public function makeConfigFilePath(): string
    {
        return static::makeConfigFilePath_($this->hash, $this->tempDir);
    }

    public function getHashTempFileStatus(): array
    {
        return static::getHashTempFileStatus_($this->hash, $this->tempDir);
    }

    public function makeHashChunkFileName($index): string
    {
        return static::makeHashChunkFileName_($this->hash, $this->tempDir, $this->chunks, $index);
    }

    public function createFileIdentifier(): string
    {
        return static::createFileIdentifier_($this->originName, $this->fileTotalSize);
    }

    public function createFileName(): string
    {
        return $this->createFileName_($this->originName, $this->fileTotalSize);
    }

    public function createSaveName(): string
    {
        $path = call_user_func_array($this->pathGenerator, [$this]);

        return Utils::safeMergePath([
            $path,
            $this->createFileName(),
        ]);
    }

    public function getFileChunkStatus(): array
    {
        $hash           = $this->tempData['hash'];
        $result['hash'] = $hash;

        $result['total']          = 0;
        $result['is_completed']   = 0;
        $result['uploaded_chunk'] = [];

        if ($this->enableDb) {
            $info = $this->fileInfoByHash($hash);

            if ($info) {
                $realPath = Utils::safeMergePath([
                    $this->targetDir,
                    $info['path'],
                ]);

                if (($fileInfo = $this->fileInfoByHash($hash)) && is_file($realPath)) {
                    $result['is_exists'] = 1;
                    $result['savename']  = $fileInfo[$this->saveNameField];
                } else {
                    $result['is_exists'] = 0;
                }
            } else {
                $result['is_exists'] = 0;
            }
        }

        if ($result['is_exists'] == 0) {
            $result['is_merge'] = 1;

            $result['total']        = $this->tempData['total'];
            $result['is_completed'] = (int)($this->tempData['total'] == count($this->tempData['tmp']));

            foreach ($this->tempData['tmp'] as $k => $v) {
                $index = $k - 1;

                $result['uploaded_chunk'][$index] = [
                    "time"    => $v['create_time'],
                    "up_time" => $v['up_time'],
                ];
            }
        } else {
            $result['is_merge'] = 0;
        }

        return $result;
    }

    public function createFileName_($originName, $fileTotalSize): string
    {
        return static::createFileIdentifier_($originName, $fileTotalSize) . '.' . $this->fileExt;
    }


    /**
     * ---------------------------------------------------------
     * ---------------------------------------------------------
     */

    public static function getHashTempFileStatus_($hash, $tempDir): array
    {
        $finder   = new Finder();
        $hashPath = static::makeHashTempPath_($hash, $tempDir);

        $result = [];

        $result['hash']   = $hash;
        $result['tmp']    = [];
        $result['path']   = $hashPath;
        $result['config'] = static::makeConfigFilePath_($hash, $tempDir);
        $result['total']  = -1;

        if (is_dir($hashPath)) {
            $finder->sortByName(true)->files()->in($hashPath)->name('*.tmp');

            if ($finder->hasResults()) {
                foreach ($finder as $file) {
                    //1-10.tmp
                    preg_match('/(\d+)-(\d+)\.tmp/im', $file->getFilename(), $r);
                    $current = $r[1];
                    $total   = $r[2];

                    $createTime = time();

                    try {
                        $createTime = $file->getCTime();
                    } catch (\Exception $exception) {
                    }

                    $result['total']         = (int)$total;
                    $result['tmp'][$current] = [
                        "path"        => $file->getRealPath(),
                        "create_time" => $createTime,
                        "up_time"     => time() - $createTime,
                    ];
                }
            }
        }
        return $result;
    }

    public static function makeHashTempPath_($hash, $tempDir): string
    {
        return Utils::safeMergePath([
            $tempDir,
            $hash,
        ]);
    }

    public static function makeConfigFilePath_($hash, $tempDir): string
    {
        $fileName = implode('.', [
            "config",
            'json',
        ]);

        return Utils::safeMergePath([
            static::makeHashTempPath_($hash, $tempDir),
            $fileName,
        ]);
    }

    public static function makeHashChunkFileName_($hash, $tempDir, $total, $index): string
    {
        $fileName = implode('.', [
            "$index-$total",
            'tmp',
        ]);

        return Utils::safeMergePath([
            static::makeHashTempPath_($hash, $tempDir),
            $fileName,
        ]);
    }

    public static function createFileIdentifier_(string $originName, int $fileTotalSize): string
    {
        $mixture = [
            $originName,
            (string)$fileTotalSize,
        ];

        return md5(implode('', $mixture));
    }

    public static function datePathGenerator(): callable
    {
        return function (WebUploader $uploader): string {
            return implode(DIRECTORY_SEPARATOR, [
                date('Y-m'),
                date('d'),
            ]);
        };
    }

    /**
     * ---------------------------------------------------------
     * ---------------------------------------------------------
     */

    public function addValidator(Validator $v): static
    {
        $this->validators[] = $v;

        return $this;
    }

    public function setPathGenerator(callable $pathGenerator): static
    {
        $this->pathGenerator = $pathGenerator;

        return $this;
    }

    public function setConfig($key, $value): static
    {
        $this->configData[$key] = $value;

        return $this;
    }

    public function getConfig($key): mixed
    {
        return $this->configData[$key] ?? null;
    }

    public function getAllConfig(): array
    {
        return $this->configData;
    }

    public function delConfig($key): static
    {
        if (isset($this->configData[$key])) {
            unset($this->configData[$key]);
        }

        return $this;
    }

    public function writeConfig(): static
    {
        $path = $this->makeConfigFilePath();

        is_dir(dirname($path)) or mkdir(dirname($path));
        file_put_contents($path, json_encode($this->configData, 256));

        return $this;
    }

    public function hasConfig(): bool
    {
        return is_file($this->makeConfigFilePath());
    }

    public function setLogger(?LoggerInterface $logger): static
    {
        $this->logger = $logger;

        return $this;
    }

    public function setTargetDir(string $targetDir): static
    {
        $this->filesystem->mkdir($targetDir);
        $this->targetDir = realpath($targetDir);

        return $this;
    }

    public function setTempDir(string $tempDir): static
    {
        $this->filesystem->mkdir($tempDir);
        $this->tempDir = realpath($tempDir);

        return $this;
    }

    public function setTmpCacheTime(int $tmpCacheTime): static
    {
        $this->tmpCacheTime = $tmpCacheTime;

        return $this;
    }

    public function setHash(?string $hash): static
    {
        $this->hash = $hash;

        return $this;
    }

    public function getOriginName(): string
    {
        return $this->originName;
    }

    public function getUploadedFile(): ?TempFile
    {
        return $this->uploadedFile;
    }

    public function getByteEnd(): ?int
    {
        return $this->byteEnd;
    }

    public function getByteStart(): ?int
    {
        return $this->byteStart;
    }

    public function getFileTotalSize(): ?int
    {
        return $this->fileTotalSize;
    }

    public function getUploadedSize(): ?int
    {
        return $this->uploadedSize;
    }

    public function getErrorMsg(): string
    {
        return $this->errorMsg;
    }

    public function isHasError(): bool
    {
        return $this->hasError;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function getFileExt(): string
    {
        return $this->fileExt;
    }

    public function validate(): static
    {
        //chunk 逻辑错误
        if (($this->chunk < 1) or ($this->chunk > $this->chunks)) {
            $this->hasError = true;
            $this->errorMsg = 'chunk 参数错误';
        }

        if (is_null($this->pathGenerator)) {
            $this->hasError = true;
            $this->errorMsg = 'pathGenerator 参数错误';
        }

        if (!is_dir($this->tempDir)) {
            $this->filesystem->mkdir($this->tempDir);
        }

        if (!is_dir($this->tempDir) or !is_readable($this->tempDir)) {
            throw new \Exception($this->tempDir . ' 没有读权限');
        }

        $validators = $this->validators;
        while (!$this->hasError && $validator = array_pop($validators)) {
            $validator->validate($this->getUploadedFile(), $this);

            if (!$validator->isValid()) {
                $this->hasError = true;
                $this->errorMsg = $validator->getErrorMsg();
            }
        }

        return $this;
    }

    public function mergeFile(): static
    {
        if (!count($this->tempData['tmp'])) {
            $this->hasError = true;
            $this->errorMsg = '没有分片数据';

            return $this;
        }

        $data = $this->tempData;

        if (!($data['total'] == count($data['tmp']))) {
            $this->hasError = true;
            $this->errorMsg = '分片不完整';

            return $this;
        }

        $toSavePath = Path::makeAbsolute($this->configData['saveName'], $this->targetDir);

        $this->filesystem->mkdir(dirname($toSavePath));

        if (is_file($toSavePath)) {
            try {
                $this->filesystem->remove($toSavePath);
            } catch (\Exception $exception) {
                $s = $exception->getMessage();
            }
        }

        $files = [];
        foreach ($data['tmp'] as $k => $v) {
            $index         = $k - 1;
            $files[$index] = $v['path'];
        }

        $result = Utils::mergeFiles($files, $toSavePath, $this->mergeProcessorCallback);

        if ($result) {
            $event = new FileMergedSuccessfulEvent($toSavePath, $this, $this->getAllConfig());
            $this->eventDispatcher->dispatch($event, FileMergedSuccessfulEvent::NAME);

            try {
                $this->filesystem->remove($this->tempData['path']);
            } catch (\Exception $exception) {
                $s = $exception->getMessage();
            }

            return $this;
        } else {
            $this->hasError = true;
            $this->errorMsg = '合并失败';

            return $this;
        }
    }

    public function moveFile(): bool
    {
        $fileName = $this->makeHashChunkFileName($this->chunk);
        $filePath = $this->makeHashTempPath();

        if (!$this->hasConfig()) {
            $this->setConfig('fileTotalSize', $this->fileTotalSize);
            $this->setConfig('totalChunks', $this->chunks);
            $this->setConfig('fileExt', $this->fileExt);
            $this->setConfig('saveName', $this->createSaveName());
            $this->setConfig('hash', static::createFileIdentifier_($this->originName, $this->fileTotalSize));
            $this->setConfig('originName', $this->originName);
            $this->setConfig('type', $this->type);
            $this->writeConfig();
        }

        try {
            $this->filesystem->mkdir($filePath);
        } catch (\Exception $exception) {
            $s = $exception->getMessage();
        }

        $result = true;

        //分片传过,不复制
        if (!(is_file($fileName) && (filesize($fileName) == $this->uploadedSize))) {
            $result = Utils::copyLargeFile($this->uploadedFile, $fileName);

            if (!$result) {
                throw new \Exception('文件复制出错 : ' . $fileName);
            }

            try {
                $this->filesystem->remove($this->uploadedFile->getPathname());
            } catch (\Exception $exception) {
                $s = $exception->getMessage();
            }
        }

        $this->initIsAllChunkUploaded();

        return $result;
    }

    public function isAllChunkUploaded(): bool
    {
        return $this->isAllChunkUploaded;
    }

    public function initDb($dbName, $table, $config): static
    {
        $this->db = Db::getIns($dbName, $table, $config);

        return $this;
    }

    public function setHashField(?string $hashField): static
    {
        $this->hashField = $hashField;

        return $this;
    }

    public function setSaveNameField(?string $saveNameField): static
    {
        $this->saveNameField = $saveNameField;

        return $this;
    }

    public function addFileMergedSuccessfulListener(callable $callback): static
    {
        $this->eventDispatcher->addListener(FileMergedSuccessfulEvent::NAME, $callback);

        return $this;
    }

    public function setEnableDb(bool $enableDb): static
    {
        $this->enableDb = $enableDb;

        if ($this->enableDb) {
            $this->addFileMergedSuccessfulListener(function (FileMergedSuccessfulEvent $event, string $eventName, EventDispatcherInterface $dispatcher) {
                $uploader = $event->getWebuploader();

                if (is_callable($this->insertCallback)) {
                    if (!$uploader->isFileExistsByHash($uploader->getConfig('hash'))) {
                        $data = call_user_func_array($this->insertCallback, [$this]);

                        $uploader->insertToDb($data);
                    }
                }
            });
        }
        return $this;
    }

    public function setFieldMap(callable $callback): static
    {
        $this->insertCallback = $callback;

        return $this;
    }

    public function clearTempFile(): void
    {
        $this->finder->sortByName(true)->files()->in($this->tempDir)->name('*.tmp');

        $tmps = [];

        if ($this->finder->hasResults()) {
            $this->log('临时文件数 : ' . count($this->finder));

            foreach ($this->finder as $file) {
                $createTime = time();

                try {
                    $createTime = $file->getCTime();
                } catch (\Exception $exception) {
                }

                //1-10.tmp
                preg_match('/(\d+)-(\d+)\.tmp/im', $file->getFilename(), $r);
                $total   = $r[2];
                $current = $r[1];
                $hash    = pathinfo($file->getPath(), PATHINFO_FILENAME);

                $tmps[$hash]['path']          = $file->getRelativePath();
                $tmps[$hash]['config']        = dirname($file->getRealPath()) . DIRECTORY_SEPARATOR . 'config.json';
                $tmps[$hash]['total']         = (int)$total;
                $tmps[$hash]['tmp'][$current] = [
                    "path"    => $file->getRealPath(),
                    "up_time" => time() - $createTime,
                ];
            }
        }

        foreach ($tmps as $v) {
            if (count($v['tmp'])) {
                $tmp = $v['tmp'];

                $min = 0;

                foreach ($tmp as $k1 => $v1) {
                    ($min == 0) && ($min = $v1['up_time']);

                    if ($v1['up_time'] < $min) {
                        $min = $v1['up_time'];
                    }
                }

                if ($min > $this->tmpCacheTime) {
                    $this->log('删除文件夹 : ' . dirname($v['config']) . ": [$min S]");
                    $this->filesystem->remove(dirname($v['config']));
                } else {
                    $this->log('--文件夹 : ' . dirname($v['config']) . ": [$min S]");
                }
            }
        }
    }

    public function log($msg, $level = 'debug'): static
    {
        $level = strtolower($level);

        $logLevels = [
            'debug',
            'info',
            'notice',
            'warning',
            'error',
            'critical',
            'alert',
        ];

        if (in_array($level, $logLevels)) {
            if (!is_null($this->logger)) {
                $this->logger->{$level}($msg . PHP_EOL);
            }
        }

        return $this;
    }


    public function setMergeProcessorCallback($mergeProcessorCallback): static
    {
        $this->mergeProcessorCallback = $mergeProcessorCallback;

        return $this;
    }

    /**
     * ---------------------------------------------------------
     * ---------------------------------------------------------
     */

    protected function initConfig($file): static
    {
        if (is_file($file)) {
            $this->configData = json_decode(file_get_contents($file), true);
        }

        return $this;
    }

    protected function initIsAllChunkUploaded(): void
    {
        $i = $this->chunks;

        do {
            $fileName = $this->makeHashChunkFileName($i);

            $yes = is_file(Path::makeAbsolute($fileName, $this->tempDir));
            $i--;
        } while (($i >= 1) && $yes);

        $this->isAllChunkUploaded = $yes;
    }

    protected function isFileExistsByHash($hash): bool
    {
        return !!$this->db->getDbHandler()->where($this->hashField, $hash)->find();
    }

    protected function fileInfoByHash($hash)
    {
        return $this->db->getDbHandler()->where($this->hashField, $hash)->find();
    }

    protected function insertToDb($data): bool
    {
        return !!$this->db->getDbHandler()->insert($data);
    }

    protected function initConfigData(): static
    {
        $tempData       = $this->getHashTempFileStatus();
        $this->tempData = $tempData;

        $this->initConfig($tempData['config']);

        return $this;
    }

    protected function setUploadedFileInfo(array $uploadedFileInfo): static
    {
        $this->uploadedFileInfo = $uploadedFileInfo;

        if (!isset($uploadedFileInfo['tmp_name'])) {
            throw new \Exception('$_FILES 参数错误');
        }

        $this->uploadedFile = new TempFile($this->uploadedFileInfo['tmp_name']);

        //$_FILES 中的错误
        if (isset($this->errors[$this->uploadedFileInfo['error']])) {
            throw new \Exception($this->errors[$this->uploadedFileInfo['error']]);
        }

        return $this;
    }

    protected function init(): static
    {
        if (!$this->isInited) {
            $this->isInited = true;
            $this->SERVER_  = $_SERVER;
            $this->POST_    = $_POST;

            $this->uploadedFile = TempFile::ins($this->uploadedFileInfo['tmp_name']);
            $this->originName   = $this->uploadedFileInfo['name'];
            $this->fileExt      = trim(pathinfo($this->originName, PATHINFO_EXTENSION));
            $this->uploadedSize = (int)$this->uploadedFile->getSize();

            $this->type          = $this->POST_['type'];
            $this->fileTotalSize = (int)$this->POST_['size'];

            if (isset($this->POST_['chunk'])) {
                $this->chunk  = (int)$this->POST_['chunk'] + 1;
                $this->chunks = (int)$this->POST_['chunks'];
            }

            if (isset($this->SERVER_['HTTP_CONTENT_RANGE'])) {
                preg_match('%bytes\s+(\d+)-(\d+)/(\d+)%uim', $this->SERVER_['HTTP_CONTENT_RANGE'], $result);
                if (count($result) == 4) {
                    $this->byteStart = (int)$result[1];
                    $this->byteEnd   = (int)$result[2];
                }
            }
        }

        return $this;
    }
}
