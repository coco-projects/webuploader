<?php

    use Coco\webuploader\WebUploader;
    use Monolog\Logger;
    use Monolog\Handler\StreamHandler;

    require '../vendor/autoload.php';

    $tmp    = './runtime/tmp';
    $target = './runtime/target';

    $log           = new Logger('my_logger');
    $streamHandler = new StreamHandler('php://output', Logger::DEBUG);
    $log->pushHandler($streamHandler);

    $uploader = WebUploader::getInsForClearTmp($tmp, 7200, $log);
    $uploader->clearTempFile();