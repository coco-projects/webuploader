<?php

    namespace Coco\webuploader\Validator;

    use Coco\webuploader\TempFile;
    use Coco\webuploader\WebUploader;

class MimeTypeValidator extends Validator
{
    const INVALID_MIMETYPE = 0;
    protected array $mimeTypes;
    protected array $errorMessages = [
        self::INVALID_MIMETYPE => "The uploaded filetype (mimetype) is invalid",
    ];

    public function __construct(array $validMimeTypes)
    {
        $this->mimeTypes = $validMimeTypes;
        $this->isValid   = true;
    }

    public function validate(TempFile $file, WebUploader $uploader): bool
    {
        if (!in_array($uploader->getType(), $this->mimeTypes)) {
            $this->errorMsg = $this->errorMessages[self::INVALID_MIMETYPE];
            $this->isValid  = false;
        }

        return $this->isValid;
    }
}
