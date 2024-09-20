<?php

    use Coco\webuploader\WebUploader;
    use Monolog\Logger;
    use Monolog\Handler\StreamHandler;

    require '../vendor/autoload.php';

    $tmp    = './runtime/tmp';
    $target = './runtime/target';

    try
    {
        $log           = new Logger('my_logger');
//        $streamHandler = new StreamHandler('php://output', Logger::DEBUG);
//        $log->pushHandler($streamHandler);

        $result = [];
        $hash   = ($_REQUEST['hash']) ?? '769f995964d0244fa0a36e4552092295';

        $uploader = WebUploader::getInsForGetChunkStatus($hash, $target, $tmp);
        $uploader->setSaveNameField('path');
        $uploader->setHashField('hash');

        $dbName = 'webuploader';
        $table  = 'files22';
        $config = [
            'hostname' => '127.0.0.1',
            'password' => 'root',
            'username' => 'root',
        ];

        $uploader->initDb($dbName, $table, $config)->setEnableDb(true);

        $result['code'] = 1;
        $result['data'] = $uploader->getFileChunkStatus();

    }
    catch (\Exception $exception)
    {
        $result['code'] = 0;
        $result['msg']  = $exception->getMessage();
    }

    echo json_encode($result);


