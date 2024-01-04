<?php

    namespace Coco\webuploader\Validator;

    use Coco\webuploader\TempFile;
    use Coco\webuploader\WebUploader;

class SizeValidator extends Validator
{
    const FILE_SIZE_IS_TOO_LARGE = 0;
    const FILE_SIZE_IS_TOO_SMALL = 1;

    protected int $maxSize;

    protected int $minSize = 0;

    protected array $errorMessages = [
        self::FILE_SIZE_IS_TOO_LARGE => "The uploaded file is too large",
        self::FILE_SIZE_IS_TOO_SMALL => "The uploaded file is too small",
    ];


    public function __construct(int $maxSize, int $minSize = 0)
    {
        $this->setMaxSize($maxSize);
        $this->setMinSize($minSize);
    }

    public function setMaxSize(int $maxSize): static
    {
        $max = $maxSize;

        if ($max < 0) {
            throw new \Exception("Invalid File Max_Size");
        }

        $this->maxSize = $max;

        return $this;
    }

    public function setMinSize(int $minSize): static
    {
        $min = $minSize;

        if ($min < 0) {
            throw new \Exception("Invalid File Min_Size");
        }

        $this->minSize = $min;

        return $this;
    }

    public function validate(TempFile $file, WebUploader $uploader): bool
    {
        if ($uploader->getFileTotalSize() < $this->minSize) {
            $this->errorMsg = $this->errorMessages[self::FILE_SIZE_IS_TOO_SMALL];
            $this->isValid  = false;
        }

        if ($uploader->getFileTotalSize() > $this->maxSize) {
            $this->errorMsg = $this->errorMessages[self::FILE_SIZE_IS_TOO_LARGE];
            $this->isValid  = false;
        }

        return $this->isValid;
    }
}
