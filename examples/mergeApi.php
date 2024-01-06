<?php

    use Coco\sse\processor\StrandardProcessor;
    use Coco\sse\SSE;
    use Coco\webuploader\events\FileMergedSuccessfulEvent;
    use Coco\webuploader\EventSource;
    use Coco\webuploader\WebUploader;
    use Godruoyi\Snowflake\Snowflake;
    use Monolog\Logger;
    use Monolog\Handler\StreamHandler;
    use Symfony\Component\EventDispatcher\EventDispatcherInterface;

    require '../vendor/autoload.php';

    $tmp    = './runtime/tmp';
    $target = './runtime/target';

    try
    {
        $log           = new Logger('my_logger');
        $streamHandler = new StreamHandler('php://output', Logger::DEBUG);
        $log->pushHandler($streamHandler);

        $result   = [];
        $hash     = ($_REQUEST['hash']) ?? '53d98663ea900c1dc65325c7cbbd7edf';
        $uploader = WebUploader::getInsForMerge($hash, $target, $tmp);

        $dbName = 'webuploader';
        $table  = 'files22';
        $config = [
            'hostname' => '127.0.0.1',
            'password' => 'root',
            'username' => 'root',
        ];

        $uploader->initDb($dbName, $table, $config)->setEnableDb(true);
        $uploader->setHashField('hash');

        $uploader->setFieldMap(function(WebUploader $uploader) {
            $snowflake = new Snowflake;

            //字段名自定义，跟建表的字段保持一致即可，
            return [
                "id"     => $snowflake->id(),
                "hash"   => $uploader->getConfig('hash'),
                "size"   => $uploader->getConfig('fileTotalSize'),
                "ext"    => $uploader->getConfig('fileExt'),
                "path"   => $uploader->getConfig('saveName'),
                "name"   => $uploader->getConfig('originName'),
                "mime"   => $uploader->getConfig('type'),
                "remark" => "",
                "time"   => time(),
            ];
        });

        $uploader->addFileMergedSuccessfulListener(function(FileMergedSuccessfulEvent $event, string $eventName, EventDispatcherInterface $dispatcher) {
            $uploader = $event->getWebuploader();
            $savename = $uploader->getConfig('originName');
            file_put_contents('runtime/test.txt', $savename . PHP_EOL, 8);
        });

        SSE::init(new StrandardProcessor());

        $uploader->setMergeProcessorCallback(function($process) {
            SSE::getEventIns('process')->send(json_encode([
                "process" => $process,
            ]));
        });

        if ($uploader->mergeFile()->isHasError())
        {
            $result['code'] = 0;
            $result['msg']  = $uploader->getErrorMsg();
        }
        else
        {
            $result['code']     = 1;
            $result['msg']      = 'success';
            $result['savename'] = $uploader->getConfig('saveName');
        }
    }
    catch (\Exception $exception)
    {
        $result['code'] = 0;
        $result['msg']  = $exception->getMessage();
    }

    SSE::getEventIns('msg')->send(json_encode($result));