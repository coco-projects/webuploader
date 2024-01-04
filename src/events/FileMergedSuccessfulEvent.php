<?php

    namespace Coco\webuploader\events;

    use Coco\webuploader\WebUploader;

class FileMergedSuccessfulEvent extends EventBase
{
    const NAME = 'FileMergedSuccessful';

    protected ?\SplFileInfo $fileObject = null;

    public array $data = [];

    public function __construct(string $file, WebUploader $webuploader, array $data)
    {
        $this->fileObject = new \SplFileInfo($file);
        $this->data       = $data;

        parent::__construct($webuploader);
    }

    public function getFileObject(): ?\SplFileInfo
    {
        return $this->fileObject;
    }

    public function getData(): array
    {
        return $this->data;
    }

    public function getDataByKey($key): mixed
    {
        return $this->data[$key] ?? null;
    }
}
