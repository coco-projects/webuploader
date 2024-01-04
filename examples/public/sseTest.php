<?php

    use Coco\webuploader\EventSource;
    use Coco\webuploader\WebUploader;
    use Monolog\Logger;
    use Monolog\Handler\StreamHandler;

    require '../../vendor/autoload.php';

//    $updateEvent = EventSource::getIns('update');

    $len = 5;

    for ($i = 0; $i < $len; $i++)
    {
        EventSource::getIns('update')->send('data-' . $i);
        sleep(1);
    }