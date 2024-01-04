<?php

    namespace Coco\webuploader;

class EventSource
{
    /**
     * @var $instances EventSource[]
     */
    private static array $instances = [];
    private static bool  $inited    = false;
    private int          $retry     = 5;
    private int          $id        = 0;


    public function __construct(private string $eventName)
    {
    }

    public static function getIns($eventName): static
    {
        static::init();

        if (!isset(static::$instances[$eventName])) {
            static::$instances[$eventName] = new static($eventName);
        }

        return static::$instances[$eventName];
    }

    public function getEventName(): string
    {
        return $this->eventName;
    }

    public function setRetry(int $retry): static
    {
        $this->retry = $retry;

        return $this;
    }

    private static function init(): void
    {
        if (!static::$inited) {
            ignore_user_abort(true);

            //Disable time limit
            @set_time_limit(0);

            //Initialize the output buffer
            if (function_exists('apache_setenv')) {
                @apache_setenv('no-gzip', 1);
            }

            @ini_set('zlib.output_compression', 0);
            @ini_set('implicit_flush', 1);

            while (ob_get_level() != 0) {
                ob_end_flush();
            }

            ob_implicit_flush(1);
            ob_start();

            header('Content-type: text/event-stream');
            header('Cache-Control: no-cache');
            header('X-Accel-Buffering: no');
            header("Content-Encoding: none");

            static::$inited = true;
        }
    }

    private function getNextId(): int
    {
        $this->id++;

        return $this->id;
    }

    public function send($data): void
    {
        $id = $this->getNextId();

        $msg = implode(PHP_EOL, [
            "id:$id",
            "event:" . $this->eventName,
            "retry:" . $this->retry,
            "data:$data",
        ]);

        echo $msg . PHP_EOL . PHP_EOL;

        ob_flush();
        flush();
    }
}
