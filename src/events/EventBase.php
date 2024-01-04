<?php

    namespace Coco\webuploader\events;

    use Coco\webuploader\WebUploader;
    use Symfony\Contracts\EventDispatcher\Event;

class EventBase extends Event
{
    protected ?WebUploader $webuploader = null;

    public function __construct(?WebUploader $webuploader)
    {
        $this->setWebuploader($webuploader);
    }

    public function setWebuploader(?WebUploader $webuploader): static
    {
        $this->webuploader = $webuploader;

        return $this;
    }

    public function getWebuploader(): ?WebUploader
    {
        return $this->webuploader;
    }
}
