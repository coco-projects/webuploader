<?php

    namespace Coco\webuploader;

    use Coco\webuploader\traits\Statization;

class TempFile extends \SplFileInfo
{
    use Statization;

    public function __construct(string $fileName)
    {
        parent::__construct($fileName);
    }
}
