<?php

    use Coco\webuploader\Validator\SizeValidator;
    use Coco\webuploader\WebUploader;
    use Monolog\Logger;
    use Monolog\Handler\StreamHandler;

    require '../vendor/autoload.php';

    //客户端使用webuploader

    $tmp    = './runtime/tmp';
    $target = './runtime/target';

    $result = [];

    try
    {
        $log           = new Logger('my_logger');
        $streamHandler = new StreamHandler('php://output', Logger::DEBUG);
        $log->pushHandler($streamHandler);

        $uploader = WebUploader::getInsForUploader($_FILES['test_images'], $target, $tmp, $log);

        $uploader->setPathGenerator(function(WebUploader $uploader): string {
            $originalString = $uploader->createFileName();

            return implode(DIRECTORY_SEPARATOR, [
                date('Y-m-d'),
                substr($originalString, 0, 2),
                substr($originalString, 2, 2),
            ]);
        });

        $uploader->setPathGenerator($uploader::datePathGenerator());

        /*
                $uploader->addValidator(SizeValidator::ins(1024 * 1024 * 1));

                $uploader->addValidator(MimeTypeValidator::ins([
                    'image/gif',
                    'image/jpeg',
                    'image/pjpeg',
                    'image/png',
                ]));
        */

        if ($uploader->validate()->isHasError())
        {
            $result['code'] = 0;
            $result['msg']  = $uploader->getErrorMsg();
        }
        else
        {
            if ($uploader->moveFile())
            {
                $result['code']         = 1;
                $result['path']         = $uploader->createSaveName();
                $result['is_completed'] = (int)$uploader->isAllChunkUploaded();
                $result['msg']          = '上传成功';
            }
            else
            {
                $result['code'] = 0;
                $result['msg']  = '上传失败';
            }
        }
    }
    catch (\Exception $exception)
    {
        $result['code'] = 0;
        $result['msg']  = $exception->getMessage();
    }

    echo json_encode($result);


