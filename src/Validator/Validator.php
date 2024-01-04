<?php

    namespace Coco\webuploader\Validator;

    use Coco\webuploader\TempFile;
    use Coco\webuploader\traits\Statization;
    use Coco\webuploader\WebUploader;

abstract class Validator
{
    use Statization;

    protected bool $isValid = true;

    protected ?string $errorMsg = null;

    abstract public function validate(TempFile $file, WebUploader $uploader): bool;

    /**
     * @return string|null
     */
    public function getErrorMsg(): ?string
    {
        return $this->errorMsg;
    }

    /**
     * @return bool
     */
    public function isValid(): bool
    {
        return $this->isValid;
    }
}
