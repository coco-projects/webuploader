<?php

    use Coco\sse\SSE;

    require '../../vendor/autoload.php';


    $processor = new \Coco\sse\processor\StrandardProcessor();

    SSE::init($processor);

    $len = 5;

    for ($i = 0; $i < $len; $i++)
    {
        SSE::getEventIns('update')->send('data-' . $i);
        sleep(1);
    }